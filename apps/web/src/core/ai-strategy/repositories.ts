import { getConnectionPool, sql } from '@cacsms/database'

export type Row = Record<string, unknown>

function camel(row: Row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Row
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for AI Strategy & Portfolio Management.')
  return String(row.id)
}

async function query(sqlText: string, inputs: Row = {}) {
  const pool = await getConnectionPool()
  const request = pool.request()
  Object.entries(inputs).forEach(([key, value]) => request.input(key, key === 'org' || key.toLowerCase().endsWith('id') ? sql.UniqueIdentifier : sql.NVarChar, value))
  const result = await request.query(sqlText)
  return result.recordset.map(camel)
}

async function byOrg(sqlText: string) {
  return query(sqlText, { org: await organizationId() })
}

async function first(sqlText: string) {
  return (await byOrg(sqlText))[0] ?? {}
}

async function optional<T>(fn: () => Promise<T>, fallback: T) {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const aiStrategyRepository = {
  organizationId,
  summary: () => first('SELECT TOP 1 * FROM vw_ai_strategy_summary WHERE organization_id=@org'),
  status: () => first('SELECT TOP 1 * FROM vw_ai_strategy_status WHERE organization_id=@org'),
  valueChain: () => byOrg('SELECT * FROM ai_strategy_value_chain WHERE organization_id=@org ORDER BY sequence_no'),
  themes: () => byOrg('SELECT * FROM ai_strategy_themes WHERE organization_id=@org ORDER BY theme_name'),
  objectives: () => byOrg('SELECT * FROM ai_strategy_objectives WHERE organization_id=@org ORDER BY priority, due_date, objective_code'),
  portfolios: () => byOrg('SELECT * FROM ai_strategy_portfolios WHERE organization_id=@org ORDER BY portfolio_name'),
  programs: () => byOrg('SELECT * FROM ai_strategy_programs WHERE organization_id=@org ORDER BY program_name'),
  initiatives: () => byOrg('SELECT * FROM ai_strategy_initiatives WHERE organization_id=@org ORDER BY priority_score DESC, initiative_code'),
  prioritization: () => byOrg('SELECT * FROM ai_strategy_prioritization WHERE organization_id=@org ORDER BY composite_score DESC'),
  portfolioBalance: () => byOrg('SELECT * FROM ai_strategy_portfolio_balance WHERE organization_id=@org ORDER BY balance_dimension'),
  funding: () => byOrg('SELECT * FROM ai_strategy_funding WHERE organization_id=@org ORDER BY funding_gap DESC'),
  capacity: () => byOrg('SELECT * FROM ai_strategy_capacity WHERE organization_id=@org ORDER BY capacity_gap DESC'),
  demandForecast: () => byOrg('SELECT * FROM ai_strategy_demand_forecast WHERE organization_id=@org ORDER BY forecast_horizon, demand_gap DESC'),
  roadmap: () => byOrg('SELECT * FROM ai_strategy_roadmap WHERE organization_id=@org ORDER BY start_date, roadmap_name'),
  milestones: () => byOrg('SELECT * FROM ai_strategy_milestones WHERE organization_id=@org ORDER BY target_date'),
  stageGates: () => byOrg('SELECT * FROM ai_strategy_stage_gates WHERE organization_id=@org ORDER BY review_date'),
  dependencies: () => byOrg('SELECT * FROM ai_strategy_dependencies WHERE organization_id=@org ORDER BY dependency_status, dependency_name'),
  duplicates: () => byOrg('SELECT * FROM ai_strategy_duplicates WHERE organization_id=@org ORDER BY duplicate_score DESC'),
  benefits: () => byOrg('SELECT * FROM ai_strategy_benefits WHERE organization_id=@org ORDER BY realized_value DESC'),
  benefitReviews: () => byOrg('SELECT * FROM ai_strategy_benefit_reviews WHERE organization_id=@org ORDER BY review_date DESC'),
  risks: () => byOrg('SELECT * FROM ai_strategy_risks WHERE organization_id=@org ORDER BY risk_score DESC'),
  assumptions: () => byOrg('SELECT * FROM ai_strategy_assumptions WHERE organization_id=@org ORDER BY validation_status, assumption_name'),
  constraints: () => byOrg('SELECT * FROM ai_strategy_constraints WHERE organization_id=@org ORDER BY severity, constraint_name'),
  scenarios: () => byOrg('SELECT * FROM ai_strategy_scenarios WHERE organization_id=@org ORDER BY updated_at DESC'),
  decisions: () => byOrg('SELECT * FROM ai_strategy_decisions WHERE organization_id=@org ORDER BY due_at, priority'),
  retirements: () => byOrg('SELECT * FROM ai_strategy_retirements WHERE organization_id=@org ORDER BY recommended_at DESC'),
  maturityRoadmap: () => byOrg('SELECT * FROM ai_strategy_maturity_roadmap WHERE organization_id=@org ORDER BY sequence_no'),
  alignment: () => byOrg('SELECT * FROM ai_strategy_alignment WHERE organization_id=@org ORDER BY alignment_score ASC'),
  analytics: () => byOrg('SELECT * FROM ai_strategy_analytics WHERE organization_id=@org ORDER BY metric_name'),
  recommendations: () => byOrg('SELECT * FROM ai_strategy_recommendations WHERE organization_id=@org ORDER BY priority, confidence DESC'),
  finalOutcomeTraceability: () => byOrg('SELECT * FROM ai_strategy_final_outcome_traceability WHERE organization_id=@org ORDER BY traceability_score ASC'),
  reports: () => byOrg('SELECT * FROM ai_strategy_reports WHERE organization_id=@org ORDER BY generated_at DESC'),
  events: () => byOrg('SELECT TOP 100 * FROM ai_strategy_events WHERE organization_id=@org ORDER BY created_at DESC'),

  operationalSignals: async () => ({
    executiveInitiatives: await optional(() => byOrg('SELECT COUNT(*) AS executive_initiatives, SUM(business_value) AS executive_business_value FROM executive_ai_initiatives WHERE organization_id=@org'), []),
    workflows: await optional(() => byOrg("SELECT COUNT(*) AS workflow_count, SUM(CASE WHEN LOWER(status) IN ('running','queued','paused','in_progress','processing') THEN 1 ELSE 0 END) AS active_workflows FROM workflow_instances WHERE organization_id=@org"), []),
  }),
}

export const AiStrategyPortfolioRepository = aiStrategyRepository
