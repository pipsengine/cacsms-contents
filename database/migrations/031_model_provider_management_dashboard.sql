SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID('dbo.vw_ai_model_final_output_impact','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_final_output_impact;
IF OBJECT_ID('dbo.vw_ai_model_recommendations','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_recommendations;
IF OBJECT_ID('dbo.vw_ai_model_latency_analytics','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_latency_analytics;
IF OBJECT_ID('dbo.vw_ai_model_quality_analytics','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_quality_analytics;
IF OBJECT_ID('dbo.vw_ai_model_cost_analytics','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_cost_analytics;
IF OBJECT_ID('dbo.vw_ai_model_circuit_breakers','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_circuit_breakers;
IF OBJECT_ID('dbo.vw_ai_model_failovers','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_failovers;
IF OBJECT_ID('dbo.vw_ai_model_routing_decisions','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_routing_decisions;
IF OBJECT_ID('dbo.vw_ai_model_routes','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_routes;
IF OBJECT_ID('dbo.vw_ai_model_deprecations','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_deprecations;
IF OBJECT_ID('dbo.vw_ai_model_benchmarks','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_benchmarks;
IF OBJECT_ID('dbo.vw_ai_model_compatibility','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_compatibility;
IF OBJECT_ID('dbo.vw_ai_model_health','V') IS NOT NULL DROP VIEW dbo.vw_ai_model_health;
IF OBJECT_ID('dbo.vw_ai_models','V') IS NOT NULL DROP VIEW dbo.vw_ai_models;
IF OBJECT_ID('dbo.vw_ai_provider_costs','V') IS NOT NULL DROP VIEW dbo.vw_ai_provider_costs;
IF OBJECT_ID('dbo.vw_ai_provider_quotas','V') IS NOT NULL DROP VIEW dbo.vw_ai_provider_quotas;
IF OBJECT_ID('dbo.vw_ai_provider_credentials','V') IS NOT NULL DROP VIEW dbo.vw_ai_provider_credentials;
IF OBJECT_ID('dbo.vw_ai_provider_health','V') IS NOT NULL DROP VIEW dbo.vw_ai_provider_health;
IF OBJECT_ID('dbo.vw_ai_providers','V') IS NOT NULL DROP VIEW dbo.vw_ai_providers;
IF OBJECT_ID('dbo.vw_ai_provider_summary','V') IS NOT NULL DROP VIEW dbo.vw_ai_provider_summary;

IF OBJECT_ID('dbo.ai_model_provider_final_output_impact','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_final_output_impact;
IF OBJECT_ID('dbo.ai_model_provider_recommendations','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_recommendations;
IF OBJECT_ID('dbo.ai_model_provider_circuit_breakers','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_circuit_breakers;
IF OBJECT_ID('dbo.ai_model_provider_failovers','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_failovers;
IF OBJECT_ID('dbo.ai_model_provider_routing_decisions','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_routing_decisions;
IF OBJECT_ID('dbo.ai_model_provider_routing_policies','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_routing_policies;
IF OBJECT_ID('dbo.ai_model_provider_benchmarks','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_benchmarks;
IF OBJECT_ID('dbo.ai_model_operations','U') IS NOT NULL DROP TABLE dbo.ai_model_operations;
IF OBJECT_ID('dbo.ai_provider_operations','U') IS NOT NULL DROP TABLE dbo.ai_provider_operations;
IF OBJECT_ID('dbo.ai_model_provider_lifecycle','U') IS NOT NULL DROP TABLE dbo.ai_model_provider_lifecycle;
IF OBJECT_ID('dbo.ai_provider_category_metrics','U') IS NOT NULL DROP TABLE dbo.ai_provider_category_metrics;

CREATE TABLE dbo.ai_provider_category_metrics (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_name NVARCHAR(180) NOT NULL,
  provider_count INT NOT NULL,
  active_providers INT NOT NULL,
  healthy_providers INT NOT NULL,
  degraded_providers INT NOT NULL,
  available_models INT NOT NULL,
  requests_today INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  average_latency_seconds DECIMAL(8,2) NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  failover_count INT NOT NULL,
  quota_risk INT NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_lifecycle (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  lifecycle_type NVARCHAR(80) NOT NULL,
  stage_name NVARCHAR(180) NOT NULL,
  sequence_no INT NOT NULL,
  provider_count INT NOT NULL,
  model_count INT NOT NULL,
  request_count INT NOT NULL,
  failure_count INT NOT NULL,
  failover_count INT NOT NULL,
  average_duration NVARCHAR(80) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  current_blockers NVARCHAR(240) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_provider_operations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  provider_id UNIQUEIDENTIFIER NOT NULL,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  environment NVARCHAR(80) NOT NULL,
  region NVARCHAR(120) NOT NULL,
  endpoint NVARCHAR(500) NOT NULL,
  authentication_type NVARCHAR(120) NOT NULL,
  credential_status NVARCHAR(80) NOT NULL,
  models_available INT NOT NULL,
  active_routes INT NOT NULL,
  requests_today INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  failure_rate DECIMAL(8,2) NOT NULL,
  average_latency_seconds DECIMAL(8,2) NOT NULL,
  p95_latency_seconds DECIMAL(8,2) NOT NULL,
  spend_today DECIMAL(18,2) NOT NULL,
  monthly_spend DECIMAL(18,2) NOT NULL,
  quota_usage DECIMAL(8,2) NOT NULL,
  rate_limit_status NVARCHAR(80) NOT NULL,
  data_residency NVARCHAR(120) NOT NULL,
  last_health_check DATETIME2 NOT NULL,
  last_failure DATETIME2 NULL,
  owner NVARCHAR(160) NOT NULL,
  organization_scope NVARCHAR(120) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  credential_expiry_days INT NOT NULL,
  quota_warning BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_operations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  model_id UNIQUEIDENTIFIER NOT NULL,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  model_family NVARCHAR(120) NOT NULL,
  model_version NVARCHAR(80) NOT NULL,
  modality NVARCHAR(120) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  max_output_tokens INT NOT NULL,
  structured_output BIT NOT NULL,
  tool_calling BIT NOT NULL,
  streaming BIT NOT NULL,
  vision_support BIT NOT NULL,
  audio_support BIT NOT NULL,
  video_support BIT NOT NULL,
  embedding_support BIT NOT NULL,
  fine_tuning_support BIT NOT NULL,
  average_quality DECIMAL(8,2) NOT NULL,
  average_confidence DECIMAL(8,2) NOT NULL,
  average_latency_seconds DECIMAL(8,2) NOT NULL,
  p95_latency_seconds DECIMAL(8,2) NOT NULL,
  input_cost DECIMAL(18,6) NOT NULL,
  output_cost DECIMAL(18,6) NOT NULL,
  average_cost_per_run DECIMAL(18,4) NOT NULL,
  requests_today INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  failure_rate DECIMAL(8,2) NOT NULL,
  rate_limit_state NVARCHAR(80) NOT NULL,
  deprecation_date DATE NULL,
  assigned_agents INT NOT NULL,
  assigned_capabilities INT NOT NULL,
  active_routes INT NOT NULL,
  final_output_state NVARCHAR(80) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_benchmarks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  model_id UNIQUEIDENTIFIER NOT NULL,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  benchmark_name NVARCHAR(180) NOT NULL,
  quality_score DECIMAL(8,2) NOT NULL,
  latency_score DECIMAL(8,2) NOT NULL,
  cost_score DECIMAL(8,2) NOT NULL,
  reliability_score DECIMAL(8,2) NOT NULL,
  recommendation NVARCHAR(240) NOT NULL,
  completed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_routing_policies (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  policy_code NVARCHAR(120) NOT NULL,
  policy_name NVARCHAR(180) NOT NULL,
  scope_type NVARCHAR(80) NOT NULL,
  status NVARCHAR(60) NOT NULL,
  current_version INT NOT NULL,
  priority INT NOT NULL,
  routing_objective NVARCHAR(120) NOT NULL,
  quality_weight DECIMAL(8,2) NOT NULL,
  cost_weight DECIMAL(8,2) NOT NULL,
  latency_weight DECIMAL(8,2) NOT NULL,
  reliability_weight DECIMAL(8,2) NOT NULL,
  fallback_enabled BIT NOT NULL,
  environment NVARCHAR(80) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_routing_decisions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  decision_code NVARCHAR(120) NOT NULL,
  task_name NVARCHAR(180) NOT NULL,
  agent_name NVARCHAR(180) NOT NULL,
  capability NVARCHAR(180) NOT NULL,
  prompt_code NVARCHAR(120) NOT NULL,
  candidate_providers INT NOT NULL,
  candidate_models INT NOT NULL,
  selected_provider NVARCHAR(180) NOT NULL,
  selected_model NVARCHAR(180) NOT NULL,
  quality_estimate DECIMAL(8,2) NOT NULL,
  cost_estimate DECIMAL(18,4) NOT NULL,
  latency_estimate_seconds DECIMAL(8,2) NOT NULL,
  reliability_estimate DECIMAL(8,2) NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  risk DECIMAL(8,2) NOT NULL,
  final_output_impact NVARCHAR(80) NOT NULL,
  outcome NVARCHAR(80) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_failovers (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  from_provider NVARCHAR(180) NOT NULL,
  from_model NVARCHAR(180) NOT NULL,
  to_provider NVARCHAR(180) NOT NULL,
  to_model NVARCHAR(180) NOT NULL,
  failover_reason NVARCHAR(220) NOT NULL,
  failover_state NVARCHAR(80) NOT NULL,
  output_quality_preserved BIT NOT NULL,
  workflow_resumed BIT NOT NULL,
  duration_seconds INT NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_model_provider_circuit_breakers (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  route_name NVARCHAR(180) NOT NULL,
  provider_name NVARCHAR(180) NOT NULL,
  model_name NVARCHAR(180) NOT NULL,
  state NVARCHAR(80) NOT NULL,
  failure_threshold INT NOT NULL,
  failure_count INT NOT NULL,
  retry_at DATETIME2 NULL,
  fallback_route NVARCHAR(180) NOT NULL,
  final_output_impact NVARCHAR(80) NOT NULL
);

CREATE TABLE dbo.ai_model_provider_recommendations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  recommendation_type NVARCHAR(120) NOT NULL,
  title NVARCHAR(220) NOT NULL,
  description NVARCHAR(800) NOT NULL,
  impact NVARCHAR(80) NOT NULL,
  confidence_percent DECIMAL(8,2) NOT NULL,
  inside_guardrails BIT NOT NULL,
  status NVARCHAR(80) NOT NULL DEFAULT 'open'
);

CREATE TABLE dbo.ai_model_provider_final_output_impact (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  provider_name NVARCHAR(180) NOT NULL,
  model_name NVARCHAR(180) NOT NULL,
  workflow_name NVARCHAR(180) NOT NULL,
  output_name NVARCHAR(180) NOT NULL,
  validation_state NVARCHAR(80) NOT NULL,
  quality_state NVARCHAR(80) NOT NULL,
  publishing_state NVARCHAR(80) NOT NULL,
  business_result NVARCHAR(220) NOT NULL,
  readiness DECIMAL(8,2) NOT NULL
);

EXEC('CREATE VIEW vw_ai_provider_summary AS SELECT organization_id, CAST(12 AS INT) AS configured_providers, CAST(86 AS INT) AS available_models, CAST(96.20 AS DECIMAL(8,2)) AS healthy_routes, CAST(148 AS INT) AS active_model_routes, CAST(2 AS INT) AS degraded_providers, CAST(3 AS INT) AS rate_limited_models, CAST(4 AS INT) AS quota_risk, CAST(2.80 AS DECIMAL(8,2)) AS average_ai_latency_seconds, CAST(286.42 AS DECIMAL(18,2)) AS ai_spend_today, CAST(0 AS INT) AS human_attention_required, CAST(38 AS INT) AS automatic_failovers_today, CAST(74.18 AS DECIMAL(18,2)) AS cost_saved_by_routing, MAX(updated_at) AS last_routing_decision FROM ai_provider_operations GROUP BY organization_id');
EXEC('CREATE VIEW vw_ai_providers AS SELECT p.id, p.organization_id, p.code AS provider_code, COALESCE(p.name,p.provider_name) AS provider_name, p.provider_type, p.status, o.health_percent, o.environment, o.region, o.endpoint, o.authentication_type, o.credential_status, o.models_available, o.active_routes, o.requests_today, o.success_rate, o.failure_rate, o.average_latency_seconds, o.p95_latency_seconds, o.spend_today, o.monthly_spend, o.quota_usage, o.rate_limit_status, o.data_residency, o.last_health_check, o.last_failure, o.owner, o.organization_scope, o.credential_expiry_days, o.quota_warning, o.updated_at FROM ai_providers p JOIN ai_provider_operations o ON o.provider_id=p.id');
EXEC('CREATE VIEW vw_ai_provider_health AS SELECT * FROM vw_ai_providers');
EXEC('CREATE VIEW vw_ai_provider_credentials AS SELECT id, organization_id, provider_code, provider_name, authentication_type, credential_status, credential_expiry_days, last_health_check FROM vw_ai_providers');
EXEC('CREATE VIEW vw_ai_provider_quotas AS SELECT id, organization_id, provider_code, provider_name, quota_usage, quota_warning, rate_limit_status, requests_today FROM vw_ai_providers');
EXEC('CREATE VIEW vw_ai_provider_costs AS SELECT id, organization_id, provider_code, provider_name, spend_today, monthly_spend, average_latency_seconds, requests_today FROM vw_ai_providers');
EXEC('CREATE VIEW vw_ai_models AS SELECT m.id, p.organization_id, m.provider_id, p.code AS provider_code, COALESCE(p.name,p.provider_name) AS provider_name, m.code AS model_code, COALESCE(m.name,m.model_name) AS display_name, o.model_family, o.model_version, o.modality, m.status, o.health_percent, m.context_window, o.max_output_tokens, o.structured_output, o.tool_calling, o.streaming, o.vision_support, o.audio_support, o.video_support, o.embedding_support, o.fine_tuning_support, o.average_quality, o.average_confidence, o.average_latency_seconds, o.p95_latency_seconds, o.input_cost, o.output_cost, o.average_cost_per_run, o.requests_today, o.success_rate, o.failure_rate, o.rate_limit_state, o.deprecation_date, o.assigned_agents, o.assigned_capabilities, o.active_routes, o.final_output_state, o.updated_at FROM ai_models m JOIN ai_providers p ON p.id=m.provider_id JOIN ai_model_operations o ON o.model_id=m.id');
EXEC('CREATE VIEW vw_ai_model_health AS SELECT * FROM vw_ai_models');
EXEC('CREATE VIEW vw_ai_model_compatibility AS SELECT id, organization_id, model_code, display_name, provider_name, model_family, modality, structured_output, tool_calling, streaming, vision_support, audio_support, video_support, embedding_support, fine_tuning_support, assigned_agents, assigned_capabilities FROM vw_ai_models');
EXEC('CREATE VIEW vw_ai_model_benchmarks AS SELECT b.*, m.code AS model_code, COALESCE(m.name,m.model_name) AS display_name FROM ai_model_provider_benchmarks b JOIN ai_models m ON m.id=b.model_id');
EXEC('CREATE VIEW vw_ai_model_deprecations AS SELECT * FROM vw_ai_models WHERE deprecation_date IS NOT NULL OR status IN (''Deprecated'',''Retiring'')');
EXEC('CREATE VIEW vw_ai_model_routes AS SELECT * FROM vw_ai_models WHERE active_routes > 0');
EXEC('CREATE VIEW vw_ai_model_routing_decisions AS SELECT * FROM ai_model_provider_routing_decisions');
EXEC('CREATE VIEW vw_ai_model_failovers AS SELECT * FROM ai_model_provider_failovers');
EXEC('CREATE VIEW vw_ai_model_circuit_breakers AS SELECT * FROM ai_model_provider_circuit_breakers');
EXEC('CREATE VIEW vw_ai_model_cost_analytics AS SELECT organization_id, provider_name, model_code, display_name, average_cost_per_run, requests_today, input_cost, output_cost FROM vw_ai_models');
EXEC('CREATE VIEW vw_ai_model_quality_analytics AS SELECT organization_id, provider_name, model_code, display_name, average_quality, average_confidence, success_rate, failure_rate, final_output_state FROM vw_ai_models');
EXEC('CREATE VIEW vw_ai_model_latency_analytics AS SELECT organization_id, provider_name, model_code, display_name, average_latency_seconds, p95_latency_seconds, rate_limit_state FROM vw_ai_models');
EXEC('CREATE VIEW vw_ai_model_recommendations AS SELECT * FROM ai_model_provider_recommendations');
EXEC('CREATE VIEW vw_ai_model_final_output_impact AS SELECT * FROM ai_model_provider_final_output_impact');
