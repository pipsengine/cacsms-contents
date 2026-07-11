import { getConnectionPool, sql } from '@cacsms/database'

export type AgentRolesTeamsQuery = {
  q?: string
  category?: string
  roleType?: string
  scope?: string
  status?: string
  primaryAgent?: string
  supervisorRole?: string
  failoverEnabled?: string
  workloadRange?: string
  finalOutputResponsibility?: string
  organization?: string
  environment?: string
  owner?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for agent roles and teams.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AgentRolesTeamsQuery) {
  const where = ['organization_id=@org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(role_code LIKE @q OR role_name LIKE @q OR category LIKE @q OR description LIKE @q OR primary_agent_name LIKE @q OR owner LIKE @q)')
  }
  ;[
    ['category', 'category'],
    ['roleType', 'role_type'],
    ['scope', 'scope'],
    ['status', 'status'],
    ['primaryAgent', 'primary_agent_name'],
    ['supervisorRole', 'supervisor_role'],
    ['finalOutputResponsibility', 'final_output_responsibility'],
    ['organization', 'organization_name'],
    ['environment', 'environment'],
    ['owner', 'owner'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AgentRolesTeamsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column}=@${key}`)
    }
  })
  if (query.failoverEnabled === 'Yes') where.push('failover_enabled=1')
  if (query.failoverEnabled === 'No') where.push('failover_enabled=0')
  if (query.workloadRange === 'Overloaded') where.push('current_workload >= 85')
  if (query.workloadRange === 'Underutilized') where.push('current_workload < 50')
  if (query.workloadRange === 'Balanced') where.push('current_workload >= 50 AND current_workload < 85')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byTeam(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE team_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentRolesTeamsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_roles_teams_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async roles(query: AgentRolesTeamsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_agent_roles WHERE ${where} ORDER BY CASE WHEN status='Unfilled' THEN 0 WHEN status='Degraded' THEN 1 WHEN current_workload>=85 THEN 2 ELSE 3 END, role_code`)
    return result.recordset.map(camel)
  },
  async teams() {
    return byOrgView('vw_agent_teams', 'health_percent ASC, team_code')
  },
  async getRole(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_agent_roles WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  async getTeam(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_agent_teams WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('vw_agent_role_categories', 'health_percent ASC, category_name'),
  lifecycle: () => byOrgView('vw_agent_team_lifecycle', 'created_at, stage_name'),
  health: () => byOrgView('vw_agent_team_health', 'health_percent ASC, service_name'),
  members: () => byOrgView('vw_agent_team_members', 'team_code, failover_rank'),
  delegations: () => byOrgView('vw_agent_team_delegations', 'team_code, rule_name'),
  handoffs: () => byOrgView('vw_agent_team_handoffs', 'success_rate ASC, team_code'),
  consensus: () => byOrgView('vw_agent_team_consensus', 'success_rate ASC, team_code'),
  recommendations: () => byOrgView('vw_agent_team_recommendations', 'auto_apply_eligible DESC, confidence DESC'),
  finalOutput: () => byOrgView('vw_agent_team_final_output', 'readiness ASC, team_code'),
  membersForTeam: (id: string) => byTeam('ai_agent_team_members', id),
  delegationsForTeam: (id: string) => byTeam('ai_agent_team_delegations', id),
  handoffsForTeam: (id: string) => byTeam('ai_agent_team_handoffs', id),
  consensusForTeam: (id: string) => byTeam('ai_agent_team_consensus', id),
  finalOutputForTeam: (id: string) => byTeam('ai_agent_team_final_output', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category AS value FROM vw_agent_roles WHERE organization_id=@org GROUP BY category
      UNION ALL SELECT 'roleType', role_type FROM vw_agent_roles WHERE organization_id=@org GROUP BY role_type
      UNION ALL SELECT 'scope', scope FROM vw_agent_roles WHERE organization_id=@org GROUP BY scope
      UNION ALL SELECT 'status', status FROM vw_agent_roles WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'primaryAgent', primary_agent_name FROM vw_agent_roles WHERE organization_id=@org AND primary_agent_name IS NOT NULL GROUP BY primary_agent_name
      UNION ALL SELECT 'supervisorRole', supervisor_role FROM vw_agent_roles WHERE organization_id=@org GROUP BY supervisor_role
      UNION ALL SELECT 'finalOutputResponsibility', final_output_responsibility FROM vw_agent_roles WHERE organization_id=@org GROUP BY final_output_responsibility
      UNION ALL SELECT 'organization', organization_name FROM vw_agent_roles WHERE organization_id=@org GROUP BY organization_name
      UNION ALL SELECT 'environment', environment FROM vw_agent_roles WHERE organization_id=@org GROUP BY environment
      UNION ALL SELECT 'owner', owner FROM vw_agent_roles WHERE organization_id=@org GROUP BY owner
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AgentRolesTeamsRepository = agentRolesTeamsRepository
