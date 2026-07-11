import { getConnectionPool, sql } from '@cacsms/database'

export type PromptsQuery = { q?: string; category?: string; status?: string; provider?: string; model?: string; finalOutput?: string; security?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for prompt management.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: PromptsQuery) {
  const where = ['organization_id=@org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(prompt_code LIKE @q OR prompt_name LIKE @q OR purpose LIKE @q OR category_name LIKE @q OR status LIKE @q)')
  }
  ;[
    ['category', 'category_name'],
    ['status', 'status'],
    ['finalOutput', 'final_output_state'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof PromptsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column}=@${key}`)
    }
  })
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byPrompt(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE prompt_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const promptsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_prompt_management_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: PromptsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_prompts WHERE ${where} ORDER BY human_attention_required DESC, CASE WHEN status='Production' THEN 0 WHEN status='Canary' THEN 1 WHEN status='Testing' THEN 2 ELSE 3 END, updated_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_prompts WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('vw_prompt_categories', 'category_name'),
  versions: () => byOrgView('vw_prompt_versions', 'prompt_code, created_at DESC'),
  variables: () => byOrgView('vw_prompt_variables', 'prompt_code, variable_name'),
  context: () => byOrgView('vw_prompt_context', 'relevance DESC, prompt_code'),
  tools: () => byOrgView('vw_prompt_tools', 'prompt_code, tool_name'),
  models: () => byOrgView('vw_prompt_models', 'recommended DESC, quality DESC'),
  providers: () => byOrgView('vw_prompt_providers', 'health_percent DESC, provider_name'),
  memory: () => byOrgView('vw_prompt_memory', 'retrieval_confidence DESC'),
  rag: () => byOrgView('vw_prompt_rag', 'confidence DESC'),
  tests: () => byOrgView('vw_prompt_tests', 'created_at DESC'),
  simulations: () => byOrgView('vw_prompt_simulations', 'created_at DESC'),
  abTests: () => byOrgView('vw_prompt_ab_tests', 'success_lift DESC'),
  validation: () => byOrgView('vw_prompt_validation', 'issue_count DESC, prompt_code'),
  metrics: () => byOrgView('vw_prompt_metrics', 'metric_date DESC, quality DESC'),
  security: () => byOrgView('vw_prompt_security', 'risk_score DESC'),
  deployments: () => byOrgView('vw_prompt_deployments', 'deployed_at DESC'),
  finalOutput: () => byOrgView('vw_prompt_final_outputs', 'readiness DESC'),
  versionsFor: (id: string) => byPrompt('ai_prompt_versions', id),
  variablesFor: (id: string) => byPrompt('ai_prompt_variables', id),
  validationFor: (id: string) => byPrompt('ai_prompt_validation', id),
  testsFor: (id: string) => byPrompt('ai_prompt_tests', id),
  simulationsFor: (id: string) => byPrompt('ai_prompt_simulations', id),
  securityFor: (id: string) => byPrompt('ai_prompt_security', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category_name AS value FROM vw_prompts WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'status', status FROM vw_prompts WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'finalOutput', final_output_state FROM vw_prompts WHERE organization_id=@org GROUP BY final_output_state
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const PromptsRepository = promptsRepository
