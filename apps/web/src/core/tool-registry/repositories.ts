import { getConnectionPool, sql } from '@cacsms/database'

export type ToolRegistryQuery = { q?: string; category?: string; toolType?: string; status?: string; scope?: string; environment?: string; credential?: string; sensitive?: string; finalOutput?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for tool registry.')
  return String(row.id)
}

function whereFor(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: ToolRegistryQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(tool_code LIKE @q OR tool_name LIKE @q OR category_name LIKE @q OR tool_type LIKE @q OR owner LIKE @q)') }
  ;[
    ['category', 'category_name'],
    ['toolType', 'tool_type'],
    ['status', 'status'],
    ['scope', 'scope_type'],
    ['environment', 'environment'],
    ['credential', 'credential_status'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof ToolRegistryQuery]
    if (value && value !== 'All') { request.input(key, sql.NVarChar, value); where.push(`${column}=@${key}`) }
  })
  if (query.sensitive === 'Yes') where.push('sensitive_access=1')
  if (query.sensitive === 'No') where.push('sensitive_access=0')
  if (query.finalOutput === 'Linked') where.push('final_output_linked=1')
  if (query.finalOutput === 'Unlinked') where.push('final_output_linked=0')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byTool(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE tool_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const toolRegistryRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_ai_tool_registry_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async tools(query: ToolRegistryQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = whereFor(request, query)
    const result = await request.query(`SELECT * FROM vw_ai_tools WHERE ${where} ORDER BY CASE WHEN status IN ('Offline','Authentication Failed','Circuit Open','Degraded','Rate Limited','Quota Limited','Authentication Warning') THEN 0 ELSE 1 END, health_percent ASC, calls_today DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_ai_tools WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('ai_tool_categories', 'health_percent ASC, category_name'),
  lifecycle: () => byOrgView('ai_tool_lifecycle', 'lifecycle_type, sequence_no'),
  health: () => byOrgView('vw_ai_tool_health', 'health_percent ASC'),
  credentials: () => byOrgView('vw_ai_tool_credentials', 'credential_status DESC, last_health_check DESC'),
  permissions: () => byOrgView('vw_ai_tool_permissions', 'governance_state DESC, tool_code'),
  agents: () => byOrgView('vw_ai_tool_agent_assignments', 'tool_code, agent_name'),
  capabilities: () => byOrgView('vw_ai_tool_capability_mappings', 'tool_code, capability_name'),
  workflows: () => byOrgView('vw_ai_tool_workflow_usage', 'usage_count DESC'),
  activeCalls: () => byOrgView('vw_ai_tool_active_calls', 'updated_at DESC'),
  rateLimits: () => byOrgView('vw_ai_tool_rate_limits', 'current_usage DESC'),
  quotas: () => byOrgView('vw_ai_tool_quotas', 'quota_usage DESC'),
  fallbacks: () => byOrgView('vw_ai_tool_fallbacks', 'output_preservation ASC'),
  circuitBreakers: () => byOrgView('vw_ai_tool_circuit_breakers', 'state DESC, failure_count DESC'),
  performance: () => byOrgView('vw_ai_tool_performance', 'calls DESC'),
  deprecations: () => byOrgView('vw_ai_tool_deprecations', 'deadline ASC'),
  recommendations: () => byOrgView('vw_ai_tool_recommendations', 'confidence_percent DESC'),
  security: () => byOrgView('vw_ai_tool_security', 'risk_score DESC'),
  finalOutputImpact: () => byOrgView('vw_ai_tool_final_output_impact', 'readiness ASC'),
  versionsFor: (id: string) => byTool('ai_tool_versions', id),
  schemasFor: (id: string) => byTool('ai_tool_schemas', id),
  permissionsFor: (id: string) => byTool('ai_tool_permissions', id),
  callsFor: (id: string) => byTool('ai_tool_calls', id, 'updated_at DESC'),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' kind, category_name value FROM vw_ai_tools WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'toolType', tool_type FROM vw_ai_tools WHERE organization_id=@org GROUP BY tool_type
      UNION ALL SELECT 'status', status FROM vw_ai_tools WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'scope', scope_type FROM vw_ai_tools WHERE organization_id=@org GROUP BY scope_type
      UNION ALL SELECT 'environment', environment FROM vw_ai_tools WHERE organization_id=@org GROUP BY environment
      UNION ALL SELECT 'credential', credential_status FROM vw_ai_tools WHERE organization_id=@org GROUP BY credential_status
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const ToolRegistryRepository = toolRegistryRepository
