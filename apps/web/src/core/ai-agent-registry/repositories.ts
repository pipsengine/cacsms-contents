import { getConnectionPool, sql } from '@cacsms/database'

export type AIAgentRegistryQuery = {
  q?: string
  domain?: string
  scope?: string
  status?: string
  validationStatus?: string
  environment?: string
  provider?: string
  model?: string
  memoryEnabled?: string
  ragEnabled?: string
  finalOutputLinked?: string
  owner?: string
  organization?: string
  healthRange?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for AI agent registry.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AIAgentRegistryQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(agent_code LIKE @q OR agent_name LIKE @q OR domain LIKE @q OR owner LIKE @q OR capabilities LIKE @q)')
  }
  ;[
    ['domain', 'domain'],
    ['scope', 'scope_type'],
    ['status', 'status'],
    ['validationStatus', 'validation_status'],
    ['environment', 'environment'],
    ['provider', 'preferred_provider'],
    ['model', 'preferred_model'],
    ['owner', 'owner'],
    ['organization', 'organization_name'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AIAgentRegistryQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.memoryEnabled === 'Yes') where.push('memory_enabled=1')
  if (query.memoryEnabled === 'No') where.push('memory_enabled=0')
  if (query.ragEnabled === 'Yes') where.push('rag_enabled=1')
  if (query.ragEnabled === 'No') where.push('rag_enabled=0')
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

async function byAgent(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE agent_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const aiAgentRegistryRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_ai_agent_registry_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async agents(query: AIAgentRegistryQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_ai_agent_registry WHERE ${where} ORDER BY CASE WHEN status='Invalid' THEN 0 WHEN validation_status='Warning' THEN 1 ELSE 2 END, health_percent ASC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_ai_agent_registry WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  domains: () => byOrgView('vw_ai_agent_domain_coverage', 'average_health ASC'),
  capabilities: async () => {
    const pool = await getConnectionPool()
    const result = await pool.request().query('SELECT * FROM ai_capabilities ORDER BY domain, capability_name')
    return result.recordset.map(camel)
  },
  health: () => byOrgView('vw_ai_agent_registry_health', 'health_percent ASC'),
  overlaps: () => byOrgView('vw_ai_agent_overlap_analysis', 'similarity_score DESC'),
  orphans: () => byOrgView('vw_ai_agent_orphans', 'maintenance_cost DESC'),
  recommendations: () => byOrgView('ai_agent_registry_recommendations', 'auto_apply_eligible DESC, confidence DESC'),
  finalOutputLinkage: () => byOrgView('vw_ai_agent_final_output_linkage', 'readiness ASC'),
  workflowMappings: () => byOrgView('vw_ai_agent_workflow_mappings', 'agent_code, execution_order'),
  toolPermissions: () => byOrgView('vw_ai_agent_tool_permissions', 'agent_code, tool_code'),
  providerModelMappings: () => byOrgView('vw_ai_agent_provider_model_mappings', 'health_percent ASC'),
  promptHealth: () => byOrgView('vw_ai_agent_prompt_health', 'agent_code'),
  memoryRagHealth: () => byOrgView('vw_ai_agent_memory_rag_health', 'health_percent ASC'),
  versions: (id: string) => byAgent('ai_agent_versions', id, 'version DESC'),
  validation: (id: string) => byAgent('ai_agent_validations', id),
  tests: (id: string) => byAgent('ai_agent_tests', id),
  workflowMappingsForAgent: (id: string) => byAgent('ai_agent_workflow_mappings', id, 'execution_order'),
  toolPermissionsForAgent: (id: string) => byAgent('ai_agent_tool_mappings', id, 'tool_code'),
  providerModelMappingsForAgent: (id: string) => byAgent('ai_agent_provider_mappings', id),
  prompt: (id: string) => byAgent('ai_agent_prompt_mappings', id),
  memoryRag: async (id: string) => {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM ai_agent_memory_policies WHERE agent_id=@id; SELECT * FROM ai_agent_rag_policies WHERE agent_id=@id')
    const [memory, rag] = result.recordsets as unknown as Array<Array<Record<string, unknown>>>
    return { memory: memory.map(camel), rag: rag.map(camel) }
  },
  dependencies: (id: string) => byAgent('ai_agent_dependencies', id),
  impact: async (id: string) => {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM ai_agent_change_history WHERE agent_id=@id ORDER BY created_at DESC; SELECT * FROM ai_agent_final_output_links WHERE agent_id=@id ORDER BY readiness ASC; SELECT * FROM ai_agent_governance_approvals WHERE agent_id=@id ORDER BY created_at DESC')
    const [changes, finalOutput, governance] = result.recordsets as unknown as Array<Array<Record<string, unknown>>>
    return { changes: changes.map(camel), finalOutput: finalOutput.map(camel), governance: governance.map(camel) }
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'domain' AS kind, domain AS value FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY domain
      UNION ALL SELECT 'scope', scope_type FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY scope_type
      UNION ALL SELECT 'status', status FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'validationStatus', validation_status FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY validation_status
      UNION ALL SELECT 'environment', environment FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY environment
      UNION ALL SELECT 'provider', preferred_provider FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY preferred_provider
      UNION ALL SELECT 'model', preferred_model FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY preferred_model
      UNION ALL SELECT 'owner', owner FROM vw_ai_agent_registry WHERE organization_id=@org GROUP BY owner
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AIAgentRegistryRepository = aiAgentRegistryRepository
export const AIAgentVersionRepository = aiAgentRegistryRepository
export const AIAgentDomainRepository = aiAgentRegistryRepository
export const AIAgentCapabilityRepository = aiAgentRegistryRepository
export const AIAgentSchemaRepository = aiAgentRegistryRepository
export const AIAgentProviderMappingRepository = aiAgentRegistryRepository
export const AIAgentModelMappingRepository = aiAgentRegistryRepository
export const AIAgentPromptMappingRepository = aiAgentRegistryRepository
export const AIAgentToolMappingRepository = aiAgentRegistryRepository
export const AIAgentMemoryPolicyRepository = aiAgentRegistryRepository
export const AIAgentRagPolicyRepository = aiAgentRegistryRepository
export const AIAgentExecutionMappingRepository = aiAgentRegistryRepository
export const AIAgentWorkflowMappingRepository = aiAgentRegistryRepository
export const AIAgentRecoveryMappingRepository = aiAgentRegistryRepository
export const AIAgentValidationRepository = aiAgentRegistryRepository
export const AIAgentTestRepository = aiAgentRegistryRepository
export const AIAgentOverlapRepository = aiAgentRegistryRepository
export const AIAgentDependencyRepository = aiAgentRegistryRepository
export const AIAgentRegistryHealthRepository = aiAgentRegistryRepository
export const AIAgentRecommendationRepository = aiAgentRegistryRepository
export const AIAgentFinalOutputRepository = aiAgentRegistryRepository
export const AIAgentGovernanceRepository = aiAgentRegistryRepository
