import { getConnectionPool, sql } from '@cacsms/database'

export type AuditQuery = { q?: string; type?: string; status?: string; risk?: string }
function camel(row: Record<string, unknown>) { return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l: string) => l.toUpperCase()), v instanceof Date ? v.toISOString() : v])) as Record<string, unknown> }
async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Audit & Decision Trace.')
  return String(row.id)
}
async function byOrg(view: string, orderBy: string) {
  const pool = await getConnectionPool(); const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${view} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}
export const agentAuditRepository = {
  organizationId,
  async summary() { const pool = await getConnectionPool(); const org = await organizationId(); const r = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_audit_dashboard_summary WHERE organization_id=@org'); return camel(r.recordset[0] ?? {}) },
  async decisions(query: AuditQuery = {}) {
    const pool = await getConnectionPool(); const org = await organizationId(); const req = pool.request().input('org', sql.UniqueIdentifier, org); const where = ['organization_id=@org']
    if (query.q) { req.input('q', sql.NVarChar, `%${query.q}%`); where.push('(decision_code LIKE @q OR decision_type LIKE @q OR agent_name LIKE @q OR workflow_name LIKE @q OR objective LIKE @q OR reason LIKE @q)') }
    if (query.type && query.type !== 'All') { req.input('type', sql.NVarChar, query.type); where.push('decision_type=@type') }
    if (query.status && query.status !== 'All') { req.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.risk === 'High') where.push('risk>=30')
    const r = await req.query(`SELECT * FROM vw_ai_decisions WHERE ${where.join(' AND ')} ORDER BY created_at DESC`)
    return r.recordset.map(camel)
  },
  auditLogs: () => byOrg('vw_ai_audit_logs', 'occurred_at DESC'),
  replay: () => byOrg('vw_ai_decision_replay', 'decision_code, second_offset'),
  forensics: () => byOrg('vw_ai_forensics', 'investigation_code'),
  compliance: () => byOrg('vw_ai_compliance', 'policy_name'),
  finalOutput: () => byOrg('vw_ai_final_output_trace', 'traceability_score ASC'),
  evidence: () => byOrg('ai_decision_evidence', 'retained_until DESC'),
  integrity: () => byOrg('ai_integrity', 'integrity_score ASC'),
  graph: () => byOrg('ai_decision_graph', 'from_node, to_node'),
  reasoning: () => byOrg('ai_decision_reasoning', 'id'),
  async filters() {
    const pool = await getConnectionPool(); const org = await organizationId()
    const r = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT 'type' kind, decision_type value FROM vw_ai_decisions WHERE organization_id=@org GROUP BY decision_type UNION ALL SELECT 'status', status FROM vw_ai_decisions WHERE organization_id=@org GROUP BY status ORDER BY kind,value`)
    return r.recordset.reduce<Record<string, string[]>>((a, row) => { const k = String(row.kind); a[k] = [...(a[k] ?? []), String(row.value)]; return a }, {})
  },
}
