IF OBJECT_ID('dbo.vw_evaluation_dashboard_summary','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_dashboard_summary;
IF OBJECT_ID('dbo.vw_evaluation_components','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_components;
IF OBJECT_ID('dbo.vw_evaluation_benchmarks','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_benchmarks;
IF OBJECT_ID('dbo.vw_evaluation_quality_dimensions','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_quality_dimensions;
IF OBJECT_ID('dbo.vw_evaluation_leaderboards','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_leaderboards;
IF OBJECT_ID('dbo.vw_evaluation_final_output_scores','V') IS NOT NULL DROP VIEW dbo.vw_evaluation_final_output_scores;

IF OBJECT_ID('dbo.ai_final_output_scores','U') IS NOT NULL DROP TABLE dbo.ai_final_output_scores;
IF OBJECT_ID('dbo.ai_recommendations','U') IS NOT NULL DROP TABLE dbo.ai_recommendations;
IF OBJECT_ID('dbo.ai_leaderboards','U') IS NOT NULL DROP TABLE dbo.ai_leaderboards;
IF OBJECT_ID('dbo.ai_certifications','U') IS NOT NULL DROP TABLE dbo.ai_certifications;
IF OBJECT_ID('dbo.ai_canary_tests','U') IS NOT NULL DROP TABLE dbo.ai_canary_tests;
IF OBJECT_ID('dbo.ai_ab_tests','U') IS NOT NULL DROP TABLE dbo.ai_ab_tests;
IF OBJECT_ID('dbo.ai_golden_datasets','U') IS NOT NULL DROP TABLE dbo.ai_golden_datasets;
IF OBJECT_ID('dbo.ai_regression_tests','U') IS NOT NULL DROP TABLE dbo.ai_regression_tests;
IF OBJECT_ID('dbo.ai_security_tests','U') IS NOT NULL DROP TABLE dbo.ai_security_tests;
IF OBJECT_ID('dbo.ai_safety_tests','U') IS NOT NULL DROP TABLE dbo.ai_safety_tests;
IF OBJECT_ID('dbo.ai_quality_scores','U') IS NOT NULL DROP TABLE dbo.ai_quality_scores;
IF OBJECT_ID('dbo.ai_benchmarks','U') IS NOT NULL DROP TABLE dbo.ai_benchmarks;
IF OBJECT_ID('dbo.ai_evaluations','U') IS NOT NULL DROP TABLE dbo.ai_evaluations;
IF OBJECT_ID('dbo.ai_evaluation_components','U') IS NOT NULL DROP TABLE dbo.ai_evaluation_components;

CREATE TABLE dbo.ai_evaluation_components (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  component_code NVARCHAR(80) NOT NULL,
  component_name NVARCHAR(220) NOT NULL,
  component_type NVARCHAR(100) NOT NULL,
  version_label NVARCHAR(80) NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  current_score DECIMAL(8,2) NOT NULL,
  previous_score DECIMAL(8,2) NOT NULL,
  accuracy DECIMAL(8,2) NOT NULL,
  grounding DECIMAL(8,2) NOT NULL,
  safety DECIMAL(8,2) NOT NULL,
  latency_ms INT NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  reliability DECIMAL(8,2) NOT NULL,
  certification NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  production_readiness DECIMAL(8,2) NOT NULL,
  human_attention_required BIT NOT NULL DEFAULT 0,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_evaluations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  component_id UNIQUEIDENTIFIER NOT NULL,
  evaluation_code NVARCHAR(80) NOT NULL,
  evaluation_type NVARCHAR(100) NOT NULL,
  dataset_name NVARCHAR(180) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  quality_score DECIMAL(8,2) NOT NULL,
  safety_score DECIMAL(8,2) NOT NULL,
  accuracy DECIMAL(8,2) NOT NULL,
  grounding_score DECIMAL(8,2) NOT NULL,
  hallucination_rate DECIMAL(8,2) NOT NULL,
  latency_ms INT NOT NULL,
  actual_cost DECIMAL(18,4) NOT NULL,
  started_at DATETIME2 NOT NULL,
  completed_at DATETIME2 NULL
);

CREATE TABLE dbo.ai_benchmarks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  component_id UNIQUEIDENTIFIER NOT NULL,
  benchmark_code NVARCHAR(80) NOT NULL,
  benchmark_category NVARCHAR(120) NOT NULL,
  dataset_name NVARCHAR(180) NOT NULL,
  started_at DATETIME2 NOT NULL,
  completed_at DATETIME2 NULL,
  duration_ms INT NOT NULL,
  accuracy DECIMAL(8,2) NOT NULL,
  precision_score DECIMAL(8,2) NOT NULL,
  recall_score DECIMAL(8,2) NOT NULL,
  f1_score DECIMAL(8,2) NOT NULL,
  grounding_score DECIMAL(8,2) NOT NULL,
  latency_ms INT NOT NULL,
  actual_cost DECIMAL(18,4) NOT NULL,
  winner NVARCHAR(220) NOT NULL,
  status NVARCHAR(80) NOT NULL
);

CREATE TABLE dbo.ai_quality_scores (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  dimension NVARCHAR(120) NOT NULL,
  score DECIMAL(8,2) NOT NULL,
  previous_score DECIMAL(8,2) NOT NULL,
  threshold_score DECIMAL(8,2) NOT NULL,
  trend NVARCHAR(80) NOT NULL,
  source_count INT NOT NULL,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_safety_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, test_name NVARCHAR(160) NOT NULL, risk_type NVARCHAR(120) NOT NULL, status NVARCHAR(80) NOT NULL, pass_rate DECIMAL(8,2) NOT NULL, findings INT NOT NULL, last_run_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_security_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, test_name NVARCHAR(160) NOT NULL, control_area NVARCHAR(120) NOT NULL, status NVARCHAR(80) NOT NULL, pass_rate DECIMAL(8,2) NOT NULL, findings INT NOT NULL, last_run_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_regression_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, test_name NVARCHAR(160) NOT NULL, trigger_scope NVARCHAR(120) NOT NULL, status NVARCHAR(80) NOT NULL, regressions_found INT NOT NULL, baseline_score DECIMAL(8,2) NOT NULL, current_score DECIMAL(8,2) NOT NULL, last_run_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_golden_datasets (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, dataset_code NVARCHAR(80) NOT NULL, dataset_name NVARCHAR(180) NOT NULL, domain NVARCHAR(120) NOT NULL, sample_count INT NOT NULL, freshness_score DECIMAL(8,2) NOT NULL, coverage_score DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_ab_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, version_a NVARCHAR(80) NOT NULL, version_b NVARCHAR(80) NOT NULL, traffic_percent INT NOT NULL, winner NVARCHAR(80) NOT NULL, confidence DECIMAL(8,2) NOT NULL, acceptance DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_canary_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, canary_name NVARCHAR(160) NOT NULL, rollout_percent INT NOT NULL, status NVARCHAR(80) NOT NULL, rollback_ready BIT NOT NULL, confidence DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_certifications (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, certification_level NVARCHAR(80) NOT NULL, certification_state NVARCHAR(80) NOT NULL, certified_at DATETIME2 NULL, expires_at DATETIME2 NULL, evidence_count INT NOT NULL);
CREATE TABLE dbo.ai_leaderboards (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, category NVARCHAR(120) NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, rank_position INT NOT NULL, score DECIMAL(8,2) NOT NULL, reason NVARCHAR(300) NOT NULL);
CREATE TABLE dbo.ai_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, impact NVARCHAR(160) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_final_output_scores (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, component_id UNIQUEIDENTIFIER NOT NULL, business_objective NVARCHAR(220) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, output_name NVARCHAR(220) NOT NULL, publishing_channel NVARCHAR(160) NOT NULL, analytics_signal NVARCHAR(160) NOT NULL, learning_signal NVARCHAR(160) NOT NULL, business_result NVARCHAR(180) NOT NULL, final_score DECIMAL(8,2) NOT NULL, validation_state NVARCHAR(80) NOT NULL);

EXEC('CREATE VIEW vw_evaluation_components AS SELECT * FROM ai_evaluation_components');
EXEC('CREATE VIEW vw_evaluation_benchmarks AS SELECT b.*, c.component_code, c.component_name, c.component_type FROM ai_benchmarks b JOIN ai_evaluation_components c ON c.id=b.component_id');
EXEC('CREATE VIEW vw_evaluation_quality_dimensions AS SELECT * FROM ai_quality_scores');
EXEC('CREATE VIEW vw_evaluation_leaderboards AS SELECT l.*, c.component_code, c.component_name, c.component_type FROM ai_leaderboards l JOIN ai_evaluation_components c ON c.id=l.component_id');
EXEC('CREATE VIEW vw_evaluation_final_output_scores AS SELECT f.*, c.component_code, c.component_name, c.component_type FROM ai_final_output_scores f JOIN ai_evaluation_components c ON c.id=f.component_id');
EXEC('CREATE VIEW vw_evaluation_dashboard_summary AS SELECT organization_id, COUNT(*) total_components, CAST((SELECT COUNT(*) FROM ai_evaluations e WHERE e.organization_id=c.organization_id) AS INT) total_evaluations, CAST((SELECT COUNT(*) FROM ai_benchmarks b WHERE b.organization_id=c.organization_id) AS INT) benchmarks_executed, CAST(AVG(current_score) AS DECIMAL(8,2)) quality_score, CAST(AVG(safety) AS DECIMAL(8,2)) safety_score, CAST(AVG(accuracy) AS DECIMAL(8,2)) accuracy, CAST(AVG(grounding) AS DECIMAL(8,2)) grounding_score, CAST(AVG(100-accuracy) / 12 AS DECIMAL(8,2)) hallucination_rate, CAST(AVG(average_cost) AS DECIMAL(18,4)) average_cost, CAST(AVG(latency_ms) AS INT) average_latency_ms, CAST(AVG(production_readiness) AS DECIMAL(8,2)) production_readiness, SUM(CASE WHEN human_attention_required=1 THEN 1 ELSE 0 END) human_attention_required, MAX(updated_at) last_quality_update FROM ai_evaluation_components c GROUP BY organization_id');
