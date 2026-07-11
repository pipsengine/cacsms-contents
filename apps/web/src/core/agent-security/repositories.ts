import { getConnectionPool, sql } from '@cacsms/database'

export type SecurityQuery = { q?: string; type?: string; status?: string; trust?: string }
type Row = Record<string, unknown>
function camel(row: Row) { return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()), v instanceof Date ? v.toISOString() : v])) as Row }
async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Security Center.')
  return String(row.id)
}
async function byOrg(view: string, orderBy: string) {
  const pool = await getConnectionPool(); const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${view} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}
export const agentSecurityRepository = {
  organizationId,
  async summary() { const pool = await getConnectionPool(); const org = await organizationId(); const r = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_agent_security_summary WHERE organization_id=@org'); return camel(r.recordset[0] ?? {}) },
  async identities(query: SecurityQuery = {}) {
    const pool = await getConnectionPool(); const org = await organizationId(); const req = pool.request().input('org', sql.UniqueIdentifier, org); const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(identity_code LIKE @q OR identity_name LIKE @q OR identity_type LIKE @q OR linked_agent LIKE @q OR owner_name LIKE @q OR role_name LIKE @q)') }
    if (query.type && query.type !== 'All') { req.input('type', sql.NVarChar, query.type); where.push('identity_type=@type') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.trust && query.trust !== 'All') { req.input('trust', sql.NVarChar, query.trust); where.push('trust_level=@trust') }
    const r = await req.query(`SELECT * FROM vw_agent_security_identities WHERE ${where.join(' AND ')} ORDER BY risk_score DESC,last_activity DESC`)
    return r.recordset.map(camel)
  },
  domains: () => byOrg('vw_agent_security_domains', 'domain_name'),
  lifecycle: () => byOrg('agent_security_lifecycle', 'sequence_no'),
  zeroTrust: () => byOrg('agent_security_zero_trust', 'decided_at DESC'),
  permissions: () => byOrg('agent_security_permissions', 'sensitivity DESC'),
  secrets: () => byOrg('agent_security_secrets', 'days_to_expiry'),
  dlp: () => byOrg('agent_security_dlp', 'detected_at DESC'),
  behavior: () => byOrg('agent_security_behavior', 'detected_at DESC'),
  threatIntel: () => byOrg('agent_security_threat_intel', 'confidence DESC'),
  events: () => byOrg('agent_security_events', 'occurred_at DESC'),
  incidents: () => byOrg('agent_security_incidents', 'opened_at DESC'),
  containment: () => byOrg('agent_security_containment', 'executed_at DESC'),
  playbooks: () => byOrg('agent_security_playbooks', 'last_executed DESC'),
  vulnerabilities: () => byOrg('agent_security_vulnerabilities', 'detected_at DESC'),
  controls: () => byOrg('agent_security_controls', 'last_tested DESC'),
  risks: () => byOrg('agent_security_risks', 'residual_score DESC'),
  auditEvents: () => byOrg('agent_security_audit_events', 'latest_event_at DESC'),
  recommendations: () => byOrg('agent_security_recommendations', 'created_at DESC'),
  finalOutput: () => byOrg('vw_agent_security_final_output', 'security_readiness ASC'),
  async filters() {
    const pool = await getConnectionPool(); const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT 'type' kind, identity_type value FROM agent_security_identities WHERE organization_id=@org GROUP BY identity_type UNION ALL SELECT 'status', status FROM agent_security_identities WHERE organization_id=@org GROUP BY status UNION ALL SELECT 'trust', trust_level FROM agent_security_identities WHERE organization_id=@org GROUP BY trust_level ORDER BY kind,value`)
    return r.recordset.reduce<Record<string, string[]>>((a, row) => { const k = String(row.kind); a[k] = [...(a[k] ?? []), String(row.value)]; return a }, {})
  },
}
