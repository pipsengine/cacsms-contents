IF OBJECT_ID('dbo.vw_ai_simulation_summary','V') IS NOT NULL DROP VIEW dbo.vw_ai_simulation_summary;
IF OBJECT_ID('dbo.vw_ai_simulations','V') IS NOT NULL DROP VIEW dbo.vw_ai_simulations;

IF OBJECT_ID('dbo.ai_business_forecasts','U') IS NOT NULL DROP TABLE dbo.ai_business_forecasts;
IF OBJECT_ID('dbo.ai_stress_tests','U') IS NOT NULL DROP TABLE dbo.ai_stress_tests;
IF OBJECT_ID('dbo.ai_load_tests','U') IS NOT NULL DROP TABLE dbo.ai_load_tests;
IF OBJECT_ID('dbo.ai_chaos_tests','U') IS NOT NULL DROP TABLE dbo.ai_chaos_tests;
IF OBJECT_ID('dbo.ai_failure_injection','U') IS NOT NULL DROP TABLE dbo.ai_failure_injection;
IF OBJECT_ID('dbo.ai_simulation_results','U') IS NOT NULL DROP TABLE dbo.ai_simulation_results;
IF OBJECT_ID('dbo.ai_predictions','U') IS NOT NULL DROP TABLE dbo.ai_predictions;
IF OBJECT_ID('dbo.ai_scenarios','U') IS NOT NULL DROP TABLE dbo.ai_scenarios;
IF OBJECT_ID('dbo.ai_digital_twins','U') IS NOT NULL DROP TABLE dbo.ai_digital_twins;
IF OBJECT_ID('dbo.ai_simulation_lifecycle','U') IS NOT NULL DROP TABLE dbo.ai_simulation_lifecycle;
IF OBJECT_ID('dbo.ai_simulation_types','U') IS NOT NULL DROP TABLE dbo.ai_simulation_types;
IF OBJECT_ID('dbo.ai_simulations','U') IS NOT NULL DROP TABLE dbo.ai_simulations;

CREATE TABLE dbo.ai_simulations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  simulation_code NVARCHAR(80) NOT NULL,
  scenario_name NVARCHAR(240) NOT NULL,
  simulation_type NVARCHAR(120) NOT NULL,
  environment_name NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  predicted_cost DECIMAL(18,2) NOT NULL,
  predicted_latency_ms INT NOT NULL,
  predicted_quality DECIMAL(8,2) NOT NULL,
  predicted_revenue DECIMAL(18,2) NOT NULL,
  deployment_ready BIT NOT NULL,
  business_outcome NVARCHAR(260) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_digital_twins (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, twin_code NVARCHAR(80) NOT NULL, twin_name NVARCHAR(220) NOT NULL, cloned_agents INT NOT NULL, cloned_memory_sources INT NOT NULL, cloned_knowledge_sources INT NOT NULL, cloned_workflows INT NOT NULL, cloned_queues INT NOT NULL, cloned_publishing_channels INT NOT NULL, sync_state NVARCHAR(80) NOT NULL, fidelity_percent DECIMAL(8,2) NOT NULL, created_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_scenarios (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, scenario_code NVARCHAR(80) NOT NULL, scenario_name NVARCHAR(240) NOT NULL, input_profile NVARCHAR(260) NOT NULL, traffic_multiplier DECIMAL(8,2) NOT NULL, budget_multiplier DECIMAL(8,2) NOT NULL, publishing_mode NVARCHAR(120) NOT NULL, scenario_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_predictions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, simulation_id UNIQUEIDENTIFIER NOT NULL, prediction_name NVARCHAR(180) NOT NULL, prediction_value DECIMAL(18,2) NOT NULL, accuracy_percent DECIMAL(8,2) NOT NULL, forecast_window NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_simulation_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, simulation_id UNIQUEIDENTIFIER NOT NULL, result_name NVARCHAR(180) NOT NULL, baseline_value DECIMAL(18,2) NOT NULL, simulated_value DECIMAL(18,2) NOT NULL, variance_percent DECIMAL(8,2) NOT NULL, result_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_failure_injection (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, failure_code NVARCHAR(80) NOT NULL, failure_type NVARCHAR(120) NOT NULL, target_component NVARCHAR(180) NOT NULL, recovery_path NVARCHAR(220) NOT NULL, recovered BIT NOT NULL, recovery_seconds INT NOT NULL);
CREATE TABLE dbo.ai_chaos_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, chaos_code NVARCHAR(80) NOT NULL, chaos_type NVARCHAR(120) NOT NULL, blast_radius NVARCHAR(120) NOT NULL, resilience_score DECIMAL(8,2) NOT NULL, test_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_load_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, load_code NVARCHAR(80) NOT NULL, load_type NVARCHAR(120) NOT NULL, concurrent_units INT NOT NULL, throughput_per_minute INT NOT NULL, p95_latency_ms INT NOT NULL, pass_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_stress_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, stress_code NVARCHAR(80) NOT NULL, stress_type NVARCHAR(120) NOT NULL, max_units INT NOT NULL, saturation_percent DECIMAL(8,2) NOT NULL, breaking_point NVARCHAR(180) NOT NULL, pass_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_business_forecasts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, forecast_code NVARCHAR(80) NOT NULL, forecast_name NVARCHAR(220) NOT NULL, predicted_views INT NOT NULL, predicted_revenue DECIMAL(18,2) NOT NULL, confidence DECIMAL(8,2) NOT NULL, deployment_confidence DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_simulation_types (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, type_name NVARCHAR(120) NOT NULL, active_runs INT NOT NULL, success_rate DECIMAL(8,2) NOT NULL, confidence DECIMAL(8,2) NOT NULL, last_run_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_simulation_lifecycle (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(120) NOT NULL, run_count INT NOT NULL, success_count INT NOT NULL, average_duration_ms INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL);

EXEC('CREATE VIEW vw_ai_simulations AS SELECT * FROM ai_simulations');
EXEC('CREATE VIEW vw_ai_simulation_summary AS SELECT organization_id, CAST((SELECT COUNT(*) FROM ai_simulations s WHERE s.organization_id=t.organization_id AND s.status=''Running'') AS INT) active_simulations, CAST((SELECT COUNT(*) FROM ai_simulations s WHERE s.organization_id=t.organization_id AND s.status=''Completed'') AS INT) completed_simulations, CAST((SELECT COUNT(*) FROM ai_digital_twins d WHERE d.organization_id=t.organization_id) AS INT) digital_twins, CAST(96.4 AS DECIMAL(8,2)) scenario_accuracy, CAST(95.8 AS DECIMAL(8,2)) prediction_accuracy, CAST(AVG(success_rate) AS DECIMAL(8,2)) simulation_success, CAST((SELECT COUNT(*) FROM ai_failure_injection f WHERE f.organization_id=t.organization_id AND f.recovered=1) AS INT) recovered_failures, CAST((SELECT AVG(confidence) FROM ai_business_forecasts b WHERE b.organization_id=t.organization_id) AS DECIMAL(8,2)) business_forecast_accuracy, CAST((SELECT AVG(deployment_confidence) FROM ai_business_forecasts b WHERE b.organization_id=t.organization_id) AS DECIMAL(8,2)) deployment_confidence, CAST(0 AS INT) human_attention_required, MAX(last_run_at) last_simulation_at FROM ai_simulation_types t GROUP BY organization_id');
