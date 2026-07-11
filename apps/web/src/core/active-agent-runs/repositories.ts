import { getConnectionPool, sql } from '@cacsms/database'

export type ActiveAgentRunsQuery = {
  q?: string
  agent?: string
  domain?: string
  status?: string
  workflow?: string
  stage?: string
  priority?: string
  provider?: string
  model?: string
  queue?: string
  worker?: string
  recoveryState?: string
  deadlineRisk?: string
  finalOutputImpact?: string
  organization?: string
  brand?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for active agent runs.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: ActiveAgentRunsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(agent_name LIKE @q OR agent_code LIKE @q OR objective LIKE @q OR domain LIKE @q OR workflow_name LIKE @q OR worker_id LIKE @q)')
  }
  ;[
    ['agent', 'agent_name'],
    ['domain', 'domain'],
    ['status', 'status'],
    ['workflow', 'workflow_name'],
    ['stage', 'workflow_stage'],
    ['priority', 'priority'],
    ['provider', 'provider_name'],
    ['model', 'model_name'],
    ['queue', 'queue_name'],
    ['worker', 'worker_id'],
    ['recoveryState', 'recovery_state'],
    ['finalOutputImpact', 'final_output_impact'],
    ['organization', 'organization_name'],
    ['brand', 'brand_name'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof ActiveAgentRunsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.deadlineRisk === 'Yes') where.push('deadline_risk=1')
  if (query.deadlineRisk === 'No') where.push('deadline_risk=0')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byRun(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE run_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const activeAgentRunsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_active_agent_runs_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: ActiveAgentRunsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_active_agent_runs WHERE ${where} ORDER BY deadline_risk DESC, CASE priority WHEN 'Critical' THEN 0 WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Normal' THEN 3 ELSE 4 END, updated_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_active_agent_runs WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  pipeline: () => byOrgView('vw_agent_run_pipeline', 'stage'),
  activityStream: () => byOrgView('vw_agent_run_activity_stream', 'event_timestamp DESC'),
  collaborations: () => byOrgView('vw_agent_run_collaborations', 'created_at DESC'),
  providerRouting: () => byOrgView('vw_agent_run_provider_routing', 'created_at DESC'),
  toolCalls: () => byOrgView('vw_agent_run_tool_calls', 'created_at DESC'),
  contextHealth: () => byOrgView('vw_agent_run_context_health', 'created_at DESC'),
  outputValidation: () => byOrgView('vw_agent_run_output_validation', 'created_at DESC'),
  bottlenecks: () => byOrgView('vw_agent_run_bottlenecks', 'confidence ASC'),
  recoveries: () => byOrgView('vw_agent_run_recoveries', 'created_at DESC'),
  costs: () => byOrgView('vw_agent_run_costs', 'estimated_cost DESC'),
  slaRisks: () => byOrgView('vw_agent_run_sla_risks', 'time_remaining_minutes ASC'),
  autonomousDecisions: () => byOrgView('vw_agent_run_activity_stream', 'event_timestamp DESC'),
  finalOutputContribution: () => byOrgView('vw_agent_run_final_output_contribution', 'contribution_rate ASC'),
  plan: (id: string) => byRun('ai_agent_run_plans', id),
  planSteps: (id: string) => byRun('ai_agent_run_plan_steps', id, 'sequence_no'),
  context: (id: string) => byRun('ai_agent_run_context', id),
  contextItems: (id: string) => byRun('ai_agent_run_context_items', id),
  prompt: (id: string) => byRun('ai_agent_run_prompt_resolutions', id),
  routing: async (id: string) => {
    const [providers, models] = await Promise.all([byRun('ai_agent_run_provider_decisions', id), byRun('ai_agent_run_model_decisions', id)])
    return { providers, models }
  },
  tools: (id: string) => byRun('ai_agent_run_tool_calls', id),
  output: async (id: string) => {
    const [outputs, validations, finalOutput] = await Promise.all([byRun('ai_agent_run_outputs', id), byRun('ai_agent_run_output_validations', id), byRun('ai_agent_run_final_output_links', id)])
    return { outputs, validations, finalOutput }
  },
  validation: (id: string) => byRun('ai_agent_run_output_validations', id),
  recovery: async (id: string) => {
    const [failures, retries, recoveries, checkpoints] = await Promise.all([byRun('ai_agent_run_failures', id), byRun('ai_agent_run_retries', id), byRun('ai_agent_run_recoveries', id), byRun('ai_agent_run_checkpoints', id)])
    return { failures, retries, recoveries, checkpoints }
  },
  timeline: (id: string) => byRun('ai_agent_run_steps', id, 'created_at ASC'),
  map: async (id: string) => {
    const [steps, tools, routing, output] = await Promise.all([byRun('ai_agent_run_steps', id, 'created_at ASC'), byRun('ai_agent_run_tool_calls', id), activeAgentRunsRepository.routing(id), activeAgentRunsRepository.output(id)])
    return { steps, tools, routing, output }
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'agent' AS kind, agent_name AS value FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY agent_name
      UNION ALL SELECT 'domain', domain FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY domain
      UNION ALL SELECT 'status', status FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'workflow', workflow_name FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY workflow_name
      UNION ALL SELECT 'stage', workflow_stage FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY workflow_stage
      UNION ALL SELECT 'priority', priority FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY priority
      UNION ALL SELECT 'provider', provider_name FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY provider_name
      UNION ALL SELECT 'model', model_name FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY model_name
      UNION ALL SELECT 'queue', queue_name FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY queue_name
      UNION ALL SELECT 'worker', worker_id FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY worker_id
      UNION ALL SELECT 'brand', brand_name FROM vw_active_agent_runs WHERE organization_id=@org GROUP BY brand_name
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const ActiveAgentRunRepository = activeAgentRunsRepository
export const AgentRunPlanRepository = activeAgentRunsRepository
export const AgentRunContextRepository = activeAgentRunsRepository
export const AgentRunPromptRepository = activeAgentRunsRepository
export const AgentRunProviderDecisionRepository = activeAgentRunsRepository
export const AgentRunModelDecisionRepository = activeAgentRunsRepository
export const AgentRunToolCallRepository = activeAgentRunsRepository
export const AgentRunOutputRepository = activeAgentRunsRepository
export const AgentRunValidationRepository = activeAgentRunsRepository
export const AgentRunFailureRepository = activeAgentRunsRepository
export const AgentRunRecoveryRepository = activeAgentRunsRepository
export const AgentRunCheckpointRepository = activeAgentRunsRepository
export const AgentRunCostRepository = activeAgentRunsRepository
export const AgentRunTokenRepository = activeAgentRunsRepository
export const AgentRunRiskRepository = activeAgentRunsRepository
export const AgentRunPriorityRepository = activeAgentRunsRepository
export const AgentRunCollaborationRepository = activeAgentRunsRepository
export const AgentRunDecisionRepository = activeAgentRunsRepository
export const AgentRunFinalOutputRepository = activeAgentRunsRepository
