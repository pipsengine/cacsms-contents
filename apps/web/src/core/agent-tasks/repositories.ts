import { getConnectionPool, sql } from '@cacsms/database'

export type AgentTasksQuery = { q?: string; category?: string; workflow?: string; stage?: string; agent?: string; role?: string; priority?: string; status?: string; queue?: string; provider?: string; model?: string; recovery?: string; output?: string; riskRange?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for agent tasks.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AgentTasksQuery) {
  const where = ['organization_id=@org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(task_code LIKE @q OR task_name LIKE @q OR description LIKE @q OR category LIKE @q OR workflow_name LIKE @q OR agent_name LIKE @q)')
  }
  ;[
    ['category', 'category'],
    ['workflow', 'workflow_name'],
    ['stage', 'workflow_stage'],
    ['agent', 'agent_name'],
    ['role', 'role_name'],
    ['priority', 'priority'],
    ['status', 'status'],
    ['queue', 'queue_name'],
    ['provider', 'provider'],
    ['model', 'model'],
    ['recovery', 'recovery_state'],
    ['output', 'output_state'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AgentTasksQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column}=@${key}`)
    }
  })
  if (query.riskRange === 'High') where.push('risk >= 70')
  if (query.riskRange === 'Medium') where.push('risk >= 40 AND risk < 70')
  if (query.riskRange === 'Low') where.push('risk < 40')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byTask(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE task_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentTasksRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_tasks_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async tasks(query: AgentTasksQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_agent_tasks WHERE ${where} ORDER BY CASE WHEN status='Blocked' THEN 0 WHEN priority='Critical' THEN 1 WHEN status='Recovering' THEN 2 WHEN status='Running' THEN 3 ELSE 4 END, deadline ASC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_agent_tasks WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('vw_agent_task_categories', 'health_percent ASC, category_name'),
  lifecycle: () => byOrgView('vw_agent_task_lifecycle', 'created_at, stage_name'),
  health: () => byOrgView('vw_agent_task_health', 'health_percent ASC, service_name'),
  dependencies: () => byOrgView('vw_agent_task_dependencies', 'critical_path DESC, task_code'),
  priority: () => byOrgView('vw_agent_task_priority', 'final_priority DESC, task_code'),
  validation: () => byOrgView('vw_agent_task_validation', 'validation_score ASC, task_code'),
  recovery: () => byOrgView('vw_agent_task_recovery', 'health_percent ASC, task_code'),
  recommendations: () => byOrgView('vw_agent_task_recommendations', 'auto_apply_eligible DESC, confidence DESC'),
  dependenciesForTask: (id: string) => byTask('ai_agent_task_dependencies', id),
  priorityForTask: (id: string) => byTask('ai_agent_task_priority', id),
  validationForTask: (id: string) => byTask('ai_agent_task_validation', id),
  recoveryForTask: (id: string) => byTask('ai_agent_task_recovery', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category AS value FROM vw_agent_tasks WHERE organization_id=@org GROUP BY category
      UNION ALL SELECT 'workflow', workflow_name FROM vw_agent_tasks WHERE organization_id=@org GROUP BY workflow_name
      UNION ALL SELECT 'stage', workflow_stage FROM vw_agent_tasks WHERE organization_id=@org GROUP BY workflow_stage
      UNION ALL SELECT 'agent', agent_name FROM vw_agent_tasks WHERE organization_id=@org GROUP BY agent_name
      UNION ALL SELECT 'role', role_name FROM vw_agent_tasks WHERE organization_id=@org GROUP BY role_name
      UNION ALL SELECT 'priority', priority FROM vw_agent_tasks WHERE organization_id=@org GROUP BY priority
      UNION ALL SELECT 'status', status FROM vw_agent_tasks WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'queue', queue_name FROM vw_agent_tasks WHERE organization_id=@org GROUP BY queue_name
      UNION ALL SELECT 'provider', provider FROM vw_agent_tasks WHERE organization_id=@org GROUP BY provider
      UNION ALL SELECT 'model', model FROM vw_agent_tasks WHERE organization_id=@org GROUP BY model
      UNION ALL SELECT 'recovery', recovery_state FROM vw_agent_tasks WHERE organization_id=@org GROUP BY recovery_state
      UNION ALL SELECT 'output', output_state FROM vw_agent_tasks WHERE organization_id=@org GROUP BY output_state
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AgentTasksRepository = agentTasksRepository
