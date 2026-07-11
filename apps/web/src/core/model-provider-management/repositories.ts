import { getConnectionPool, sql } from '@cacsms/database'

export type ModelProviderQuery = { q?: string; providerType?: string; providerStatus?: string; modelFamily?: string; modelStatus?: string; modality?: string; finalOutput?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for model provider management.')
  return String(row.id)
}

function providerWhere(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: ModelProviderQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(provider_code LIKE @q OR provider_name LIKE @q OR provider_type LIKE @q OR status LIKE @q OR region LIKE @q)') }
  if (query.providerType && query.providerType !== 'All') { request.input('providerType', sql.NVarChar, query.providerType); where.push('provider_type=@providerType') }
  if (query.providerStatus && query.providerStatus !== 'All') { request.input('providerStatus', sql.NVarChar, query.providerStatus); where.push('status=@providerStatus') }
  return where.join(' AND ')
}

function modelWhere(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: ModelProviderQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(model_code LIKE @q OR display_name LIKE @q OR provider_name LIKE @q OR model_family LIKE @q OR modality LIKE @q)') }
  if (query.modelFamily && query.modelFamily !== 'All') { request.input('modelFamily', sql.NVarChar, query.modelFamily); where.push('model_family=@modelFamily') }
  if (query.modelStatus && query.modelStatus !== 'All') { request.input('modelStatus', sql.NVarChar, query.modelStatus); where.push('status=@modelStatus') }
  if (query.modality && query.modality !== 'All') { request.input('modality', sql.NVarChar, query.modality); where.push('modality=@modality') }
  if (query.finalOutput && query.finalOutput !== 'All') { request.input('finalOutput', sql.NVarChar, query.finalOutput); where.push('final_output_state=@finalOutput') }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const modelProviderRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_ai_provider_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async providers(query: ModelProviderQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = providerWhere(request, query)
    const result = await request.query(`SELECT * FROM vw_ai_providers WHERE ${where} ORDER BY CASE WHEN status IN ('Degraded','Rate Limited','Quota Limited','Credential Warning') THEN 0 ELSE 1 END, health_percent ASC, provider_name`)
    return result.recordset.map(camel)
  },
  async models(query: ModelProviderQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = modelWhere(request, query)
    const result = await request.query(`SELECT * FROM vw_ai_models WHERE ${where} ORDER BY CASE WHEN status IN ('Degraded','Rate Limited','Deprecated','Retiring') THEN 0 ELSE 1 END, health_percent ASC, requests_today DESC`)
    return result.recordset.map(camel)
  },
  async provider(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_ai_providers WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  async model(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_ai_models WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('ai_provider_category_metrics', 'health_percent ASC, category_name'),
  lifecycle: () => byOrgView('ai_model_provider_lifecycle', 'lifecycle_type, sequence_no'),
  providerHealth: () => byOrgView('vw_ai_provider_health', 'health_percent ASC'),
  providerCredentials: () => byOrgView('vw_ai_provider_credentials', 'credential_expiry_days ASC'),
  providerQuotas: () => byOrgView('vw_ai_provider_quotas', 'quota_usage DESC'),
  providerCosts: () => byOrgView('vw_ai_provider_costs', 'spend_today DESC'),
  modelHealth: () => byOrgView('vw_ai_model_health', 'health_percent ASC'),
  modelCompatibility: () => byOrgView('vw_ai_model_compatibility', 'display_name'),
  benchmarks: () => byOrgView('vw_ai_model_benchmarks', 'quality_score DESC'),
  deprecations: () => byOrgView('vw_ai_model_deprecations', 'deprecation_date ASC'),
  routes: () => byOrgView('vw_ai_model_routes', 'active_routes DESC'),
  policies: () => byOrgView('ai_model_provider_routing_policies', 'priority ASC'),
  decisions: () => byOrgView('vw_ai_model_routing_decisions', 'created_at DESC'),
  failovers: () => byOrgView('vw_ai_model_failovers', 'created_at DESC'),
  circuitBreakers: () => byOrgView('vw_ai_model_circuit_breakers', 'state DESC, route_name'),
  recommendations: () => byOrgView('vw_ai_model_recommendations', 'confidence_percent DESC'),
  finalOutputImpact: () => byOrgView('vw_ai_model_final_output_impact', 'readiness ASC'),
  costAnalytics: () => byOrgView('vw_ai_model_cost_analytics', 'average_cost_per_run DESC'),
  qualityAnalytics: () => byOrgView('vw_ai_model_quality_analytics', 'average_quality DESC'),
  latencyAnalytics: () => byOrgView('vw_ai_model_latency_analytics', 'average_latency_seconds DESC'),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'providerType' kind, provider_type value FROM vw_ai_providers WHERE organization_id=@org GROUP BY provider_type
      UNION ALL SELECT 'providerStatus', status FROM vw_ai_providers WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'modelFamily', model_family FROM vw_ai_models WHERE organization_id=@org GROUP BY model_family
      UNION ALL SELECT 'modelStatus', status FROM vw_ai_models WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'modality', modality FROM vw_ai_models WHERE organization_id=@org GROUP BY modality
      UNION ALL SELECT 'finalOutput', final_output_state FROM vw_ai_models WHERE organization_id=@org GROUP BY final_output_state
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const ModelProviderRepository = modelProviderRepository
