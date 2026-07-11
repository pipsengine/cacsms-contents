import { getConnectionPool, sql } from '@cacsms/database'

export type GovernanceQuery = { q?: string; domain?: string; status?: string; risk?: string }
type Row = Record<string, unknown>
function camel(row: Row) { return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()), v instanceof Date ? v.toISOString() : v])) as Row }
async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Governance Center.')
  return String(row.id)
}
async function byOrg(view: string, orderBy: string) {
  const pool = await getConnectionPool(); const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${view} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}
export const agentGovernanceRepository = {
  organizationId,
  async summary() { const pool = await getConnectionPool(); const org = await organizationId(); const r = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_governance_summary WHERE organization_id=@org'); return camel(r.recordset[0] ?? {}) },
  async policies(query: GovernanceQuery = {}) {
    const pool = await getConnectionPool(); const org = await organizationId(); const req = pool.request().input('org', sql.UniqueIdentifier, org); const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(policy_code LIKE @q OR policy_name LIKE @q OR domain LIKE @q OR policy_type LIKE @q OR applies_to LIKE @q OR owner_name LIKE @q)') }
    if (query.domain && query.domain !== 'All') { req.input('domain', sql.NVarChar, query.domain); where.push('domain=@domain') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.risk && query.risk !== 'All') { req.input('risk', sql.NVarChar, query.risk); where.push('risk_level=@risk') }
    const r = await req.query(`SELECT * FROM vw_agent_governance_policies WHERE ${where.join(' AND ')} ORDER BY last_evaluated DESC`)
    return r.recordset.map(camel)
  },
  domains: () => byOrg('vw_agent_governance_domains', 'domain_name'),
  approvals: () => byOrg('agent_governance_approvals', 'created_at DESC'),
  exceptions: () => byOrg('agent_governance_exceptions', 'expires_at'),
  violations: () => byOrg('agent_governance_violations', 'detected_at DESC'),
  conflicts: () => byOrg('agent_governance_conflicts', 'detected_at DESC'),
  risks: () => byOrg('agent_governance_risks', 'residual_score DESC'),
  controls: () => byOrg('agent_governance_controls', 'last_tested DESC'),
  regulatoryMappings: () => byOrg('agent_governance_regulatory_mappings', 'regulation'),
  useCases: () => byOrg('agent_governance_use_cases', 'risk_score DESC'),
  lifecycle: () => byOrg('agent_governance_lifecycle', 'sequence_no'),
  coverage: () => byOrg('agent_governance_coverage', 'coverage_percent ASC'),
  auditEvents: () => byOrg('agent_governance_audit_events', 'latest_event_at DESC'),
  recommendations: () => byOrg('agent_governance_recommendations', 'created_at DESC'),
  finalOutput: () => byOrg('vw_agent_governance_final_output', 'governance_readiness ASC'),
  decisions: () => byOrg('agent_governance_decisions', 'decided_at DESC'),
  async filters() {
    const pool = await getConnectionPool(); const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT 'domain' kind, domain value FROM agent_governance_policies WHERE organization_id=@org GROUP BY domain UNION ALL SELECT 'status', status FROM agent_governance_policies WHERE organization_id=@org GROUP BY status UNION ALL SELECT 'risk', risk_level FROM agent_governance_policies WHERE organization_id=@org GROUP BY risk_level ORDER BY kind,value`)
    return r.recordset.reduce<Record<string, string[]>>((a, row) => { const k = String(row.kind); a[k] = [...(a[k] ?? []), String(row.value)]; return a }, {})
  },
}
