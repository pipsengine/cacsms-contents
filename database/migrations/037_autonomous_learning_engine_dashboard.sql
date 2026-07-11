IF OBJECT_ID('dbo.vw_autonomous_learning_summary','V') IS NOT NULL DROP VIEW dbo.vw_autonomous_learning_summary;
IF OBJECT_ID('dbo.vw_learning_signals','V') IS NOT NULL DROP VIEW dbo.vw_learning_signals;
IF OBJECT_ID('dbo.vw_learning_insights','V') IS NOT NULL DROP VIEW dbo.vw_learning_insights;
IF OBJECT_ID('dbo.vw_learning_recommendations','V') IS NOT NULL DROP VIEW dbo.vw_learning_recommendations;
IF OBJECT_ID('dbo.vw_learning_experiments','V') IS NOT NULL DROP VIEW dbo.vw_learning_experiments;
IF OBJECT_ID('dbo.vw_learning_improvements','V') IS NOT NULL DROP VIEW dbo.vw_learning_improvements;
IF OBJECT_ID('dbo.vw_learning_rollbacks','V') IS NOT NULL DROP VIEW dbo.vw_learning_rollbacks;
IF OBJECT_ID('dbo.vw_learning_drift','V') IS NOT NULL DROP VIEW dbo.vw_learning_drift;
IF OBJECT_ID('dbo.vw_learning_business_impact','V') IS NOT NULL DROP VIEW dbo.vw_learning_business_impact;
IF OBJECT_ID('dbo.vw_learning_final_output_traceability','V') IS NOT NULL DROP VIEW dbo.vw_learning_final_output_traceability;

IF OBJECT_ID('dbo.learning_final_output_traceability','U') IS NOT NULL DROP TABLE dbo.learning_final_output_traceability;
IF OBJECT_ID('dbo.learning_business_impact','U') IS NOT NULL DROP TABLE dbo.learning_business_impact;
IF OBJECT_ID('dbo.learning_drift_events','U') IS NOT NULL DROP TABLE dbo.learning_drift_events;
IF OBJECT_ID('dbo.learning_models','U') IS NOT NULL DROP TABLE dbo.learning_models;
IF OBJECT_ID('dbo.learning_memory','U') IS NOT NULL DROP TABLE dbo.learning_memory;
IF OBJECT_ID('dbo.learning_rollbacks','U') IS NOT NULL DROP TABLE dbo.learning_rollbacks;
IF OBJECT_ID('dbo.learning_improvements','U') IS NOT NULL DROP TABLE dbo.learning_improvements;
IF OBJECT_ID('dbo.learning_experiments','U') IS NOT NULL DROP TABLE dbo.learning_experiments;
IF OBJECT_ID('dbo.learning_root_causes','U') IS NOT NULL DROP TABLE dbo.learning_root_causes;
IF OBJECT_ID('dbo.learning_patterns','U') IS NOT NULL DROP TABLE dbo.learning_patterns;
IF OBJECT_ID('dbo.learning_source_matrix','U') IS NOT NULL DROP TABLE dbo.learning_source_matrix;
IF OBJECT_ID('dbo.learning_recommendations','U') IS NOT NULL DROP TABLE dbo.learning_recommendations;
IF OBJECT_ID('dbo.learning_insights','U') IS NOT NULL DROP TABLE dbo.learning_insights;
IF OBJECT_ID('dbo.learning_signals','U') IS NOT NULL DROP TABLE dbo.learning_signals;
IF OBJECT_ID('dbo.learning_domains','U') IS NOT NULL DROP TABLE dbo.learning_domains;

CREATE TABLE dbo.learning_domains (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  domain_name NVARCHAR(160) NOT NULL,
  signals_processed BIGINT NOT NULL,
  insights_found INT NOT NULL,
  recommendations INT NOT NULL,
  improvements_applied INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  quality_impact DECIMAL(8,2) NOT NULL,
  cost_impact DECIMAL(8,2) NOT NULL,
  latency_impact DECIMAL(8,2) NOT NULL,
  reliability_impact DECIMAL(8,2) NOT NULL,
  final_output_impact DECIMAL(8,2) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL
);

