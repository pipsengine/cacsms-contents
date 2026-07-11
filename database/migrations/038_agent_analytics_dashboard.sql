IF OBJECT_ID('dbo.vw_agent_analytics_summary','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_summary;
IF OBJECT_ID('dbo.vw_agent_analytics_agents','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_agents;
IF OBJECT_ID('dbo.vw_agent_analytics_dimension_cards','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_dimension_cards;
IF OBJECT_ID('dbo.vw_agent_analytics_coverage','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_coverage;
IF OBJECT_ID('dbo.vw_agent_analytics_business_impact','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_business_impact;
IF OBJECT_ID('dbo.vw_agent_analytics_final_output_traceability','V') IS NOT NULL DROP VIEW dbo.vw_agent_analytics_final_output_traceability;

IF OBJECT_ID('dbo.agent_analytics_lineage','U') IS NOT NULL DROP TABLE dbo.agent_analytics_lineage;
IF OBJECT_ID('dbo.agent_analytics_data_quality','U') IS NOT NULL DROP TABLE dbo.agent_analytics_data_quality;
IF OBJECT_ID('dbo.agent_analytics_alert_rules','U') IS NOT NULL DROP TABLE dbo.agent_analytics_alert_rules;
IF OBJECT_ID('dbo.agent_analytics_reports','U') IS NOT NULL DROP TABLE dbo.agent_analytics_reports;
IF OBJECT_ID('dbo.agent_analytics_saved_views','U') IS NOT NULL DROP TABLE dbo.agent_analytics_saved_views;
IF OBJECT_ID('dbo.agent_analytics_recommendations','U') IS NOT NULL DROP TABLE dbo.agent_analytics_recommendations;
IF OBJECT_ID('dbo.agent_analytics_leaderboards','U') IS NOT NULL DROP TABLE dbo.agent_analytics_leaderboards;
IF OBJECT_ID('dbo.agent_analytics_forecasts','U') IS NOT NULL DROP TABLE dbo.agent_analytics_forecasts;
IF OBJECT_ID('dbo.agent_analytics_anomalies','U') IS NOT NULL DROP TABLE dbo.agent_analytics_anomalies;
IF OBJECT_ID('dbo.agent_analytics_final_output_traceability','U') IS NOT NULL DROP TABLE dbo.agent_analytics_final_output_traceability;
IF OBJECT_ID('dbo.agent_analytics_business_impact','U') IS NOT NULL DROP TABLE dbo.agent_analytics_business_impact;
IF OBJECT_ID('dbo.agent_analytics_panels','U') IS NOT NULL DROP TABLE dbo.agent_analytics_panels;
IF OBJECT_ID('dbo.agent_analytics_agents','U') IS NOT NULL DROP TABLE dbo.agent_analytics_agents;
IF OBJECT_ID('dbo.agent_analytics_dimensions','U') IS NOT NULL DROP TABLE dbo.agent_analytics_dimensions;
IF OBJECT_ID('dbo.agent_analytics_coverage','U') IS NOT NULL DROP TABLE dbo.agent_analytics_coverage;

CREATE TABLE dbo.agent_analytics_coverage (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  stage_name NVARCHAR(120) NOT NULL,
  data_coverage DECIMAL(8,2) NOT NULL,
  metrics_available INT NOT NULL,
  missing_metrics INT NOT NULL,
  data_freshness NVARCHAR(80) NOT NULL,
  data_quality_score DECIMAL(8,2) NOT NULL,
  final_output_linkage DECIMAL(8,2) NOT NULL,
  business_outcome_linkage DECIMAL(8,2) NOT NULL,
  current_warnings NVARCHAR(300) NOT NULL,
  status NVARCHAR(80) NOT NULL
);

CREATE TABLE dbo.agent_analytics_dimensions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  dimension_name NVARCHAR(160) NOT NULL,
  current_score DECIMAL(8,2) NOT NULL,
  trend NVARCHAR(80) NOT NULL,
  target_score DECIMAL(8,2) NOT NULL,
  variance DECIMAL(8,2) NOT NULL,
  key_issue NVARCHAR(300) NOT NULL,
  key_opportunity NVARCHAR(300) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  open_analytics_action NVARCHAR(220) NOT NULL
);

CREATE TABLE dbo.agent_analytics_agents (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  agent_code NVARCHAR(80) NOT NULL,
  agent_name NVARCHAR(220) NOT NULL,
  domain NVARCHAR(140) NOT NULL,
  version_label NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  runs INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  failure_rate DECIMAL(8,2) NOT NULL,
  recovery_rate DECIMAL(8,2) NOT NULL,
  output_acceptance DECIMAL(8,2) NOT NULL,
  average_confidence DECIMAL(8,2) NOT NULL,
  quality_score DECIMAL(8,2) NOT NULL,
  average_duration_ms INT NOT NULL,
  p95_duration_ms INT NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  cost_per_accepted_output DECIMAL(18,4) NOT NULL,
  tool_success DECIMAL(8,2) NOT NULL,
  rag_success DECIMAL(8,2) NOT NULL,
  memory_hit_rate DECIMAL(8,2) NOT NULL,
  final_output_contribution DECIMAL(8,2) NOT NULL,
  human_escalations INT NOT NULL,
  trend NVARCHAR(80) NOT NULL,
  rank_position INT NOT NULL,
  total_cost DECIMAL(18,2) NOT NULL,
  revenue_contribution DECIMAL(18,2) NOT NULL,
  human_hours_avoided DECIMAL(18,2) NOT NULL,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.agent_analytics_panels (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  panel_name NVARCHAR(160) NOT NULL,
  metric_name NVARCHAR(160) NOT NULL,
  metric_value DECIMAL(18,4) NOT NULL,
  target_value DECIMAL(18,4) NOT NULL,
  variance DECIMAL(18,4) NOT NULL,
  trend NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  insight NVARCHAR(360) NOT NULL
);

CREATE TABLE dbo.agent_analytics_business_impact (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, impact_code NVARCHAR(80) NOT NULL, business_metric NVARCHAR(160) NOT NULL, baseline_value DECIMAL(18,4) NOT NULL, current_value DECIMAL(18,4) NOT NULL, impact_value DECIMAL(18,4) NOT NULL, attribution NVARCHAR(260) NOT NULL);
CREATE TABLE dbo.agent_analytics_final_output_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(260) NOT NULL, agent_code NVARCHAR(80) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, acceptance_score DECIMAL(8,2) NOT NULL, business_value DECIMAL(18,2) NOT NULL, traceability_state NVARCHAR(80) NOT NULL, final_output_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_analytics_anomalies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, anomaly_code NVARCHAR(80) NOT NULL, anomaly_type NVARCHAR(120) NOT NULL, affected_scope NVARCHAR(220) NOT NULL, severity NVARCHAR(80) NOT NULL, confidence DECIMAL(8,2) NOT NULL, detected_at DATETIME2 NOT NULL, status NVARCHAR(80) NOT NULL, recommendation NVARCHAR(360) NOT NULL);
CREATE TABLE dbo.agent_analytics_forecasts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, forecast_code NVARCHAR(80) NOT NULL, forecast_metric NVARCHAR(160) NOT NULL, horizon NVARCHAR(80) NOT NULL, forecast_value DECIMAL(18,4) NOT NULL, confidence DECIMAL(8,2) NOT NULL, trend NVARCHAR(80) NOT NULL, generated_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_analytics_leaderboards (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, leaderboard_name NVARCHAR(160) NOT NULL, rank_position INT NOT NULL, entity_name NVARCHAR(220) NOT NULL, score DECIMAL(8,2) NOT NULL, reason NVARCHAR(300) NOT NULL);
CREATE TABLE dbo.agent_analytics_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_code NVARCHAR(80) NOT NULL, title NVARCHAR(260) NOT NULL, domain NVARCHAR(160) NOT NULL, target_component NVARCHAR(220) NOT NULL, confidence DECIMAL(8,2) NOT NULL, risk NVARCHAR(80) NOT NULL, expected_impact NVARCHAR(360) NOT NULL, final_output_impact DECIMAL(8,2) NOT NULL, status NVARCHAR(100) NOT NULL, created_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_analytics_saved_views (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, view_name NVARCHAR(160) NOT NULL, owner_name NVARCHAR(160) NOT NULL, filters_summary NVARCHAR(500) NOT NULL, is_pinned BIT NOT NULL, updated_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_analytics_reports (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, report_name NVARCHAR(180) NOT NULL, report_type NVARCHAR(120) NOT NULL, schedule_state NVARCHAR(100) NOT NULL, last_generated_at DATETIME2 NULL, delivery_status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.agent_analytics_alert_rules (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, rule_name NVARCHAR(180) NOT NULL, metric_name NVARCHAR(160) NOT NULL, threshold_value DECIMAL(18,4) NOT NULL, severity NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_analytics_data_quality (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_name NVARCHAR(160) NOT NULL, quality_score DECIMAL(8,2) NOT NULL, freshness_minutes INT NOT NULL, missing_rows INT NOT NULL, warning_count INT NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_analytics_lineage (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, lineage_code NVARCHAR(80) NOT NULL, source_name NVARCHAR(160) NOT NULL, metric_name NVARCHAR(160) NOT NULL, transformation NVARCHAR(260) NOT NULL, downstream_dashboard NVARCHAR(180) NOT NULL, lineage_state NVARCHAR(80) NOT NULL);

EXEC('CREATE VIEW vw_agent_analytics_coverage AS SELECT * FROM agent_analytics_coverage');
EXEC('CREATE VIEW vw_agent_analytics_dimension_cards AS SELECT * FROM agent_analytics_dimensions');
EXEC('CREATE VIEW vw_agent_analytics_agents AS SELECT * FROM agent_analytics_agents');
EXEC('CREATE VIEW vw_agent_analytics_business_impact AS SELECT * FROM agent_analytics_business_impact');
EXEC('CREATE VIEW vw_agent_analytics_final_output_traceability AS SELECT * FROM agent_analytics_final_output_traceability');
EXEC('CREATE VIEW vw_agent_analytics_summary AS SELECT organization_id, CAST(AVG(health_percent) AS DECIMAL(8,2)) ai_workforce_health, CAST(98.70 AS DECIMAL(8,2)) autonomy_rate, CAST(AVG(success_rate) AS DECIMAL(8,2)) agent_success_rate, CAST(AVG(output_acceptance) AS DECIMAL(8,2)) final_output_acceptance, CAST(AVG(recovery_rate) AS DECIMAL(8,2)) recovery_success_rate, CAST(AVG(average_confidence) AS DECIMAL(8,2)) average_confidence, CAST(AVG(cost_per_accepted_output) AS DECIMAL(18,2)) cost_per_accepted_output, CAST(SUM(human_hours_avoided) AS DECIMAL(18,2)) human_hours_avoided, CAST(SUM(revenue_contribution) AS DECIMAL(18,2)) business_value_generated, CAST(SUM(human_escalations) AS INT) human_attention_required, COUNT(*) active_agents, CAST(124 AS INT) improvements_applied, MAX(updated_at) last_analytics_update FROM agent_analytics_agents GROUP BY organization_id');
