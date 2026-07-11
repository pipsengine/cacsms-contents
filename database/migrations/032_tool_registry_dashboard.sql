SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID('dbo.vw_ai_tool_final_output_impact','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_final_output_impact;
IF OBJECT_ID('dbo.vw_ai_tool_security','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_security;
IF OBJECT_ID('dbo.vw_ai_tool_recommendations','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_recommendations;
IF OBJECT_ID('dbo.vw_ai_tool_deprecations','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_deprecations;
IF OBJECT_ID('dbo.vw_ai_tool_performance','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_performance;
IF OBJECT_ID('dbo.vw_ai_tool_circuit_breakers','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_circuit_breakers;
IF OBJECT_ID('dbo.vw_ai_tool_fallbacks','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_fallbacks;
IF OBJECT_ID('dbo.vw_ai_tool_quotas','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_quotas;
IF OBJECT_ID('dbo.vw_ai_tool_rate_limits','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_rate_limits;
IF OBJECT_ID('dbo.vw_ai_tool_active_calls','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_active_calls;
IF OBJECT_ID('dbo.vw_ai_tool_workflow_usage','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_workflow_usage;
IF OBJECT_ID('dbo.vw_ai_tool_capability_mappings','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_capability_mappings;
IF OBJECT_ID('dbo.vw_ai_tool_agent_assignments','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_agent_assignments;
IF OBJECT_ID('dbo.vw_ai_tool_permissions','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_permissions;
IF OBJECT_ID('dbo.vw_ai_tool_credentials','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_credentials;
IF OBJECT_ID('dbo.vw_ai_tool_health','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_health;
IF OBJECT_ID('dbo.vw_ai_tools','V') IS NOT NULL DROP VIEW dbo.vw_ai_tools;
IF OBJECT_ID('dbo.vw_ai_tool_registry_summary','V') IS NOT NULL DROP VIEW dbo.vw_ai_tool_registry_summary;

IF OBJECT_ID('dbo.ai_tool_final_output_links','U') IS NOT NULL DROP TABLE dbo.ai_tool_final_output_links;
IF OBJECT_ID('dbo.ai_tool_security_policies','U') IS NOT NULL DROP TABLE dbo.ai_tool_security_policies;
IF OBJECT_ID('dbo.ai_tool_recommendations','U') IS NOT NULL DROP TABLE dbo.ai_tool_recommendations;
IF OBJECT_ID('dbo.ai_tool_deprecations','U') IS NOT NULL DROP TABLE dbo.ai_tool_deprecations;
IF OBJECT_ID('dbo.ai_tool_performance','U') IS NOT NULL DROP TABLE dbo.ai_tool_performance;
IF OBJECT_ID('dbo.ai_tool_circuit_breakers','U') IS NOT NULL DROP TABLE dbo.ai_tool_circuit_breakers;
IF OBJECT_ID('dbo.ai_tool_fallbacks','U') IS NOT NULL DROP TABLE dbo.ai_tool_fallbacks;
IF OBJECT_ID('dbo.ai_tool_quotas','U') IS NOT NULL DROP TABLE dbo.ai_tool_quotas;
IF OBJECT_ID('dbo.ai_tool_rate_limits','U') IS NOT NULL DROP TABLE dbo.ai_tool_rate_limits;
IF OBJECT_ID('dbo.ai_tool_calls','U') IS NOT NULL DROP TABLE dbo.ai_tool_calls;
IF OBJECT_ID('dbo.ai_tool_workflow_usage','U') IS NOT NULL DROP TABLE dbo.ai_tool_workflow_usage;
IF OBJECT_ID('dbo.ai_tool_capability_mappings','U') IS NOT NULL DROP TABLE dbo.ai_tool_capability_mappings;
IF OBJECT_ID('dbo.ai_tool_agent_assignments','U') IS NOT NULL DROP TABLE dbo.ai_tool_agent_assignments;
IF OBJECT_ID('dbo.ai_tool_permissions','U') IS NOT NULL DROP TABLE dbo.ai_tool_permissions;
IF OBJECT_ID('dbo.ai_tool_schemas','U') IS NOT NULL DROP TABLE dbo.ai_tool_schemas;
IF OBJECT_ID('dbo.ai_tool_versions','U') IS NOT NULL DROP TABLE dbo.ai_tool_versions;
IF OBJECT_ID('dbo.ai_tool_lifecycle','U') IS NOT NULL DROP TABLE dbo.ai_tool_lifecycle;
IF OBJECT_ID('dbo.ai_tools','U') IS NOT NULL DROP TABLE dbo.ai_tools;
IF OBJECT_ID('dbo.ai_tool_categories','U') IS NOT NULL DROP TABLE dbo.ai_tool_categories;

CREATE TABLE dbo.ai_tool_categories (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_name NVARCHAR(180) NOT NULL,
  tool_count INT NOT NULL,
  active_tools INT NOT NULL,
  healthy_tools INT NOT NULL,
  degraded_tools INT NOT NULL,
  tool_calls_today INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  average_latency_seconds DECIMAL(8,2) NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  assigned_agents INT NOT NULL,
  fallback_coverage DECIMAL(8,2) NOT NULL,
  final_output_contribution DECIMAL(8,2) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_tools (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_id UNIQUEIDENTIFIER NULL,
  tool_code NVARCHAR(120) NOT NULL,
  tool_name NVARCHAR(220) NOT NULL,
  description NVARCHAR(800) NOT NULL,
  tool_type NVARCHAR(120) NOT NULL,
  current_version NVARCHAR(40) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  scope_type NVARCHAR(120) NOT NULL,
  environment NVARCHAR(80) NOT NULL,
  authentication_type NVARCHAR(120) NOT NULL,
  credential_status NVARCHAR(80) NOT NULL,
  input_schema_version NVARCHAR(40) NOT NULL,
  output_schema_version NVARCHAR(40) NOT NULL,
  assigned_agents INT NOT NULL,
  assigned_capabilities INT NOT NULL,
  workflow_usage INT NOT NULL,
  rate_limit_status NVARCHAR(80) NOT NULL,
  quota_usage DECIMAL(8,2) NOT NULL,
  average_latency_seconds DECIMAL(8,2) NOT NULL,
  p95_latency_seconds DECIMAL(8,2) NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  failure_rate DECIMAL(8,2) NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  calls_today INT NOT NULL,
  retry_policy NVARCHAR(160) NOT NULL,
  fallback_tool NVARCHAR(180) NOT NULL,
  circuit_breaker_state NVARCHAR(80) NOT NULL,
  sensitive_access BIT NOT NULL,
  final_output_linked BIT NOT NULL,
  last_health_check DATETIME2 NOT NULL,
  owner NVARCHAR(160) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  human_attention_required BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_tool_lifecycle (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, lifecycle_type NVARCHAR(80) NOT NULL, stage_name NVARCHAR(180) NOT NULL, sequence_no INT NOT NULL, tool_count INT NOT NULL, invocation_count INT NOT NULL, failure_count INT NOT NULL, retry_count INT NOT NULL, failover_count INT NOT NULL, average_duration NVARCHAR(80) NOT NULL, health_percent DECIMAL(8,2) NOT NULL, current_blockers NVARCHAR(240) NOT NULL);
CREATE TABLE dbo.ai_tool_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, version_label NVARCHAR(40) NOT NULL, version_state NVARCHAR(80) NOT NULL, published_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), rollback_ready BIT NOT NULL DEFAULT 1);
CREATE TABLE dbo.ai_tool_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, schema_kind NVARCHAR(40) NOT NULL, schema_version NVARCHAR(40) NOT NULL, validation_state NVARCHAR(80) NOT NULL, drift_state NVARCHAR(80) NOT NULL, sensitive_fields INT NOT NULL, provenance_required BIT NOT NULL);
CREATE TABLE dbo.ai_tool_permissions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, permission_target NVARCHAR(180) NOT NULL, target_type NVARCHAR(80) NOT NULL, permission_state NVARCHAR(80) NOT NULL, governance_state NVARCHAR(80) NOT NULL, sensitive_scope BIT NOT NULL);
CREATE TABLE dbo.ai_tool_agent_assignments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, agent_name NVARCHAR(180) NOT NULL, assignment_state NVARCHAR(80) NOT NULL, compatibility_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_tool_capability_mappings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, capability_name NVARCHAR(180) NOT NULL, mapping_state NVARCHAR(80) NOT NULL, required_permission NVARCHAR(160) NOT NULL);
CREATE TABLE dbo.ai_tool_workflow_usage (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, workflow_name NVARCHAR(180) NOT NULL, usage_count INT NOT NULL, final_output_impact NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_tool_calls (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, tool_id UNIQUEIDENTIFIER NOT NULL, tool_version NVARCHAR(40) NOT NULL, agent_name NVARCHAR(180) NOT NULL, workflow_name NVARCHAR(180) NOT NULL, status NVARCHAR(80) NOT NULL, priority NVARCHAR(40) NOT NULL, queue_name NVARCHAR(120) NOT NULL, worker_id NVARCHAR(120) NOT NULL, started_at DATETIME2 NOT NULL, completed_at DATETIME2 NULL, duration_ms INT NOT NULL, retry_count INT NOT NULL, fallback_tool NVARCHAR(180) NULL, rate_limit_state NVARCHAR(80) NOT NULL, quota_state NVARCHAR(80) NOT NULL, actual_cost DECIMAL(18,4) NOT NULL, output_validation_status NVARCHAR(80) NOT NULL, recovery_state NVARCHAR(80) NOT NULL, final_output_impact NVARCHAR(80) NOT NULL, correlation_id NVARCHAR(120) NOT NULL, updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_tool_rate_limits (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, requests_per_minute INT NOT NULL, requests_per_day INT NOT NULL, current_usage DECIMAL(8,2) NOT NULL, reset_at DATETIME2 NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_tool_quotas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, quota_name NVARCHAR(160) NOT NULL, quota_usage DECIMAL(8,2) NOT NULL, remaining_capacity DECIMAL(8,2) NOT NULL, predicted_exhaustion_at DATETIME2 NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_tool_fallbacks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, fallback_tool NVARCHAR(180) NOT NULL, secondary_fallback NVARCHAR(180) NOT NULL, fallback_state NVARCHAR(80) NOT NULL, output_preservation DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_tool_circuit_breakers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, state NVARCHAR(80) NOT NULL, failure_threshold INT NOT NULL, failure_count INT NOT NULL, retry_at DATETIME2 NULL, fallback_action NVARCHAR(220) NOT NULL, final_output_impact NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_tool_performance (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, calls INT NOT NULL, success_rate DECIMAL(8,2) NOT NULL, failure_rate DECIMAL(8,2) NOT NULL, average_latency_seconds DECIMAL(8,2) NOT NULL, average_cost DECIMAL(18,4) NOT NULL, retry_rate DECIMAL(8,2) NOT NULL, failover_rate DECIMAL(8,2) NOT NULL, output_acceptance_rate DECIMAL(8,2) NOT NULL, final_output_contribution DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_tool_deprecations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, deprecation_state NVARCHAR(80) NOT NULL, replacement_tool NVARCHAR(180) NOT NULL, migration_state NVARCHAR(80) NOT NULL, deadline DATE NULL);
CREATE TABLE dbo.ai_tool_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, description NVARCHAR(800) NOT NULL, impact NVARCHAR(80) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, inside_guardrails BIT NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_tool_security_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, tool_id UNIQUEIDENTIFIER NOT NULL, data_classification NVARCHAR(120) NOT NULL, sensitive_data_support NVARCHAR(80) NOT NULL, encryption_state NVARCHAR(80) NOT NULL, redaction_state NVARCHAR(80) NOT NULL, residency_policy NVARCHAR(120) NOT NULL, audit_level NVARCHAR(80) NOT NULL, risk_score DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_tool_final_output_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, tool_id UNIQUEIDENTIFIER NOT NULL, workflow_name NVARCHAR(180) NOT NULL, output_name NVARCHAR(180) NOT NULL, validation_state NVARCHAR(80) NOT NULL, contribution_state NVARCHAR(80) NOT NULL, business_result NVARCHAR(220) NOT NULL, readiness DECIMAL(8,2) NOT NULL);

EXEC('CREATE VIEW vw_ai_tool_registry_summary AS SELECT organization_id, CAST(142 AS INT) registered_tools, CAST(126 AS INT) active_tools, CAST(118 AS INT) healthy_tools, CAST(6 AS INT) degraded_tools, CAST(2 AS INT) offline_tools, CAST(84624 AS INT) tool_calls_today, CAST(97.30 AS DECIMAL(8,2)) tool_success_rate, CAST(1.80 AS DECIMAL(8,2)) average_tool_latency_seconds, CAST(164.72 AS DECIMAL(18,2)) tool_cost_today, CAST(0 AS INT) human_attention_required, CAST(34 AS INT) automatic_tool_failovers, CAST(3 AS INT) tool_permission_warnings, MAX(updated_at) last_tool_event FROM ai_tools GROUP BY organization_id');
EXEC('CREATE VIEW vw_ai_tools AS SELECT t.*, c.category_name FROM ai_tools t LEFT JOIN ai_tool_categories c ON c.id=t.category_id');
EXEC('CREATE VIEW vw_ai_tool_health AS SELECT * FROM vw_ai_tools');
EXEC('CREATE VIEW vw_ai_tool_credentials AS SELECT id, organization_id, tool_code, tool_name, authentication_type, credential_status, last_health_check FROM vw_ai_tools');
EXEC('CREATE VIEW vw_ai_tool_permissions AS SELECT p.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_permissions p JOIN ai_tools t ON t.id=p.tool_id');
EXEC('CREATE VIEW vw_ai_tool_agent_assignments AS SELECT a.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_agent_assignments a JOIN ai_tools t ON t.id=a.tool_id');
EXEC('CREATE VIEW vw_ai_tool_capability_mappings AS SELECT m.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_capability_mappings m JOIN ai_tools t ON t.id=m.tool_id');
EXEC('CREATE VIEW vw_ai_tool_workflow_usage AS SELECT w.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_workflow_usage w JOIN ai_tools t ON t.id=w.tool_id');
EXEC('CREATE VIEW vw_ai_tool_active_calls AS SELECT c.*, t.tool_code, t.tool_name FROM ai_tool_calls c JOIN ai_tools t ON t.id=c.tool_id');
EXEC('CREATE VIEW vw_ai_tool_rate_limits AS SELECT r.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_rate_limits r JOIN ai_tools t ON t.id=r.tool_id');
EXEC('CREATE VIEW vw_ai_tool_quotas AS SELECT q.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_quotas q JOIN ai_tools t ON t.id=q.tool_id');
EXEC('CREATE VIEW vw_ai_tool_fallbacks AS SELECT f.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_fallbacks f JOIN ai_tools t ON t.id=f.tool_id');
EXEC('CREATE VIEW vw_ai_tool_circuit_breakers AS SELECT b.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_circuit_breakers b JOIN ai_tools t ON t.id=b.tool_id');
EXEC('CREATE VIEW vw_ai_tool_performance AS SELECT p.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_performance p JOIN ai_tools t ON t.id=p.tool_id');
EXEC('CREATE VIEW vw_ai_tool_deprecations AS SELECT d.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_deprecations d JOIN ai_tools t ON t.id=d.tool_id');
EXEC('CREATE VIEW vw_ai_tool_recommendations AS SELECT * FROM ai_tool_recommendations');
EXEC('CREATE VIEW vw_ai_tool_security AS SELECT s.*, t.organization_id, t.tool_code, t.tool_name FROM ai_tool_security_policies s JOIN ai_tools t ON t.id=s.tool_id');
EXEC('CREATE VIEW vw_ai_tool_final_output_impact AS SELECT f.*, t.tool_code, t.tool_name FROM ai_tool_final_output_links f JOIN ai_tools t ON t.id=f.tool_id');
