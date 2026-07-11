import { getConnectionPool, sql } from '@cacsms/database'

export type AgentCapabilitiesQuery = {
  q?: string
  domain?: string
  status?: string
  validationStatus?: string
  organizationScope?: string
  provider?: string
  model?: string
  tool?: string
  assignedAgent?: string
  memoryRequired?: string
  ragRequired?: string
  finalOutputLinked?: string
  healthRange?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for agent capabilities.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AgentCapabilitiesQuery) {
  const where = ['organization_id=@org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(capability_code LIKE @q OR capability_name LIKE @q OR domain LIKE @q OR owner LIKE @q OR description LIKE @q OR required_tools LIKE @q OR supported_models LIKE @q)')
  }
  ;[
    ['domain', 'domain'],
    ['status', 'status'],
    ['validationStatus', 'validation_status'],
    ['organizationScope', 'organization_scope'],
    ['provider', 'supported_providers'],
    ['model', 'supported_models'],
    ['tool', 'required_tools'],
    ['assignedAgent', 'owner'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AgentCapabilitiesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, key === 'provider' || key === 'model' || key === 'tool' ? `%${value}%` : value)
      where.push(key === 'provider' || key === 'model' || key === 'tool' ? `${column} LIKE @${key}` : `${column}=@${key}`)
    }
  })
  if (query.memoryRequired === 'Yes') where.push("memory_requirement='required'")
  if (query.memoryRequired === 'No') where.push("(memory_requirement IS NULL OR memory_requirement<>'required')")
  if (query.ragRequired === 'Yes') where.push("rag_requirement='required'")
  if (query.ragRequired === 'No') where.push("(rag_requirement IS NULL OR rag_requirement<>'required')")
  if (query.finalOutputLinked === 'Yes') where.push('final_output_linked=1')
  if (query.finalOutputLinked === 'No') where.push('final_output_linked=0')
  if (query.healthRange === 'At Risk') where.push('health_percent < 90')
  if (query.healthRange === 'Healthy') where.push('health_percent >= 90')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byCapability(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE capability_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentCapabilitiesRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_capabilities_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: AgentCapabilitiesQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_agent_capabilities WHERE ${where} ORDER BY CASE WHEN status='Invalid' THEN 0 WHEN validation_status='Invalid' THEN 1 WHEN status='Draft' THEN 2 ELSE 3 END, health_percent ASC, capability_code`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_agent_capabilities WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  domains: () => byOrgView('vw_agent_capability_domains', 'health_percent ASC, domain_name'),
  health: () => byOrgView('vw_agent_capability_health', 'health_percent ASC, service_name'),
  assignments: () => byOrgView('vw_agent_capability_assignments', 'capability_code, agent_name'),
  workflowUsage: () => byOrgView('vw_agent_capability_workflow_usage', 'capability_code, workflow_stage'),
  providerModels: () => byOrgView('vw_agent_capability_provider_models', 'capability_code, provider, model'),
  tools: () => byOrgView('vw_agent_capability_tools', 'capability_code, tool_code'),
  memoryRag: () => byOrgView('vw_agent_capability_memory_rag', 'health_percent ASC, capability_code'),
  validations: () => byOrgView('vw_agent_capability_validations', 'validation_score ASC, capability_code'),
  tests: () => byOrgView('vw_agent_capability_tests', 'quality_score ASC, capability_code'),
  overlaps: () => byOrgView('vw_agent_capability_overlaps', 'similarity_score DESC'),
  recommendations: () => byOrgView('vw_agent_capability_recommendations', 'auto_apply_eligible DESC, confidence DESC'),
  finalOutputLinkage: () => byOrgView('vw_agent_capability_final_output', 'readiness ASC, capability_code'),
  versions: (id: string) => byCapability('ai_capability_versions', id, 'version DESC'),
  assignmentsForCapability: (id: string) => byCapability('ai_capability_assignments', id),
  workflowUsageForCapability: (id: string) => byCapability('ai_capability_workflow_usage', id),
  providerModelsForCapability: (id: string) => byCapability('ai_capability_provider_models', id),
  toolsForCapability: (id: string) => byCapability('ai_capability_tool_requirements', id),
  memoryRagForCapability: (id: string) => byCapability('ai_capability_memory_rag', id),
  validationsForCapability: (id: string) => byCapability('ai_capability_validations', id),
  testsForCapability: (id: string) => byCapability('ai_capability_tests', id),
  finalOutputForCapability: (id: string) => byCapability('ai_capability_final_output_links', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'domain' AS kind, domain AS value FROM vw_agent_capabilities WHERE organization_id=@org GROUP BY domain
      UNION ALL SELECT 'status', status FROM vw_agent_capabilities WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'validationStatus', validation_status FROM vw_agent_capabilities WHERE organization_id=@org GROUP BY validation_status
      UNION ALL SELECT 'organizationScope', organization_scope FROM vw_agent_capabilities WHERE organization_id=@org GROUP BY organization_scope
      UNION ALL SELECT 'provider', provider FROM vw_agent_capability_provider_models WHERE organization_id=@org GROUP BY provider
      UNION ALL SELECT 'model', model FROM vw_agent_capability_provider_models WHERE organization_id=@org GROUP BY model
      UNION ALL SELECT 'tool', tool_code FROM vw_agent_capability_tools WHERE organization_id=@org GROUP BY tool_code
      UNION ALL SELECT 'assignedAgent', agent_name FROM vw_agent_capability_assignments WHERE organization_id=@org GROUP BY agent_name
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AgentCapabilityRepository = agentCapabilitiesRepository
export const AgentCapabilityDomainRepository = agentCapabilitiesRepository
export const AgentCapabilityHealthRepository = agentCapabilitiesRepository
export const AgentCapabilityValidationRepository = agentCapabilitiesRepository
