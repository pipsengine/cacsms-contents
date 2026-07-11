import { getConnectionPool, sql } from '@cacsms/database'

export type AgentAnalyticsQuery = { q?: string; domain?: string; status?: string; trend?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Analytics.')
  return String(row.id)
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentAnalyticsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_analytics_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  coverage: () => byOrgView('vw_agent_analytics_coverage', 'stage_name'),
  dimensions: () => byOrgView('vw_agent_analytics_dimension_cards', 'health_percent ASC, dimension_name'),
  panels: () => byOrgView('agent_analytics_panels', 'panel_name, metric_name'),
  businessImpact: () => byOrgView('vw_agent_analytics_business_impact', 'impact_value DESC'),
  finalOutput: () => byOrgView('vw_agent_analytics_final_output_traceability', 'business_value DESC'),
  anomalies: () => byOrgView('agent_analytics_anomalies', 'detected_at DESC'),
  forecasts: () => byOrgView('agent_analytics_forecasts', 'generated_at DESC'),
  leaderboards: () => byOrgView('agent_analytics_leaderboards', 'leaderboard_name, rank_position'),
  recommendations: () => byOrgView('agent_analytics_recommendations', 'confidence DESC, created_at DESC'),
  savedViews: () => byOrgView('agent_analytics_saved_views', 'is_pinned DESC, updated_at DESC'),
  reports: () => byOrgView('agent_analytics_reports', 'last_generated_at DESC'),
  alertRules: () => byOrgView('agent_analytics_alert_rules', 'severity, rule_name'),
  dataQuality: () => byOrgView('agent_analytics_data_quality', 'quality_score ASC'),
  lineage: () => byOrgView('agent_analytics_lineage', 'source_name, metric_name'),
  async agents(query: AgentAnalyticsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(agent_code LIKE @q OR agent_name LIKE @q OR domain LIKE @q)') }
    if (query.domain && query.domain !== 'All') { request.input('domain', sql.NVarChar, query.domain); where.push('domain=@domain') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.trend && query.trend !== 'All') { request.input('trend', sql.NVarChar, query.trend); where.push('trend=@trend') }
    const result = await request.query(`SELECT * FROM vw_agent_analytics_agents WHERE ${where.join(' AND ')} ORDER BY rank_position`)
    return result.recordset.map(camel)
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'domain' kind, domain value FROM vw_agent_analytics_agents WHERE organization_id=@org GROUP BY domain
      UNION ALL SELECT 'status', status FROM vw_agent_analytics_agents WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'trend', trend FROM vw_agent_analytics_agents WHERE organization_id=@org GROUP BY trend
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AgentAnalyticsRepository = agentAnalyticsRepository