CREATE TABLE dbo.learning_signals (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  signal_code NVARCHAR(80) NOT NULL,
  signal_type NVARCHAR(100) NOT NULL,
  source_component NVARCHAR(220) NOT NULL,
  source_type NVARCHAR(120) NOT NULL,
  event_name NVARCHAR(180) NOT NULL,
  outcome NVARCHAR(120) NOT NULL,
  metric NVARCHAR(120) NOT NULL,
  previous_value DECIMAL(18,4) NOT NULL,
  current_value DECIMAL(18,4) NOT NULL,
  change_value DECIMAL(18,4) NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  severity NVARCHAR(80) NOT NULL,
  business_impact NVARCHAR(180) NOT NULL,
  final_output_impact NVARCHAR(180) NOT NULL,
  correlation_id NVARCHAR(120) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  brand_name NVARCHAR(180) NOT NULL,
  workflow_name NVARCHAR(220) NOT NULL,
  agent_name NVARCHAR(180) NOT NULL,
  occurred_at DATETIME2 NOT NULL,
  processing_status NVARCHAR(80) NOT NULL
);

CREATE TABLE dbo.learning_insights (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  insight_code NVARCHAR(80) NOT NULL,
  insight_title NVARCHAR(260) NOT NULL,
  description NVARCHAR(800) NOT NULL,
  domain NVARCHAR(160) NOT NULL,
  pattern_type NVARCHAR(160) NOT NULL,
  affected_component NVARCHAR(220) NOT NULL,
  evidence_count INT NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  severity NVARCHAR(80) NOT NULL,
  root_cause NVARCHAR(360) NOT NULL,
  expected_opportunity NVARCHAR(360) NOT NULL,
  quality_impact DECIMAL(8,2) NOT NULL,
  cost_impact DECIMAL(8,2) NOT NULL,
  latency_impact DECIMAL(8,2) NOT NULL,
  reliability_impact DECIMAL(8,2) NOT NULL,
  final_output_impact DECIMAL(8,2) NOT NULL,
  recommendation_count INT NOT NULL,
  status NVARCHAR(100) NOT NULL,
  organization_scope NVARCHAR(160) NOT NULL,
  detected_at DATETIME2 NOT NULL,
  updated_at DATETIME2 NOT NULL
);

CREATE TABLE dbo.learning_recommendations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  insight_id UNIQUEIDENTIFIER NULL,
  recommendation_code NVARCHAR(80) NOT NULL,
  recommendation_title NVARCHAR(260) NOT NULL,
  description NVARCHAR(800) NOT NULL,
  domain NVARCHAR(160) NOT NULL,
  target_component NVARCHAR(220) NOT NULL,
  current_configuration NVARCHAR(600) NOT NULL,
  proposed_configuration NVARCHAR(600) NOT NULL,
  evidence_count INT NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  risk NVARCHAR(80) NOT NULL,
  quality_impact DECIMAL(8,2) NOT NULL,
  cost_impact DECIMAL(8,2) NOT NULL,
  latency_impact DECIMAL(8,2) NOT NULL,
  reliability_impact DECIMAL(8,2) NOT NULL,
  final_output_impact DECIMAL(8,2) NOT NULL,
  auto_apply_eligible BIT NOT NULL,
  governance_required BIT NOT NULL,
  experiment_required BIT NOT NULL,
  status NVARCHAR(100) NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  created_at DATETIME2 NOT NULL
);

