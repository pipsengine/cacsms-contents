import { getConnectionPool, sql } from '@cacsms/database'

export type EvaluationQuery = { q?: string; type?: string; status?: string; certification?: string; category?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Evaluation & Benchmarking.')
  return String(row.id)
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const evaluationBenchmarkingRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_evaluation_dashboard_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async components(query: EvaluationQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(component_code LIKE @q OR component_name LIKE @q OR component_type LIKE @q OR owner LIKE @q)') }
    if (query.type && query.type !== 'All') { request.input('type', sql.NVarChar, query.type); where.push('component_type=@type') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    if (query.certification && query.certification !== 'All') { request.input('certification', sql.NVarChar, query.certification); where.push('certification=@certification') }
    const result = await request.query(`SELECT * FROM vw_evaluation_components WHERE ${where.join(' AND ')} ORDER BY CASE WHEN status IN ('Failed','Watch') THEN 0 ELSE 1 END, current_score ASC, component_code`)
    return result.recordset.map(camel)
  },
  async benchmarks(query: EvaluationQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(benchmark_code LIKE @q OR component_name LIKE @q OR benchmark_category LIKE @q OR dataset_name LIKE @q)') }
    if (query.category && query.category !== 'All') { request.input('category', sql.NVarChar, query.category); where.push('benchmark_category=@category') }
    const result = await request.query(`SELECT * FROM vw_evaluation_benchmarks WHERE ${where.join(' AND ')} ORDER BY started_at DESC`)
    return result.recordset.map(camel)
  },
  qualityScores: () => byOrgView('vw_evaluation_quality_dimensions', 'score ASC, dimension'),
  goldenDatasets: () => byOrgView('ai_golden_datasets', 'domain'),
  safetyTests: () => byOrgView('ai_safety_tests', 'pass_rate ASC, last_run_at DESC'),
  securityTests: () => byOrgView('ai_security_tests', 'pass_rate ASC, last_run_at DESC'),
  regressionTests: () => byOrgView('ai_regression_tests', 'regressions_found DESC, last_run_at DESC'),
  certifications: () => byOrgView('ai_certifications', 'certification_state, certified_at DESC'),
  abTests: () => byOrgView('ai_ab_tests', 'confidence DESC'),
  canaryTests: () => byOrgView('ai_canary_tests', 'confidence DESC'),
  leaderboards: () => byOrgView('vw_evaluation_leaderboards', 'category, rank_position'),
  recommendations: () => byOrgView('ai_recommendations', 'confidence_percent DESC, created_at DESC'),
  finalOutputScores: () => byOrgView('vw_evaluation_final_output_scores', 'final_score ASC'),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'type' kind, component_type value FROM vw_evaluation_components WHERE organization_id=@org GROUP BY component_type
      UNION ALL SELECT 'status', status FROM vw_evaluation_components WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'certification', certification FROM vw_evaluation_components WHERE organization_id=@org GROUP BY certification
      UNION ALL SELECT 'category', benchmark_category FROM vw_evaluation_benchmarks WHERE organization_id=@org GROUP BY benchmark_category
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const EvaluationBenchmarkingRepository = evaluationBenchmarkingRepository
