import { getConnectionPool, sql } from '@cacsms/database'

export type AgentCollaborationsQuery = { q?: string; type?: string; status?: string; phase?: string; supervisor?: string; consensus?: string; finalOutput?: string; riskRange?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for agent collaborations.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AgentCollaborationsQuery) {
  const where = ['organization_id=@org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(collaboration_code LIKE @q OR objective LIKE @q OR workflow_name LIKE @q OR supervisor LIKE @q OR current_phase LIKE @q)')
  }
  ;[
    ['status', 'status'],
    ['phase', 'current_phase'],
    ['supervisor', 'supervisor'],
    ['consensus', 'consensus_state'],
    ['finalOutput', 'final_output_state'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AgentCollaborationsQuery]
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

async function byCollab(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE collaboration_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentCollaborationsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_collaboration_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: AgentCollaborationsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_agent_collaborations WHERE ${where} ORDER BY CASE WHEN status='Conflict' THEN 0 WHEN status='Recovering' THEN 1 WHEN status='Active' THEN 2 ELSE 3 END, risk DESC, updated_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_agent_collaborations WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  types: () => byOrgView('vw_agent_collaboration_types', 'health_percent ASC, collaboration_type'),
  health: () => byOrgView('vw_agent_collaboration_health', 'health_percent ASC, service_name'),
  pipeline: () => byOrgView('vw_agent_collaboration_pipeline', 'created_at, stage_name'),
  members: () => byOrgView('vw_agent_collaboration_members', 'collaboration_code, agent_name'),
  context: () => byOrgView('vw_agent_collaboration_context', 'freshness ASC, collaboration_code'),
  memory: () => byOrgView('vw_agent_collaboration_memory', 'retrieval_health ASC, collaboration_code'),
  messages: () => byOrgView('vw_agent_collaboration_messages', 'created_at DESC'),
  delegations: () => byOrgView('vw_agent_collaboration_delegations', 'deadline ASC, collaboration_code'),
  consensus: () => byOrgView('vw_agent_collaboration_consensus', 'confidence DESC, collaboration_code'),
  conflicts: () => byOrgView('vw_agent_collaboration_conflicts', 'resolved ASC, risk DESC'),
  handoffs: () => byOrgView('vw_agent_collaboration_handoffs', 'success_rate ASC, collaboration_code'),
  learning: () => byOrgView('vw_agent_collaboration_learning', 'created_at DESC'),
  recovery: () => byOrgView('vw_agent_collaboration_recovery', 'health_percent ASC, collaboration_code'),
  finalOutput: () => byOrgView('vw_agent_collaboration_final_output', 'readiness ASC, collaboration_code'),
  membersFor: (id: string) => byCollab('ai_agent_collaboration_members', id),
  contextFor: (id: string) => byCollab('ai_agent_collaboration_context', id),
  memoryFor: (id: string) => byCollab('ai_agent_collaboration_memory', id),
  messagesFor: (id: string) => byCollab('ai_agent_collaboration_messages', id),
  consensusFor: (id: string) => byCollab('ai_agent_collaboration_consensus', id),
  conflictsFor: (id: string) => byCollab('ai_agent_collaboration_conflicts', id),
  handoffsFor: (id: string) => byCollab('ai_agent_collaboration_handoffs', id),
  recoveryFor: (id: string) => byCollab('ai_agent_collaboration_recovery', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_agent_collaborations WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'phase', current_phase FROM vw_agent_collaborations WHERE organization_id=@org GROUP BY current_phase
      UNION ALL SELECT 'supervisor', supervisor FROM vw_agent_collaborations WHERE organization_id=@org GROUP BY supervisor
      UNION ALL SELECT 'consensus', consensus_state FROM vw_agent_collaborations WHERE organization_id=@org GROUP BY consensus_state
      UNION ALL SELECT 'finalOutput', final_output_state FROM vw_agent_collaborations WHERE organization_id=@org GROUP BY final_output_state
      UNION ALL SELECT 'type', collaboration_type FROM vw_agent_collaboration_types WHERE organization_id=@org GROUP BY collaboration_type
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AgentCollaborationsRepository = agentCollaborationsRepository
