import { getConnectionPool, sql } from '@cacsms/database'

export type VersionReleaseQuery = { q?: string; type?: string; status?: string; environment?: string; risk?: string }
type Row = Record<string, unknown>

function camel(row: Row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()), v instanceof Date ? v.toISOString() : v])) as Row
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Version & Release Management.')
  return String(row.id)
}

async function byOrg(view: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${view} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const agentVersionReleaseRepository = {
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_version_release_summary WHERE organization_id=@org')
    return camel(r.recordset[0] ?? {})
  },
  async componentVersions(query: VersionReleaseQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const req = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(component_code LIKE @q OR component_name LIKE @q OR component_type LIKE @q OR release_code LIKE @q OR owner_name LIKE @q)') }
    if (query.type && query.type !== 'All') { req.input('type', sql.NVarChar, query.type); where.push('component_type=@type') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.environment && query.environment !== 'All') { req.input('environment', sql.NVarChar, query.environment); where.push('environment_name=@environment') }
    const r = await req.query(`SELECT * FROM vw_agent_component_versions WHERE ${where.join(' AND ')} ORDER BY updated_at DESC`)
    return r.recordset.map(camel)
  },
  async releases(query: VersionReleaseQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const req = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(release_code LIKE @q OR release_name LIKE @q OR release_type LIKE @q OR owner_name LIKE @q)') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.environment && query.environment !== 'All') { req.input('environment', sql.NVarChar, query.environment); where.push('target_environment=@environment') }
    if (query.risk && query.risk !== 'All') { req.input('risk', sql.NVarChar, query.risk); where.push('change_risk=@risk') }
    const r = await req.query(`SELECT * FROM vw_agent_releases WHERE ${where.join(' AND ')} ORDER BY updated_at DESC`)
    return r.recordset.map(camel)
  },
  domains: () => byOrg('ai_release_version_domains', 'domain_name'),
  lifecycle: () => byOrg('ai_release_lifecycle', 'sequence_no'),
  dependencies: () => byOrg('ai_release_dependency_impacts', 'risk_level DESC, release_code'),
  packages: () => byOrg('ai_release_packages', 'release_code'),
  environments: () => byOrg('ai_release_environments', 'environment_name'),
  promotions: () => byOrg('ai_release_environment_promotions', 'promoted_at DESC'),
  deployments: () => byOrg('ai_release_deployments', 'release_code'),
  featureFlags: () => byOrg('ai_release_feature_flags', 'flag_code'),
  migrations: () => byOrg('ai_release_database_migrations', 'order_no'),
  drift: () => byOrg('ai_release_configuration_drift', 'severity DESC, drift_code'),
  gates: () => byOrg('ai_release_validation_gates', 'gate_name'),
  risks: () => byOrg('ai_release_risk_assessments', 'risk_score DESC'),
  approvals: () => byOrg('ai_release_approvals', 'release_code'),
  health: () => byOrg('ai_release_health', 'final_output_performance DESC'),
  regressions: () => byOrg('ai_release_regressions', 'severity DESC'),
  rollbacks: () => byOrg('ai_release_rollbacks', 'completed_at DESC'),
  recoveries: () => byOrg('ai_release_recoveries', 'recovery_minutes'),
  notes: () => byOrg('ai_release_notes', 'release_code'),
  analytics: () => byOrg('ai_release_analytics', 'metric_name'),
  traceability: () => byOrg('ai_release_final_output_traceability', 'release_code'),
  decisions: () => byOrg('ai_release_autonomous_decisions', 'decided_at DESC'),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'type' kind, component_type value FROM ai_release_component_versions WHERE organization_id=@org GROUP BY component_type
      UNION ALL SELECT 'status', status FROM ai_release_component_versions WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'environment', environment_name FROM ai_release_component_versions WHERE organization_id=@org GROUP BY environment_name
      UNION ALL SELECT 'risk', change_risk FROM ai_release_releases WHERE organization_id=@org GROUP BY change_risk
      ORDER BY kind,value`)
    return r.recordset.reduce<Record<string, string[]>>((a, row) => { const k = String(row.kind); a[k] = [...(a[k] ?? []), String(row.value)]; return a }, {})
  },
}
