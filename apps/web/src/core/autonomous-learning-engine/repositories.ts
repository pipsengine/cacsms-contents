import { getConnectionPool, sql } from '@cacsms/database'

export type LearningQuery = { q?: string; domain?: string; status?: string; severity?: string; type?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Autonomous Learning Engine.')
  return String(row.id)
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const autonomousLearningRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_autonomous_learning_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  domains: () => byOrgView('learning_domains', 'health_percent ASC, domain_name'),
  sourceMatrix: () => byOrgView('learning_source_matrix', 'source_name'),
  patterns: () => byOrgView('learning_patterns', 'confidence DESC'),
  rootCauses: () => byOrgView('learning_root_causes', 'causal_confidence DESC'),
  experiments: () => byOrgView('vw_learning_experiments', 'confidence DESC'),
  improvements: () => byOrgView('vw_learning_improvements', 'actual_final_output_impact DESC'),
  rollbacks: () => byOrgView('vw_learning_rollbacks', 'restored_at DESC'),
  memory: () => byOrgView('learning_memory', 'confidence DESC'),
  models: () => byOrgView('learning_models', 'drift_score DESC'),
  drift: () => byOrgView('vw_learning_drift', 'detected_at DESC'),
  businessImpact: () => byOrgView('vw_learning_business_impact', 'impact_percent DESC'),
  finalOutput: () => byOrgView('vw_learning_final_output_traceability', 'quality_delta DESC'),
  async signals(query: LearningQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(signal_code LIKE @q OR source_component LIKE @q OR source_type LIKE @q OR event_name LIKE @q OR workflow_name LIKE @q OR agent_name LIKE @q)') }
    if (query.type && query.type !== 'All') { request.input('type', sql.NVarChar, query.type); where.push('signal_type=@type') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('processing_status=@status') }
    if (query.severity && query.severity !== 'All') { request.input('severity', sql.NVarChar, query.severity); where.push('severity=@severity') }
    const result = await request.query(`SELECT * FROM vw_learning_signals WHERE ${where.join(' AND ')} ORDER BY occurred_at DESC`)
    return result.recordset.map(camel)
  },
  async insights(query: LearningQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(insight_code LIKE @q OR insight_title LIKE @q OR domain LIKE @q OR affected_component LIKE @q OR root_cause LIKE @q)') }
    if (query.domain && query.domain !== 'All') { request.input('domain', sql.NVarChar, query.domain); where.push('domain=@domain') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.severity && query.severity !== 'All') { request.input('severity', sql.NVarChar, query.severity); where.push('severity=@severity') }
    const result = await request.query(`SELECT * FROM vw_learning_insights WHERE ${where.join(' AND ')} ORDER BY CASE WHEN severity='high' THEN 0 ELSE 1 END, confidence DESC, detected_at DESC`)
    return result.recordset.map(camel)
  },
  async recommendations(query: LearningQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(recommendation_code LIKE @q OR recommendation_title LIKE @q OR domain LIKE @q OR target_component LIKE @q)') }
    if (query.domain && query.domain !== 'All') { request.input('domain', sql.NVarChar, query.domain); where.push('domain=@domain') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    const result = await request.query(`SELECT * FROM vw_learning_recommendations WHERE ${where.join(' AND ')} ORDER BY CASE WHEN status IN ('Ready','Governance Pending','Approved') THEN 0 ELSE 1 END, confidence DESC, created_at DESC`)
    return result.recordset.map(camel)
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'domain' kind, domain value FROM vw_learning_insights WHERE organization_id=@org GROUP BY domain
      UNION ALL SELECT 'status', status FROM vw_learning_insights WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'severity', severity FROM vw_learning_insights WHERE organization_id=@org GROUP BY severity
      UNION ALL SELECT 'type', signal_type FROM vw_learning_signals WHERE organization_id=@org GROUP BY signal_type
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AutonomousLearningRepository = autonomousLearningRepository
