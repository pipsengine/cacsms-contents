IF OBJECT_ID('executive_strategic_objectives','U') IS NULL
CREATE TABLE executive_strategic_objectives (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, objective_code NVARCHAR(80) NOT NULL,
  strategic_objective NVARCHAR(300) NOT NULL, executive_owner NVARCHAR(180) NULL, organization_name NVARCHAR(180) NULL, target_value NVARCHAR(120) NULL,
  actual_value NVARCHAR(120) NULL, progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, forecast_value NVARCHAR(120) NULL, confidence DECIMAL(8,2) NOT NULL DEFAULT 0,
  ai_contribution DECIMAL(8,2) NOT NULL DEFAULT 0, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, risk_level NVARCHAR(80) NOT NULL DEFAULT 'Observation',
  status NVARCHAR(80) NOT NULL DEFAULT 'Observation', due_date DATE NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_portfolio_overview','U') IS NULL
CREATE TABLE executive_portfolio_overview (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, portfolio_level NVARCHAR(100) NOT NULL,
  portfolio_name NVARCHAR(220) NOT NULL, total_initiatives INT NOT NULL DEFAULT 0, active_initiatives INT NOT NULL DEFAULT 0, planned_initiatives INT NOT NULL DEFAULT 0,
  pilots INT NOT NULL DEFAULT 0, production_initiatives INT NOT NULL DEFAULT 0, scaling_initiatives INT NOT NULL DEFAULT 0, underperforming_initiatives INT NOT NULL DEFAULT 0,
  suspended_initiatives INT NOT NULL DEFAULT 0, retired_initiatives INT NOT NULL DEFAULT 0, total_investment DECIMAL(18,2) NOT NULL DEFAULT 0,
  business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, risk_level NVARCHAR(80) NOT NULL DEFAULT 'Observation',
  maturity_score DECIMAL(8,2) NOT NULL DEFAULT 0, health_percent DECIMAL(8,2) NOT NULL DEFAULT 0, executive_owner NVARCHAR(180) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_ai_initiatives','U') IS NULL
CREATE TABLE executive_ai_initiatives (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, initiative_code NVARCHAR(80) NOT NULL,
  initiative_name NVARCHAR(260) NOT NULL, category NVARCHAR(120) NULL, organization_name NVARCHAR(180) NULL, brand_name NVARCHAR(180) NULL,
  executive_sponsor NVARCHAR(180) NULL, business_owner NVARCHAR(180) NULL, stage NVARCHAR(80) NOT NULL DEFAULT 'Assessing', status NVARCHAR(80) NOT NULL DEFAULT 'Observation',
  strategic_alignment DECIMAL(8,2) NOT NULL DEFAULT 0, investment DECIMAL(18,2) NOT NULL DEFAULT 0, operating_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, ai_maturity DECIMAL(8,2) NOT NULL DEFAULT 0,
  risk_level NVARCHAR(80) NOT NULL DEFAULT 'Observation', residual_risk NVARCHAR(80) NULL, adoption_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  production_health DECIMAL(8,2) NOT NULL DEFAULT 0, human_hours_avoided DECIMAL(18,2) NOT NULL DEFAULT 0, revenue_contribution DECIMAL(18,2) NOT NULL DEFAULT 0,
  final_outcome_readiness DECIMAL(8,2) NOT NULL DEFAULT 0, strategic_objective NVARCHAR(300) NULL, agent_count INT NOT NULL DEFAULT 0,
  workflow_count INT NOT NULL DEFAULT 0, model_count INT NOT NULL DEFAULT 0, tool_count INT NOT NULL DEFAULT 0, forecast_value NVARCHAR(120) NULL,
  forecast_confidence DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_value_chain','U') IS NULL
CREATE TABLE executive_value_chain (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(180) NOT NULL,
  current_health DECIMAL(8,2) NOT NULL DEFAULT 0, target_value NVARCHAR(120) NULL, actual_value NVARCHAR(120) NULL, variance NVARCHAR(120) NULL,
  forecast_value NVARCHAR(120) NULL, risk_level NVARCHAR(80) NOT NULL DEFAULT 'Observation', business_impact NVARCHAR(240) NULL,
  data_completeness DECIMAL(8,2) NOT NULL DEFAULT 0, status NVARCHAR(80) NOT NULL DEFAULT 'Missing Data', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_business_value','U') IS NULL
CREATE TABLE executive_business_value (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, initiative_name NVARCHAR(220) NULL,
  value_type NVARCHAR(120) NOT NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, business_outcome NVARCHAR(240) NULL,
  confidence DECIMAL(8,2) NOT NULL DEFAULT 0, period_start DATE NULL, period_end DATE NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_value_attribution','U') IS NULL
CREATE TABLE executive_value_attribution (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, initiative_name NVARCHAR(220) NULL,
  ai_component NVARCHAR(180) NULL, workflow_name NVARCHAR(180) NULL, output_name NVARCHAR(220) NULL, published_asset NVARCHAR(220) NULL,
  audience_action NVARCHAR(180) NULL, commercial_action NVARCHAR(180) NULL, attribution_method NVARCHAR(120) NOT NULL DEFAULT 'Direct Attribution',
  financial_value DECIMAL(18,2) NOT NULL DEFAULT 0, confidence DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_roi','U') IS NULL
CREATE TABLE executive_roi (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, scope_name NVARCHAR(220) NOT NULL,
  gross_business_value DECIMAL(18,2) NOT NULL DEFAULT 0, direct_revenue DECIMAL(18,2) NOT NULL DEFAULT 0, assisted_revenue DECIMAL(18,2) NOT NULL DEFAULT 0,
  cost_savings DECIMAL(18,2) NOT NULL DEFAULT 0, productivity_value DECIMAL(18,2) NOT NULL DEFAULT 0, risk_avoided DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_ai_cost DECIMAL(18,2) NOT NULL DEFAULT 0, infrastructure_cost DECIMAL(18,2) NOT NULL DEFAULT 0, model_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  tool_cost DECIMAL(18,2) NOT NULL DEFAULT 0, workforce_cost DECIMAL(18,2) NOT NULL DEFAULT 0, publishing_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  governance_cost DECIMAL(18,2) NOT NULL DEFAULT 0, security_cost DECIMAL(18,2) NOT NULL DEFAULT 0, net_ai_value DECIMAL(18,2) NOT NULL DEFAULT 0,
  roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, payback_period NVARCHAR(80) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_financial_performance','U') IS NULL
CREATE TABLE executive_financial_performance (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, metric_name NVARCHAR(180) NOT NULL,
  actual_spend DECIMAL(18,2) NOT NULL DEFAULT 0, budget DECIMAL(18,2) NOT NULL DEFAULT 0, variance DECIMAL(18,2) NOT NULL DEFAULT 0,
  forecast DECIMAL(18,2) NOT NULL DEFAULT 0, committed_spend DECIMAL(18,2) NOT NULL DEFAULT 0, run_rate_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  cost_avoided DECIMAL(18,2) NOT NULL DEFAULT 0, net_benefit DECIMAL(18,2) NOT NULL DEFAULT 0, period_start DATE NULL, period_end DATE NULL
);

IF OBJECT_ID('executive_productivity','U') IS NULL
CREATE TABLE executive_productivity (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, productivity_area NVARCHAR(180) NOT NULL,
  human_effort_before DECIMAL(18,2) NOT NULL DEFAULT 0, human_effort_after DECIMAL(18,2) NOT NULL DEFAULT 0, human_hours_avoided DECIMAL(18,2) NOT NULL DEFAULT 0,
  cost_saved DECIMAL(18,2) NOT NULL DEFAULT 0, productivity_gain DECIMAL(8,2) NOT NULL DEFAULT 0, autonomy_contribution DECIMAL(8,2) NOT NULL DEFAULT 0
);

IF OBJECT_ID('executive_adoption','U') IS NULL
CREATE TABLE executive_adoption (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, scope_name NVARCHAR(180) NOT NULL,
  adoption_stage NVARCHAR(80) NOT NULL DEFAULT 'Exploring', teams_using_ai INT NOT NULL DEFAULT 0, workflow_adoption DECIMAL(8,2) NOT NULL DEFAULT 0,
  ai_generated_output_share DECIMAL(8,2) NOT NULL DEFAULT 0, autonomous_output_share DECIMAL(8,2) NOT NULL DEFAULT 0, adoption_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  adoption_barriers NVARCHAR(500) NULL, recommended_action NVARCHAR(500) NULL
);

IF OBJECT_ID('executive_maturity','U') IS NULL
CREATE TABLE executive_maturity (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, dimension_name NVARCHAR(120) NOT NULL,
  current_score DECIMAL(8,2) NOT NULL DEFAULT 0, target_score DECIMAL(8,2) NOT NULL DEFAULT 0, gap_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  trend NVARCHAR(80) NULL, evidence NVARCHAR(700) NULL, recommended_action NVARCHAR(500) NULL, executive_owner NVARCHAR(180) NULL
);

IF OBJECT_ID('executive_risks','U') IS NULL
CREATE TABLE executive_risks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, risk_domain NVARCHAR(120) NOT NULL,
  likelihood DECIMAL(8,2) NOT NULL DEFAULT 0, impact DECIMAL(8,2) NOT NULL DEFAULT 0, severity NVARCHAR(80) NOT NULL DEFAULT 'Observation',
  risk_owner NVARCHAR(180) NULL, residual_risk NVARCHAR(80) NULL, mitigation_status NVARCHAR(120) NULL, business_impact NVARCHAR(500) NULL,
  final_output_impact NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('executive_governance_readiness','U') IS NULL
CREATE TABLE executive_governance_readiness (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, governance_domain NVARCHAR(160) NOT NULL,
  readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0, policy_coverage DECIMAL(8,2) NOT NULL DEFAULT 0, control_effectiveness DECIMAL(8,2) NOT NULL DEFAULT 0,
  open_gaps INT NOT NULL DEFAULT 0, overdue_approvals INT NOT NULL DEFAULT 0, violation_count INT NOT NULL DEFAULT 0, evidence_completeness DECIMAL(8,2) NOT NULL DEFAULT 0,
  executive_decision_required NVARCHAR(220) NULL
);

IF OBJECT_ID('executive_security_readiness','U') IS NULL
CREATE TABLE executive_security_readiness (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, security_domain NVARCHAR(160) NOT NULL,
  readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0, identity_risk NVARCHAR(80) NULL, permission_risk NVARCHAR(80) NULL, secrets_health NVARCHAR(80) NULL,
  incident_count INT NOT NULL DEFAULT 0, vulnerability_exposure NVARCHAR(120) NULL, remediation_cost DECIMAL(18,2) NOT NULL DEFAULT 0, executive_decision_required NVARCHAR(220) NULL
);

IF OBJECT_ID('executive_operational_resilience','U') IS NULL
CREATE TABLE executive_operational_resilience (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, resilience_domain NVARCHAR(160) NOT NULL,
  availability_percent DECIMAL(8,2) NOT NULL DEFAULT 0, reliability_percent DECIMAL(8,2) NOT NULL DEFAULT 0, recovery_success DECIMAL(8,2) NOT NULL DEFAULT 0,
  mttr_minutes DECIMAL(18,2) NOT NULL DEFAULT 0, capacity_headroom DECIMAL(8,2) NOT NULL DEFAULT 0, resilience_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  business_continuity_risk NVARCHAR(120) NULL, recommended_investment NVARCHAR(300) NULL
);

IF OBJECT_ID('executive_capacity_forecast','U') IS NULL
CREATE TABLE executive_capacity_forecast (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, resource_name NVARCHAR(160) NOT NULL,
  forecast_horizon NVARCHAR(80) NOT NULL, current_capacity DECIMAL(18,2) NOT NULL DEFAULT 0, forecast_demand DECIMAL(18,2) NOT NULL DEFAULT 0,
  capacity_gap DECIMAL(18,2) NOT NULL DEFAULT 0, required_investment DECIMAL(18,2) NOT NULL DEFAULT 0, expected_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  risk_of_no_action NVARCHAR(500) NULL, recommended_timing NVARCHAR(120) NULL
);

IF OBJECT_ID('executive_investment_planning','U') IS NULL
CREATE TABLE executive_investment_planning (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, investment_name NVARCHAR(220) NOT NULL,
  investment_category NVARCHAR(120) NOT NULL, business_case NVARCHAR(700) NULL, required_budget DECIMAL(18,2) NOT NULL DEFAULT 0,
  expected_return DECIMAL(18,2) NOT NULL DEFAULT 0, payback_period NVARCHAR(80) NULL, strategic_alignment DECIMAL(8,2) NOT NULL DEFAULT 0,
  risk_reduction DECIMAL(8,2) NOT NULL DEFAULT 0, capacity_impact DECIMAL(8,2) NOT NULL DEFAULT 0, revenue_impact DECIMAL(18,2) NOT NULL DEFAULT 0,
  priority NVARCHAR(80) NOT NULL DEFAULT 'Review', recommendation NVARCHAR(80) NOT NULL DEFAULT 'Maintain'
);

IF OBJECT_ID('executive_organization_comparison','U') IS NULL
CREATE TABLE executive_organization_comparison (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, organization_name NVARCHAR(180) NOT NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, risk_level NVARCHAR(80) NULL, maturity_score DECIMAL(8,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_brand_comparison','U') IS NULL
CREATE TABLE executive_brand_comparison (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, brand_name NVARCHAR(180) NOT NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, risk_level NVARCHAR(80) NULL, maturity_score DECIMAL(8,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_content_portfolio','U') IS NULL
CREATE TABLE executive_content_portfolio (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, content_name NVARCHAR(220) NOT NULL, content_type NVARCHAR(120) NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, final_outcome NVARCHAR(220) NULL);
IF OBJECT_ID('executive_platform_performance','U') IS NULL
CREATE TABLE executive_platform_performance (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, platform_name NVARCHAR(160) NOT NULL, revenue_attributed DECIMAL(18,2) NOT NULL DEFAULT 0, engagement_value DECIMAL(18,2) NOT NULL DEFAULT 0, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_campaign_performance','U') IS NULL
CREATE TABLE executive_campaign_performance (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, campaign_name NVARCHAR(220) NOT NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0, revenue_attributed DECIMAL(18,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_workforce','U') IS NULL
CREATE TABLE executive_workforce (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, workforce_name NVARCHAR(180) NOT NULL, business_value DECIMAL(18,2) NOT NULL DEFAULT 0, productivity_gain DECIMAL(8,2) NOT NULL DEFAULT 0, human_hours_avoided DECIMAL(18,2) NOT NULL DEFAULT 0, roi_percent DECIMAL(8,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_scenarios','U') IS NULL
CREATE TABLE executive_scenarios (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, scenario_name NVARCHAR(220) NOT NULL, status NVARCHAR(80) NOT NULL DEFAULT 'Draft', confidence DECIMAL(8,2) NOT NULL DEFAULT 0, expected_value DECIMAL(18,2) NOT NULL DEFAULT 0, updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_forecasts','U') IS NULL
CREATE TABLE executive_forecasts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, forecast_name NVARCHAR(220) NOT NULL, forecast_metric NVARCHAR(180) NULL, forecast_value DECIMAL(18,2) NOT NULL DEFAULT 0, confidence DECIMAL(8,2) NOT NULL DEFAULT 0, generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_recommendations','U') IS NULL
CREATE TABLE executive_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, recommendation NVARCHAR(700) NOT NULL, priority NVARCHAR(80) NOT NULL DEFAULT 'Review', confidence DECIMAL(8,2) NOT NULL DEFAULT 0, owner NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_decision_queue','U') IS NULL
CREATE TABLE executive_decision_queue (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_title NVARCHAR(260) NOT NULL, priority NVARCHAR(80) NOT NULL DEFAULT 'Review', owner NVARCHAR(180) NULL, status NVARCHAR(80) NOT NULL DEFAULT 'Open', due_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_alerts','U') IS NULL
CREATE TABLE executive_alerts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, alert_name NVARCHAR(220) NOT NULL, severity NVARCHAR(80) NOT NULL DEFAULT 'Info', status NVARCHAR(80) NOT NULL DEFAULT 'Open', message NVARCHAR(700) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_reports','U') IS NULL
CREATE TABLE executive_reports (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, report_name NVARCHAR(220) NOT NULL, report_type NVARCHAR(120) NULL, status NVARCHAR(80) NOT NULL DEFAULT 'Generated', generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('executive_report_schedules','U') IS NULL
CREATE TABLE executive_report_schedules (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, report_name NVARCHAR(220) NOT NULL, cadence NVARCHAR(80) NULL, status NVARCHAR(80) NOT NULL DEFAULT 'Active', next_run_at DATETIME2 NULL);
IF OBJECT_ID('executive_data_quality','U') IS NULL
CREATE TABLE executive_data_quality (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_name NVARCHAR(180) NOT NULL, metric_name NVARCHAR(180) NULL, quality_score DECIMAL(8,2) NOT NULL DEFAULT 0, status NVARCHAR(80) NOT NULL DEFAULT 'Observation', issue NVARCHAR(500) NULL);
IF OBJECT_ID('executive_data_lineage','U') IS NULL
CREATE TABLE executive_data_lineage (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_name NVARCHAR(180) NOT NULL, metric_name NVARCHAR(180) NULL, lineage_state NVARCHAR(120) NOT NULL DEFAULT 'Unverified', upstream_source NVARCHAR(180) NULL);
IF OBJECT_ID('executive_final_outcome_traceability','U') IS NULL
CREATE TABLE executive_final_outcome_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, final_outcome NVARCHAR(260) NOT NULL, initiative_name NVARCHAR(220) NULL, output_name NVARCHAR(220) NULL, traceability_state NVARCHAR(120) NOT NULL DEFAULT 'Partial', business_value DECIMAL(18,2) NOT NULL DEFAULT 0);
IF OBJECT_ID('executive_events','U') IS NULL
CREATE TABLE executive_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, event_type NVARCHAR(160) NOT NULL, source_name NVARCHAR(180) NULL, severity NVARCHAR(80) NOT NULL DEFAULT 'info', message NVARCHAR(700) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('vw_executive_command_summary','V') IS NOT NULL DROP VIEW vw_executive_command_summary;
EXEC('CREATE VIEW vw_executive_command_summary AS
SELECT o.id AS organization_id,
  CAST(COALESCE(AVG(p.health_percent),0) AS DECIMAL(8,2)) AS ai_portfolio_health,
  COUNT(DISTINCT so.id) AS strategic_objective_count,
  SUM(CASE WHEN so.status IN (''On Track'',''Ahead'',''Completed'') THEN 1 ELSE 0 END) AS objectives_on_track,
  CAST(COALESCE(AVG(r.roi_percent),0) AS DECIMAL(8,2)) AS ai_roi,
  COALESCE(SUM(b.business_value),0) AS business_value_generated,
  COALESCE(SUM(r.total_ai_cost),0) AS ai_operating_cost,
  COALESCE(SUM(r.net_ai_value),0) AS net_ai_value,
  COALESCE(SUM(pr.human_hours_avoided),0) AS human_hours_avoided,
  COALESCE(SUM(a.financial_value),0) AS revenue_attributed_to_ai,
  CASE WHEN SUM(CASE WHEN risks.severity=''Critical'' THEN 1 ELSE 0 END)>0 THEN ''Critical'' WHEN COUNT(risks.id)>0 THEN ''Moderate'' ELSE ''Observation'' END AS executive_risk_level,
  COUNT(d.id) AS human_attention_required,
  MAX(ev.created_at) AS last_executive_update
FROM organizations o
LEFT JOIN executive_portfolio_overview p ON p.organization_id=o.id
LEFT JOIN executive_strategic_objectives so ON so.organization_id=o.id
LEFT JOIN executive_roi r ON r.organization_id=o.id
LEFT JOIN executive_business_value b ON b.organization_id=o.id
LEFT JOIN executive_productivity pr ON pr.organization_id=o.id
LEFT JOIN executive_value_attribution a ON a.organization_id=o.id
LEFT JOIN executive_risks risks ON risks.organization_id=o.id
LEFT JOIN executive_decision_queue d ON d.organization_id=o.id AND d.status<>''Closed''
LEFT JOIN executive_events ev ON ev.organization_id=o.id
GROUP BY o.id');

IF OBJECT_ID('vw_executive_intelligence_status','V') IS NOT NULL DROP VIEW vw_executive_intelligence_status;
EXEC('CREATE VIEW vw_executive_intelligence_status AS
SELECT o.id AS organization_id,
  CASE WHEN COUNT(ev.id)>0 THEN ''Real-Time Executive Intelligence'' ELSE ''Observation Only'' END AS current_executive_intelligence_mode,
  ''database-backed'' AS data_freshness,
  ''Ready'' AS portfolio_analytics_engine, ''Ready'' AS business_value_attribution_engine, ''Ready'' AS financial_analytics_engine,
  ''Ready'' AS strategic_objective_monitor, ''Ready'' AS ai_maturity_engine, ''Ready'' AS executive_risk_engine, ''Ready'' AS investment_analytics_engine,
  ''Ready'' AS capacity_forecasting_engine, ''Ready'' AS scenario_planning_engine, ''Ready'' AS cross_organization_comparison_engine,
  ''Ready'' AS executive_recommendation_engine, ''Ready'' AS board_report_generator, ''Ready'' AS data_quality_validator, ''Ready'' AS audit_pipeline,
  COUNT(DISTINCT oc.id) AS organizations_reporting,
  COUNT(DISTINCT bc.id) AS brands_reporting,
  COUNT(DISTINCT i.id) AS initiatives_monitored,
  COUNT(DISTINCT bv.id) AS business_kpis_connected,
  COUNT(DISTINCT f.id) AS forecast_jobs_running,
  COUNT(DISTINCT r.id) AS open_strategic_risks,
  COUNT(DISTINCT rec.id) AS recommendations_awaiting_review,
  COALESCE(MAX(r.risk_domain),''none'') AS current_strategic_bottleneck,
  COALESCE(MAX(rec.recommendation),''none'') AS last_autonomous_executive_insight,
  COUNT(DISTINCT d.id) AS human_attention_required,
  MAX(ev.created_at) AS last_executive_update
FROM organizations o
LEFT JOIN executive_events ev ON ev.organization_id=o.id
LEFT JOIN executive_organization_comparison oc ON oc.organization_id=o.id
LEFT JOIN executive_brand_comparison bc ON bc.organization_id=o.id
LEFT JOIN executive_ai_initiatives i ON i.organization_id=o.id
LEFT JOIN executive_business_value bv ON bv.organization_id=o.id
LEFT JOIN executive_forecasts f ON f.organization_id=o.id
LEFT JOIN executive_risks r ON r.organization_id=o.id
LEFT JOIN executive_recommendations rec ON rec.organization_id=o.id
LEFT JOIN executive_decision_queue d ON d.organization_id=o.id AND d.status<>''Closed''
GROUP BY o.id');

IF OBJECT_ID('vw_executive_strategic_objectives','V') IS NOT NULL DROP VIEW vw_executive_strategic_objectives;
EXEC('CREATE VIEW vw_executive_strategic_objectives AS SELECT * FROM executive_strategic_objectives');
IF OBJECT_ID('vw_executive_portfolio','V') IS NOT NULL DROP VIEW vw_executive_portfolio;
EXEC('CREATE VIEW vw_executive_portfolio AS SELECT * FROM executive_portfolio_overview');
IF OBJECT_ID('vw_executive_initiatives','V') IS NOT NULL DROP VIEW vw_executive_initiatives;
EXEC('CREATE VIEW vw_executive_initiatives AS SELECT * FROM executive_ai_initiatives');
IF OBJECT_ID('vw_executive_business_value','V') IS NOT NULL DROP VIEW vw_executive_business_value;
EXEC('CREATE VIEW vw_executive_business_value AS SELECT * FROM executive_business_value');
IF OBJECT_ID('vw_executive_roi','V') IS NOT NULL DROP VIEW vw_executive_roi;
EXEC('CREATE VIEW vw_executive_roi AS SELECT * FROM executive_roi');
IF OBJECT_ID('vw_executive_risk_heatmap','V') IS NOT NULL DROP VIEW vw_executive_risk_heatmap;
EXEC('CREATE VIEW vw_executive_risk_heatmap AS SELECT * FROM executive_risks');
IF OBJECT_ID('vw_executive_data_quality','V') IS NOT NULL DROP VIEW vw_executive_data_quality;
EXEC('CREATE VIEW vw_executive_data_quality AS SELECT * FROM executive_data_quality');
IF OBJECT_ID('vw_executive_final_outcome_traceability','V') IS NOT NULL DROP VIEW vw_executive_final_outcome_traceability;
EXEC('CREATE VIEW vw_executive_final_outcome_traceability AS SELECT * FROM executive_final_outcome_traceability');
