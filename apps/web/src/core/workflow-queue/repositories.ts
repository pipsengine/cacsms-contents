import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowQueueQuery = { q?: string; queue?: string; status?: string; workflow?: string; priority?: string; effectivePriority?: string; slaStatus?: string; workerType?: string; assignedWorker?: string; recoveryState?: string; organization?: string; brand?: string; finalOutputImpact?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow queue.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowQueueQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_name LIKE @q OR reference_id LIKE @q OR queue_name LIKE @q OR brand LIKE @q)')
  }
  ;[
    ['queue', 'queue_name'], ['status', 'status'], ['workflow', 'workflow_name'], ['priority', 'base_priority'], ['effectivePriority', 'effective_priority'],
    ['slaStatus', 'sla_status'], ['workerType', 'required_worker_type'], ['assignedWorker', 'assigned_worker_id'], ['recoveryState', 'recovery_state'],
    ['organization', 'organization'], ['brand', 'brand'], ['finalOutputImpact', 'final_output_impact'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowQueueQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const workflowQueueRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM workflow_queue_rebalance_events r WHERE r.organization_id = @org) AS automatically_rebalanced,
        (SELECT COUNT(*) FROM vw_workflow_queue_health q WHERE q.organization_id = @org AND q.status IN ('Congested','Degraded','Recovering')) AS queues_at_risk,
        (SELECT TOP 1 detection + ': ' + decision FROM workflow_queue_autonomous_decisions d WHERE d.organization_id = @org ORDER BY d.created_at DESC) AS last_autonomous_decision,
        COALESCE((SELECT TOP 1 queue_name FROM vw_workflow_queue_health q WHERE q.organization_id = @org ORDER BY q.average_wait_seconds DESC), 'none detected') AS current_bottleneck
      FROM vw_workflow_queue_summary s WHERE s.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async queues() { return byOrgView('vw_workflow_queue_health', `CASE WHEN status IN ('Congested','Recovering','Rebalancing') THEN 0 ELSE 1 END, average_wait_seconds DESC`) },
  async items(query: WorkflowQueueQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_queue_items WHERE ${where} ORDER BY CASE WHEN sla_status IN ('at_risk','breached') THEN 0 ELSE 1 END, created_at`)
    return result.recordset.map(camel)
  },
  async getItem(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_queue_items WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow queue item not found: ${id}`)
    return camel(result.recordset[0])
  },
  async itemTable(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE queue_item_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  timeline(id: string) { return this.itemTable(id, 'workflow_queue_item_checkpoints', 'created_at DESC') },
  priorityTrace(id: string) { return this.itemTable(id, 'workflow_queue_item_priority_history', 'created_at DESC') },
  recovery(id: string) { return this.itemTable(id, 'workflow_queue_item_recoveries', 'created_at DESC') },
  congestion() { return byOrgView('vw_workflow_queue_congestion', 'created_at DESC') },
  capacity() { return byOrgView('vw_workflow_queue_capacity', 'match_score DESC') },
  stuckItems() { return byOrgView('vw_workflow_queue_recoveries', 'created_at DESC') },
  deadLetters() { return byOrgView('vw_workflow_queue_dead_letters', 'created_at DESC') },
  slaRisk() { return byOrgView('vw_workflow_queue_sla_risk', 'sla_deadline') },
  performance() { return byOrgView('workflow_queue_metrics m JOIN workflow_queues q ON q.id = m.workflow_queue_id', 'm.queue_depth DESC') },
  decisions() { return byOrgView('workflow_queue_autonomous_decisions', 'created_at DESC') },
  finalOutputImpact() { return byOrgView('vw_workflow_queue_final_output_impact', 'readiness_percent') },
  rebalancing() { return byOrgView('workflow_queue_rebalance_events', 'created_at DESC') },
  retryPolicies() { return byOrgView('workflow_queue_retry_policies rp JOIN workflow_queues q ON q.id = rp.workflow_queue_id', 'rp.current_retries DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'queue' AS kind, queue_name AS value FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY queue_name
      UNION ALL SELECT 'status', status FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'workflow', workflow_name FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY workflow_name
      UNION ALL SELECT 'priority', base_priority FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY base_priority
      UNION ALL SELECT 'effectivePriority', effective_priority FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY effective_priority
      UNION ALL SELECT 'slaStatus', sla_status FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY sla_status
      UNION ALL SELECT 'workerType', required_worker_type FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY required_worker_type
      UNION ALL SELECT 'assignedWorker', assigned_worker_id FROM vw_workflow_queue_items WHERE organization_id=@org AND assigned_worker_id IS NOT NULL GROUP BY assigned_worker_id
      UNION ALL SELECT 'recoveryState', recovery_state FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY recovery_state
      UNION ALL SELECT 'organization', organization FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY organization
      UNION ALL SELECT 'brand', brand FROM vw_workflow_queue_items WHERE organization_id=@org GROUP BY brand
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowQueueRepository = workflowQueueRepository
export const QueueItemRepository = workflowQueueRepository
export const QueuePriorityRepository = workflowQueueRepository
export const QueueCapacityRepository = workflowQueueRepository
export const QueueRebalanceRepository = workflowQueueRepository
export const QueueRetryRepository = workflowQueueRepository
export const QueueRecoveryRepository = workflowQueueRepository
export const QueueDeadLetterRepository = workflowQueueRepository
export const QueueCongestionRepository = workflowQueueRepository
export const QueueSlaRepository = workflowQueueRepository
export const QueueMetricsRepository = workflowQueueRepository
export const QueueDecisionRepository = workflowQueueRepository
export const QueueFinalOutputRepository = workflowQueueRepository
