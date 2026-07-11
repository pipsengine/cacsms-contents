import { getConnectionPool, sql } from '@cacsms/database'

export type Row = Record<string, unknown>

function camel(row: Row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value instanceof Date ? value.toISOString() : value,
    ])
  ) as Row
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for AI Executive Command Center.')
  return String(row.id)
}

async function query(sqlText: string, inputs: Row = {}) {
  const pool = await getConnectionPool()
  const request = pool.request()
  Object.entries(inputs).forEach(([key, value]) => {
    const isId = key === 'org' || key.toLowerCase().endsWith('id')
    request.input(key, isId ? sql.UniqueIdentifier : sql.NVarChar, value)
  })
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

export const executiveCommandRepository = {
  organizationId,

  summary: () => first('SELECT TOP 1 * FROM vw_executive_command_summary WHERE organization_id = @org'),
  intelligenceStatus: () => first('SELECT TOP 1 * FROM vw_executive_intelligence_status WHERE organization_id = @org'),
  valueChain: () => byOrg('SELECT * FROM executive_value_chain WHERE organization_id = @org ORDER BY sequence_no'),
  objectives: () => byOrg('SELECT * FROM executive_strategic_objectives WHERE organization_id = @org ORDER BY due_date, objective_code'),
  portfolio: () => byOrg('SELECT * FROM executive_portfolio_overview WHERE organization_id = @org ORDER BY portfolio_level, portfolio_name'),
  initiatives: () => byOrg('SELECT * FROM executive_ai_initiatives WHERE organization_id = @org ORDER BY business_value DESC, initiative_code'),
  businessValue: () => byOrg('SELECT * FROM executive_business_value WHERE organization_id = @org ORDER BY business_value DESC'),
  attribution: () => byOrg('SELECT * FROM executive_value_attribution WHERE organization_id = @org ORDER BY financial_value DESC'),
  roi: () => byOrg('SELECT * FROM executive_roi WHERE organization_id = @org ORDER BY roi_percent DESC'),
  financial: () => byOrg('SELECT * FROM executive_financial_performance WHERE organization_id = @org ORDER BY period_start DESC, metric_name'),
  productivity: () => byOrg('SELECT * FROM executive_productivity WHERE organization_id = @org ORDER BY human_hours_avoided DESC'),
  adoption: () => byOrg('SELECT * FROM executive_adoption WHERE organization_id = @org ORDER BY adoption_rate DESC'),
  maturity: () => byOrg('SELECT * FROM executive_maturity WHERE organization_id = @org ORDER BY dimension_name'),
  risks: () => byOrg('SELECT * FROM executive_risks WHERE organization_id = @org ORDER BY impact DESC, likelihood DESC'),
  governance: () => byOrg('SELECT * FROM executive_governance_readiness WHERE organization_id = @org ORDER BY readiness_percent ASC'),
  security: () => byOrg('SELECT * FROM executive_security_readiness WHERE organization_id = @org ORDER BY readiness_percent ASC'),
  resilience: () => byOrg('SELECT * FROM executive_operational_resilience WHERE organization_id = @org ORDER BY resilience_score ASC'),
  capacity: () => byOrg('SELECT * FROM executive_capacity_forecast WHERE organization_id = @org ORDER BY forecast_horizon, capacity_gap DESC'),
  investments: () => byOrg('SELECT * FROM executive_investment_planning WHERE organization_id = @org ORDER BY priority, expected_return DESC'),
  organizationComparison: () => byOrg('SELECT * FROM executive_organization_comparison WHERE organization_id = @org ORDER BY business_value DESC'),
  brandComparison: () => byOrg('SELECT * FROM executive_brand_comparison WHERE organization_id = @org ORDER BY business_value DESC'),
  contentPortfolio: () => byOrg('SELECT * FROM executive_content_portfolio WHERE organization_id = @org ORDER BY business_value DESC'),
  platforms: () => byOrg('SELECT * FROM executive_platform_performance WHERE organization_id = @org ORDER BY revenue_attributed DESC'),
  campaigns: () => byOrg('SELECT * FROM executive_campaign_performance WHERE organization_id = @org ORDER BY roi_percent DESC'),
  workforce: () => byOrg('SELECT * FROM executive_workforce WHERE organization_id = @org ORDER BY business_value DESC'),
  scenarios: () => byOrg('SELECT * FROM executive_scenarios WHERE organization_id = @org ORDER BY updated_at DESC'),
  forecasts: () => byOrg('SELECT * FROM executive_forecasts WHERE organization_id = @org ORDER BY generated_at DESC'),
  recommendations: () => byOrg('SELECT * FROM executive_recommendations WHERE organization_id = @org ORDER BY priority, confidence DESC'),
  decisions: () => byOrg('SELECT * FROM executive_decision_queue WHERE organization_id = @org ORDER BY due_at, priority'),
  alerts: () => byOrg('SELECT * FROM executive_alerts WHERE organization_id = @org ORDER BY created_at DESC'),
  reports: () => byOrg('SELECT * FROM executive_reports WHERE organization_id = @org ORDER BY generated_at DESC'),
  reportSchedules: () => byOrg('SELECT * FROM executive_report_schedules WHERE organization_id = @org ORDER BY next_run_at'),
  dataQuality: () => byOrg('SELECT * FROM executive_data_quality WHERE organization_id = @org ORDER BY quality_score ASC'),
  dataLineage: () => byOrg('SELECT * FROM executive_data_lineage WHERE organization_id = @org ORDER BY source_name, metric_name'),
  finalOutcomeTraceability: () => byOrg('SELECT * FROM executive_final_outcome_traceability WHERE organization_id = @org ORDER BY business_value DESC'),
  events: () => byOrg('SELECT TOP 100 * FROM executive_events WHERE organization_id = @org ORDER BY created_at DESC'),

  async operationalSignals() {
    return {
      workflows: await optional(() => byOrg(`
        SELECT
          COUNT(*) AS total_workflows,
          SUM(CASE WHEN LOWER(status) IN ('running','queued','paused','in_progress','processing') THEN 1 ELSE 0 END) AS active_workflows,
          SUM(CASE WHEN LOWER(status) = 'completed' THEN 1 ELSE 0 END) AS completed_workflows,
          SUM(CASE WHEN LOWER(status) = 'failed' THEN 1 ELSE 0 END) AS failed_workflows,
          AVG(CAST(progress_percent AS DECIMAL(18,2))) AS average_progress,
          MAX(updated_at) AS last_update
        FROM workflow_instances
        WHERE organization_id = @org
      `), []),
      agents: await optional(() => byOrg(`
        SELECT
          COUNT(*) AS total_runs,
          SUM(CASE WHEN LOWER(status) IN ('running','planning','waiting on tool','validating output','retrying','recovering') THEN 1 ELSE 0 END) AS running_runs,
          AVG(CAST(confidence_score AS DECIMAL(18,2))) AS average_confidence,
          AVG(CAST(latency_ms AS DECIMAL(18,2))) AS average_latency_ms,
          SUM(CAST(actual_cost AS DECIMAL(18,4))) AS total_agent_cost,
          MAX(updated_at) AS last_update
        FROM ai_agent_runs
        WHERE organization_id = @org
      `), []),
      queues: await optional(() => byOrg(`
        SELECT
          COUNT(*) AS queue_count,
          AVG(CAST(health_percent AS DECIMAL(18,2))) AS average_queue_health,
          SUM(CASE WHEN LOWER(status) NOT IN ('healthy','active','ready') THEN 1 ELSE 0 END) AS degraded_queues
        FROM job_queues
        WHERE organization_id = @org
      `), []),
    }
  },
}

export const ExecutiveCommandRepository = executiveCommandRepository