CREATE TABLE dbo.learning_source_matrix (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  source_name NVARCHAR(120) NOT NULL,
  success_signals NVARCHAR(80) NOT NULL,
  failure_signals NVARCHAR(80) NOT NULL,
  quality_signals NVARCHAR(80) NOT NULL,
  cost_signals NVARCHAR(80) NOT NULL,
  latency_signals NVARCHAR(80) NOT NULL,
  reliability_signals NVARCHAR(80) NOT NULL,
  security_signals NVARCHAR(80) NOT NULL,
  engagement_signals NVARCHAR(80) NOT NULL,
  revenue_signals NVARCHAR(80) NOT NULL,
  final_output_signals NVARCHAR(80) NOT NULL,
  blind_spot BIT NOT NULL
);

CREATE TABLE dbo.learning_patterns (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pattern_name NVARCHAR(220) NOT NULL, pattern_type NVARCHAR(160) NOT NULL, frequency_count INT NOT NULL, confidence DECIMAL(8,2) NOT NULL, trend NVARCHAR(80) NOT NULL, affected_scope NVARCHAR(220) NOT NULL, opportunity NVARCHAR(360) NOT NULL, risk NVARCHAR(220) NOT NULL, recommendation NVARCHAR(360) NOT NULL);
CREATE TABLE dbo.learning_root_causes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, insight_id UNIQUEIDENTIFIER NULL, observed_outcome NVARCHAR(260) NOT NULL, contributing_events NVARCHAR(500) NOT NULL, dependencies NVARCHAR(500) NOT NULL, candidate_cause NVARCHAR(360) NOT NULL, evidence NVARCHAR(500) NOT NULL, correlation DECIMAL(8,2) NOT NULL, causal_confidence DECIMAL(8,2) NOT NULL, alternative_explanation NVARCHAR(360) NOT NULL, recommended_action NVARCHAR(360) NOT NULL);
CREATE TABLE dbo.learning_experiments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_id UNIQUEIDENTIFIER NULL, experiment_code NVARCHAR(80) NOT NULL, experiment_name NVARCHAR(220) NOT NULL, variants NVARCHAR(220) NOT NULL, traffic_allocation NVARCHAR(120) NOT NULL, primary_metric NVARCHAR(120) NOT NULL, winner NVARCHAR(120) NOT NULL, confidence DECIMAL(8,2) NOT NULL, rollback_ready BIT NOT NULL, status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.learning_improvements (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_id UNIQUEIDENTIFIER NULL, improvement_code NVARCHAR(80) NOT NULL, improvement_name NVARCHAR(260) NOT NULL, target_component NVARCHAR(220) NOT NULL, rollout_percent INT NOT NULL, monitoring_state NVARCHAR(100) NOT NULL, actual_quality_impact DECIMAL(8,2) NOT NULL, actual_cost_impact DECIMAL(8,2) NOT NULL, actual_latency_impact DECIMAL(8,2) NOT NULL, actual_final_output_impact DECIMAL(8,2) NOT NULL, retained_or_rolled_back NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.learning_rollbacks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, improvement_id UNIQUEIDENTIFIER NULL, rollback_code NVARCHAR(80) NOT NULL, reason NVARCHAR(360) NOT NULL, previous_version NVARCHAR(80) NOT NULL, restored_at DATETIME2 NOT NULL, incident_recorded BIT NOT NULL, status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.learning_memory (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, memory_code NVARCHAR(80) NOT NULL, memory_type NVARCHAR(120) NOT NULL, domain NVARCHAR(160) NOT NULL, learned_pattern NVARCHAR(360) NOT NULL, confidence DECIMAL(8,2) NOT NULL, usage_count INT NOT NULL, last_used_at DATETIME2 NOT NULL);
CREATE TABLE dbo.learning_models (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, model_code NVARCHAR(80) NOT NULL, model_name NVARCHAR(220) NOT NULL, model_type NVARCHAR(120) NOT NULL, training_status NVARCHAR(100) NOT NULL, accuracy DECIMAL(8,2) NOT NULL, drift_score DECIMAL(8,2) NOT NULL, last_trained_at DATETIME2 NOT NULL);
CREATE TABLE dbo.learning_drift_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, drift_code NVARCHAR(80) NOT NULL, model_name NVARCHAR(220) NOT NULL, drift_type NVARCHAR(120) NOT NULL, severity NVARCHAR(80) NOT NULL, detected_at DATETIME2 NOT NULL, resolved_at DATETIME2 NULL, status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.learning_business_impact (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, domain NVARCHAR(160) NOT NULL, kpi_name NVARCHAR(160) NOT NULL, baseline_value DECIMAL(18,4) NOT NULL, current_value DECIMAL(18,4) NOT NULL, impact_percent DECIMAL(8,2) NOT NULL, attribution NVARCHAR(220) NOT NULL);
CREATE TABLE dbo.learning_final_output_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(260) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, improvement_code NVARCHAR(80) NOT NULL, quality_delta DECIMAL(8,2) NOT NULL, engagement_delta DECIMAL(8,2) NOT NULL, revenue_delta DECIMAL(8,2) NOT NULL, traceability_state NVARCHAR(80) NOT NULL, final_output_impact NVARCHAR(260) NOT NULL);

