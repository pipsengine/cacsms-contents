import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowTriggersQuery = { q?: string; triggerType?: string; category?: string; status?: string; source?: string; workflow?: string; environment?: string; organization?: string; owner?: string; priority?: string; deduplication?: string; failureState?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow triggers.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowTriggersQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(trigger_code LIKE @q OR trigger_name LIKE @q OR description LIKE @q OR category LIKE @q OR event_name LIKE @q OR workflow LIKE @q)')
  }
  ;[
    ['triggerType', 'trigger_type'], ['category', 'category'], ['status', 'status'], ['source', 'source'], ['workflow', 'workflow'],
    ['environment', 'environment'], ['organization', 'organization'], ['owner', 'owner'], ['priority', 'priority'], ['deduplication', 'deduplication'], ['failureState', 'failure_policy'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowTriggersQuery]
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

export const workflowTriggersRepository = {
  organizationId,
  async list(query: WorkflowTriggersQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_triggers_list WHERE ${where} ORDER BY CASE WHEN status IN ('failed','invalid','warning') THEN 0 ELSE 1 END, events_received_today DESC`)
    return result.recordset.map(camel)
  },
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM workflow_trigger_events e WHERE e.organization_id = @org AND e.outcome = 'waiting') AS events_waiting,
        (SELECT COUNT(*) FROM workflow_trigger_dead_letters d WHERE d.organization_id = @org AND d.status NOT IN ('Corrected','Replayed','Discarded')) AS dead_letter_count,
        (SELECT TOP 1 event_type FROM workflow_trigger_events e WHERE e.organization_id = @org ORDER BY e.created_at DESC) AS current_bottleneck,
        (SELECT COUNT(*) FROM workflow_trigger_executions x WHERE x.organization_id = @org AND x.retry_used = 1 AND CAST(x.created_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE)) AS autonomous_recovery_actions
      FROM vw_trigger_engine_summary s WHERE s.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async types() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT category, trigger_type, COUNT(*) AS total_triggers, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_triggers,
        SUM(events_received_today) AS events_today, SUM(workflows_started) AS workflows_started, AVG(success_rate) AS success_rate, SUM(failure_count) AS failure_count,
        SUM(duplicate_suppression_count) AS duplicate_suppression, AVG(avg_latency) AS average_latency, MAX(last_event) AS last_event,
        AVG(CASE WHEN status = 'active' THEN 96.0 WHEN status = 'warning' THEN 74.0 ELSE 62.0 END) AS health_percent
      FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY category, trigger_type ORDER BY category
    `)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_triggers_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow trigger not found: ${id}`)
    return camel(result.recordset[0])
  },
  byTrigger(id: string, table: string, orderBy: string) {
    return getConnectionPool().then((pool) => pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_trigger_id = @id ORDER BY ${orderBy}`)).then((result) => result.recordset.map(camel))
  },
  versions(id: string) { return this.byTrigger(id, 'workflow_trigger_versions', 'created_at DESC') },
  executions(id: string) { return this.byTrigger(id, 'workflow_trigger_executions', 'created_at DESC') },
  validation(id: string) { return this.byTrigger(id, 'workflow_trigger_validation_runs', 'validated_at DESC') },
  tests(id: string) { return this.byTrigger(id, 'workflow_trigger_test_runs', 'created_at DESC') },
  events() { return byOrgView('vw_trigger_event_stream', 'created_at DESC') },
  deadLetters() { return byOrgView('vw_trigger_dead_letters', 'created_at DESC') },
  conflicts() { return byOrgView('vw_trigger_conflicts', 'risk_score DESC') },
  performance() { return byOrgView('vw_trigger_performance', 'events_received_today DESC') },
  recommendations() { return byOrgView('vw_trigger_recommendations', 'created_at DESC') },
  finalOutputLinkage() { return byOrgView('vw_trigger_final_output_linkage', 'readiness_percent DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'triggerType' AS kind, trigger_type AS value FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY trigger_type
      UNION ALL SELECT 'category', category FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY category
      UNION ALL SELECT 'status', status FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'source', source FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY source
      UNION ALL SELECT 'workflow', workflow FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY workflow
      UNION ALL SELECT 'environment', environment FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'organization', organization FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY organization
      UNION ALL SELECT 'owner', owner FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY owner
      UNION ALL SELECT 'priority', priority FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'deduplication', deduplication FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY deduplication
      UNION ALL SELECT 'failureState', failure_policy FROM vw_workflow_triggers_list WHERE organization_id = @org GROUP BY failure_policy
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowTriggerRepository = workflowTriggersRepository
export const TriggerSourceRepository = workflowTriggersRepository
export const TriggerSchemaRepository = workflowTriggersRepository
export const TriggerConditionRepository = workflowTriggersRepository
export const TriggerScheduleRepository = workflowTriggersRepository
export const TriggerExecutionRepository = workflowTriggersRepository
export const TriggerEventRepository = workflowTriggersRepository
export const TriggerFailureRepository = workflowTriggersRepository
export const TriggerDeadLetterRepository = workflowTriggersRepository
export const TriggerReplayRepository = workflowTriggersRepository
export const TriggerConflictRepository = workflowTriggersRepository
export const TriggerValidationRepository = workflowTriggersRepository
export const TriggerTestRepository = workflowTriggersRepository
export const TriggerMetricsRepository = workflowTriggersRepository
export const TriggerRecommendationRepository = workflowTriggersRepository
