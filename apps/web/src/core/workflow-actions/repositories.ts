import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowActionsQuery = { q?: string; status?: string; category?: string; actionType?: string; environment?: string; queue?: string; workerPool?: string; permission?: string; owner?: string; organization?: string; retryEnabled?: string; recoveryEnabled?: string; idempotent?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow actions.')
  return String(row.id)
}

function booleanFilter(value?: string) {
  return value === 'true' || value === '1' || value === 'Yes'
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowActionsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(action_code LIKE @q OR action_name LIKE @q OR description LIKE @q OR category LIKE @q OR action_type LIKE @q OR worker_pool LIKE @q)')
  }
  ;[
    ['status', 'status'], ['category', 'category'], ['actionType', 'action_type'], ['environment', 'environment'], ['queue', 'queue_name'],
    ['workerPool', 'worker_pool'], ['permission', 'required_permission'], ['owner', 'owner'], ['organization', 'organization'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowActionsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  ;[
    ['retryEnabled', 'retry_enabled'], ['recoveryEnabled', 'recovery_enabled'], ['idempotent', 'idempotency_enabled'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowActionsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.Bit, booleanFilter(value))
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

export const workflowActionsRepository = {
  organizationId,
  async list(query: WorkflowActionsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_actions_list WHERE ${where} ORDER BY CASE WHEN status IN ('invalid','warning','disabled') THEN 0 ELSE 1 END, executions_today DESC, action_name`)
    return result.recordset.map(camel)
  },
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM vw_action_executions e WHERE e.organization_id = @org AND e.status IN ('Queued','Running','Retrying','Recovering')) AS actions_in_progress,
        (SELECT COUNT(*) FROM vw_action_executions e WHERE e.organization_id = @org AND e.status = 'Queued') AS queued_actions,
        (SELECT COUNT(*) FROM vw_action_executions e WHERE e.organization_id = @org AND e.status = 'Failed') AS failed_actions_count,
        (SELECT COUNT(*) FROM vw_action_recoveries r WHERE r.organization_id = @org AND r.outcome = 'in_progress') AS recoveries_in_progress,
        (SELECT COUNT(*) FROM vw_action_circuit_breakers cb WHERE cb.organization_id = @org AND cb.state IN ('Open','Half Open')) AS circuit_breakers_open,
        (SELECT COUNT(*) FROM vw_workflow_actions_list a WHERE a.organization_id = @org AND a.rate_limit <= 60) AS rate_limited_actions,
        COALESCE((SELECT TOP 1 cb.dependency FROM vw_action_circuit_breakers cb WHERE cb.organization_id = @org AND cb.state IN ('Open','Half Open') ORDER BY cb.updated_at DESC, cb.created_at DESC), 'none detected') AS current_bottleneck
      FROM vw_action_engine_summary s WHERE s.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async categories() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT category, COUNT(*) AS total_actions, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_actions,
        SUM(executions_today) AS executions_today, AVG(success_rate) AS success_rate, SUM(CASE WHEN failure_rate > 0 THEN 1 ELSE 0 END) AS actions_with_failures,
        AVG(avg_duration_ms) AS average_duration_ms, SUM(total_cost) AS cost_today, AVG(recovery_rate) AS recovery_rate,
        AVG(CASE WHEN status = 'active' THEN 96.0 WHEN status = 'warning' THEN 74.0 ELSE 62.0 END) AS health_percent
      FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY category ORDER BY category
    `)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_actions_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow action not found: ${id}`)
    return camel(result.recordset[0])
  },
  async byAction(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_action_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  versions(id: string) { return this.byAction(id, 'workflow_action_versions', 'created_at DESC') },
  executions(id: string) { return this.byAction(id, 'vw_action_executions', 'created_at DESC') },
  validation(id: string) { return this.byAction(id, 'workflow_action_validation_runs', 'validated_at DESC') },
  tests(id: string) { return this.byAction(id, 'workflow_action_test_runs', 'created_at DESC') },
  trace(id: string) { return getConnectionPool().then((pool) => pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT s.* FROM workflow_action_execution_steps s JOIN workflow_action_executions e ON e.id = s.workflow_action_execution_id WHERE e.workflow_action_id = @id ORDER BY s.created_at DESC')).then((result) => result.recordset.map(camel)) },
  executionsFeed() { return byOrgView('vw_action_executions', 'created_at DESC') },
  recoveries() { return byOrgView('vw_action_recoveries', 'created_at DESC') },
  circuitBreakers() { return byOrgView('vw_action_circuit_breakers', `CASE WHEN state IN ('Open','Half Open') THEN 0 ELSE 1 END, created_at DESC`) },
  performance() { return byOrgView('vw_action_performance', 'executions_today DESC') },
  recommendations() { return byOrgView('vw_action_recommendations', 'created_at DESC') },
  finalOutputLinkage() { return byOrgView('vw_action_final_output_linkage', 'readiness_percent DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'category', category FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY category
      UNION ALL SELECT 'actionType', action_type FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY action_type
      UNION ALL SELECT 'environment', environment FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'queue', queue_name FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY queue_name
      UNION ALL SELECT 'workerPool', worker_pool FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY worker_pool
      UNION ALL SELECT 'permission', required_permission FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY required_permission
      UNION ALL SELECT 'owner', owner FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY owner
      UNION ALL SELECT 'organization', organization FROM vw_workflow_actions_list WHERE organization_id = @org GROUP BY organization
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowActionRepository = workflowActionsRepository
export const ActionVersionRepository = workflowActionsRepository
export const ActionExecutionRepository = workflowActionsRepository
export const ActionRecoveryRepository = workflowActionsRepository
export const ActionCircuitBreakerRepository = workflowActionsRepository
export const ActionMetricsRepository = workflowActionsRepository
export const ActionRecommendationRepository = workflowActionsRepository