EXEC('CREATE VIEW vw_learning_signals AS SELECT * FROM learning_signals');
EXEC('CREATE VIEW vw_learning_insights AS SELECT * FROM learning_insights');
EXEC('CREATE VIEW vw_learning_recommendations AS SELECT r.*, i.insight_code, i.insight_title FROM learning_recommendations r LEFT JOIN learning_insights i ON i.id=r.insight_id');
EXEC('CREATE VIEW vw_learning_experiments AS SELECT * FROM learning_experiments');
EXEC('CREATE VIEW vw_learning_improvements AS SELECT * FROM learning_improvements');
EXEC('CREATE VIEW vw_learning_rollbacks AS SELECT * FROM learning_rollbacks');
EXEC('CREATE VIEW vw_learning_drift AS SELECT * FROM learning_drift_events');
EXEC('CREATE VIEW vw_learning_business_impact AS SELECT * FROM learning_business_impact');
EXEC('CREATE VIEW vw_learning_final_output_traceability AS SELECT * FROM learning_final_output_traceability');
EXEC('CREATE VIEW vw_autonomous_learning_summary AS SELECT organization_id, CAST(SUM(signals_processed) AS BIGINT) learning_signals_processed, CAST((SELECT COUNT(*) FROM learning_insights i WHERE i.organization_id=d.organization_id AND i.status IN (''New'',''Validated'',''Recommendation Generated'')) AS INT) new_insights, CAST((SELECT COUNT(*) FROM learning_recommendations r WHERE r.organization_id=d.organization_id AND r.status IN (''Ready'',''Approved'',''Governance Pending'')) AS INT) recommendations_ready, CAST((SELECT COUNT(*) FROM learning_improvements im WHERE im.organization_id=d.organization_id) AS INT) improvements_applied, CAST(AVG(success_rate) AS DECIMAL(8,2)) improvement_success_rate, CAST(AVG(quality_impact) AS DECIMAL(8,2)) quality_improvement, CAST(AVG(cost_impact) AS DECIMAL(8,2)) cost_reduction, CAST(AVG(latency_impact) AS DECIMAL(8,2)) latency_reduction, CAST(AVG(final_output_impact) AS DECIMAL(8,2)) final_output_improvement, CAST(0 AS INT) human_attention_required, CAST((SELECT COUNT(*) FROM learning_rollbacks rb WHERE rb.organization_id=d.organization_id) AS INT) improvements_rolled_back, CAST((SELECT COUNT(*) FROM learning_experiments e WHERE e.organization_id=d.organization_id AND e.status IN (''Running'',''Scheduled'')) AS INT) active_experiments, MAX(health_percent) last_learning_health FROM learning_domains d GROUP BY organization_id');
