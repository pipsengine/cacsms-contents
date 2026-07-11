import { getConnectionPool, sql } from '@cacsms/database'

export type SimulationQuery = { q?: string; type?: string; status?: string; ready?: string }
type Row = Record<string, unknown>
function camel(row: Row) { return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()), v instanceof Date ? v.toISOString() : v])) as Row }
async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Simulation Studio.')
  return String(row.id)
}
async function byOrg(view: string, orderBy: string) {
  const pool = await getConnectionPool(); const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${view} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}
export const agentSimulationRepository = {
  async summary() { const pool = await getConnectionPool(); const org = await organizationId(); const r = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_ai_simulation_summary WHERE organization_id=@org'); return camel(r.recordset[0] ?? {}) },
  async simulations(query: SimulationQuery = {}) {
    const pool = await getConnectionPool(); const org = await organizationId(); const req = pool.request().input('org', sql.UniqueIdentifier, org); const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(simulation_code LIKE @q OR scenario_name LIKE @q OR simulation_type LIKE @q OR business_outcome LIKE @q)') }
    if (query.type && query.type !== 'All') { req.input('type', sql.NVarChar, query.type); where.push('simulation_type=@type') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.ready === 'Ready') where.push('deployment_ready=1')
    if (query.ready === 'Blocked') where.push('deployment_ready=0')
    const r = await req.query(`SELECT * FROM vw_ai_simulations WHERE ${where.join(' AND ')} ORDER BY created_at DESC`)
    return r.recordset.map(camel)
  },
  twins: () => byOrg('ai_digital_twins', 'created_at DESC'),
  scenarios: () => byOrg('ai_scenarios', 'scenario_code'),
  predictions: () => byOrg('ai_predictions', 'accuracy_percent DESC'),
  results: () => byOrg('ai_simulation_results', 'variance_percent DESC'),
  failures: () => byOrg('ai_failure_injection', 'recovery_seconds DESC'),
  chaos: () => byOrg('ai_chaos_tests', 'resilience_score DESC'),
  load: () => byOrg('ai_load_tests', 'throughput_per_minute DESC'),
  stress: () => byOrg('ai_stress_tests', 'saturation_percent DESC'),
  forecasts: () => byOrg('ai_business_forecasts', 'deployment_confidence DESC'),
  types: () => byOrg('ai_simulation_types', 'type_name'),
  lifecycle: () => byOrg('ai_simulation_lifecycle', 'sequence_no'),
  async filters() {
    const pool = await getConnectionPool(); const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT 'type' kind, simulation_type value FROM ai_simulations WHERE organization_id=@org GROUP BY simulation_type UNION ALL SELECT 'status', status FROM ai_simulations WHERE organization_id=@org GROUP BY status ORDER BY kind,value`)
    return r.recordset.reduce<Record<string, string[]>>((a, row) => { const k = String(row.kind); a[k] = [...(a[k] ?? []), String(row.value)]; return a }, {})
  },
}
