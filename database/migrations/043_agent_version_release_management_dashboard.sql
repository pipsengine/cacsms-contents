IF OBJECT_ID('dbo.vw_agent_version_release_summary','V') IS NOT NULL DROP VIEW dbo.vw_agent_version_release_summary;
IF OBJECT_ID('dbo.vw_agent_component_versions','V') IS NOT NULL DROP VIEW dbo.vw_agent_component_versions;
IF OBJECT_ID('dbo.vw_agent_releases','V') IS NOT NULL DROP VIEW dbo.vw_agent_releases;

IF OBJECT_ID('dbo.ai_release_autonomous_decisions','U') IS NOT NULL DROP TABLE dbo.ai_release_autonomous_decisions;
IF OBJECT_ID('dbo.ai_release_final_output_traceability','U') IS NOT NULL DROP TABLE dbo.ai_release_final_output_traceability;
IF OBJECT_ID('dbo.ai_release_analytics','U') IS NOT NULL DROP TABLE dbo.ai_release_analytics;
IF OBJECT_ID('dbo.ai_release_notes','U') IS NOT NULL DROP TABLE dbo.ai_release_notes;
IF OBJECT_ID('dbo.ai_release_recoveries','U') IS NOT NULL DROP TABLE dbo.ai_release_recoveries;
IF OBJECT_ID('dbo.ai_release_rollbacks','U') IS NOT NULL DROP TABLE dbo.ai_release_rollbacks;
IF OBJECT_ID('dbo.ai_release_regressions','U') IS NOT NULL DROP TABLE dbo.ai_release_regressions;
IF OBJECT_ID('dbo.ai_release_health','U') IS NOT NULL DROP TABLE dbo.ai_release_health;
IF OBJECT_ID('dbo.ai_release_approvals','U') IS NOT NULL DROP TABLE dbo.ai_release_approvals;
IF OBJECT_ID('dbo.ai_release_risk_assessments','U') IS NOT NULL DROP TABLE dbo.ai_release_risk_assessments;
IF OBJECT_ID('dbo.ai_release_validation_gates','U') IS NOT NULL DROP TABLE dbo.ai_release_validation_gates;
IF OBJECT_ID('dbo.ai_release_configuration_drift','U') IS NOT NULL DROP TABLE dbo.ai_release_configuration_drift;
IF OBJECT_ID('dbo.ai_release_database_migrations','U') IS NOT NULL DROP TABLE dbo.ai_release_database_migrations;
IF OBJECT_ID('dbo.ai_release_feature_flags','U') IS NOT NULL DROP TABLE dbo.ai_release_feature_flags;
IF OBJECT_ID('dbo.ai_release_deployments','U') IS NOT NULL DROP TABLE dbo.ai_release_deployments;
IF OBJECT_ID('dbo.ai_release_environment_promotions','U') IS NOT NULL DROP TABLE dbo.ai_release_environment_promotions;
IF OBJECT_ID('dbo.ai_release_environments','U') IS NOT NULL DROP TABLE dbo.ai_release_environments;
IF OBJECT_ID('dbo.ai_release_packages','U') IS NOT NULL DROP TABLE dbo.ai_release_packages;
IF OBJECT_ID('dbo.ai_release_dependency_impacts','U') IS NOT NULL DROP TABLE dbo.ai_release_dependency_impacts;
IF OBJECT_ID('dbo.ai_release_lifecycle','U') IS NOT NULL DROP TABLE dbo.ai_release_lifecycle;
IF OBJECT_ID('dbo.ai_release_version_domains','U') IS NOT NULL DROP TABLE dbo.ai_release_version_domains;
IF OBJECT_ID('dbo.ai_release_releases','U') IS NOT NULL DROP TABLE dbo.ai_release_releases;
IF OBJECT_ID('dbo.ai_release_component_versions','U') IS NOT NULL DROP TABLE dbo.ai_release_component_versions;

CREATE TABLE dbo.ai_release_component_versions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  component_code NVARCHAR(80) NOT NULL,
  component_name NVARCHAR(220) NOT NULL,
  component_type NVARCHAR(120) NOT NULL,
  current_version NVARCHAR(40) NOT NULL,
  published_version NVARCHAR(40) NOT NULL,
  production_version NVARCHAR(40) NOT NULL,
  latest_version NVARCHAR(40) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  environment_name NVARCHAR(80) NOT NULL,
  change_type NVARCHAR(80) NOT NULL,
  compatibility NVARCHAR(80) NOT NULL,
  dependency_count INT NOT NULL,
  validation_status NVARCHAR(80) NOT NULL,
  test_status NVARCHAR(80) NOT NULL,
  security_status NVARCHAR(80) NOT NULL,
  governance_status NVARCHAR(80) NOT NULL,
  rollback_ready BIT NOT NULL,
  version_drift BIT NOT NULL,
  released_by NVARCHAR(140) NOT NULL,
  release_code NVARCHAR(80) NOT NULL,
  owner_name NVARCHAR(140) NOT NULL,
  organization_name NVARCHAR(160) NOT NULL,
  final_output_impact NVARCHAR(120) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_release_releases (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  release_code NVARCHAR(80) NOT NULL,
  release_name NVARCHAR(220) NOT NULL,
  release_type NVARCHAR(120) NOT NULL,
  version_number NVARCHAR(40) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  target_environment NVARCHAR(80) NOT NULL,
  component_count INT NOT NULL,
  change_risk NVARCHAR(80) NOT NULL,
  dependency_status NVARCHAR(80) NOT NULL,
  validation_status NVARCHAR(80) NOT NULL,
  test_status NVARCHAR(80) NOT NULL,
  security_status NVARCHAR(80) NOT NULL,
  governance_status NVARCHAR(80) NOT NULL,
  migration_status NVARCHAR(80) NOT NULL,
  rollback_status NVARCHAR(80) NOT NULL,
  deployment_strategy NVARCHAR(80) NOT NULL,
  traffic_allocation INT NOT NULL,
  duration_minutes INT NOT NULL,
  release_health DECIMAL(8,2) NOT NULL,
  final_output_impact NVARCHAR(120) NOT NULL,
  owner_name NVARCHAR(140) NOT NULL,
  organization_name NVARCHAR(160) NOT NULL,
  start_time DATETIME2 NOT NULL,
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_release_version_domains (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, domain_name NVARCHAR(140) NOT NULL, total_versions INT NOT NULL, active_version NVARCHAR(40) NOT NULL, draft_versions INT NOT NULL, validating_versions INT NOT NULL, production_versions INT NOT NULL, deprecated_versions INT NOT NULL, drift_findings INT NOT NULL, rollback_coverage DECIMAL(8,2) NOT NULL, final_output_coverage DECIMAL(8,2) NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_release_lifecycle (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(160) NOT NULL, release_count INT NOT NULL, component_count INT NOT NULL, passed_count INT NOT NULL, failed_count INT NOT NULL, blocked_count INT NOT NULL, average_duration_minutes INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL, current_blockers NVARCHAR(220) NOT NULL);
CREATE TABLE dbo.ai_release_dependency_impacts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, impacted_component NVARCHAR(180) NOT NULL, upstream_count INT NOT NULL, downstream_count INT NOT NULL, compatibility_status NVARCHAR(80) NOT NULL, risk_level NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_packages (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, package_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, artifact_count INT NOT NULL, checksum_status NVARCHAR(80) NOT NULL, signature_status NVARCHAR(80) NOT NULL, build_status NVARCHAR(80) NOT NULL, package_size_mb DECIMAL(10,2) NOT NULL);
CREATE TABLE dbo.ai_release_environments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, environment_name NVARCHAR(80) NOT NULL, active_release NVARCHAR(80) NOT NULL, active_versions INT NOT NULL, drift_findings INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL, promotion_eligible BIT NOT NULL);
CREATE TABLE dbo.ai_release_environment_promotions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, from_environment NVARCHAR(80) NOT NULL, to_environment NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, validation_score DECIMAL(8,2) NOT NULL, promoted_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_release_deployments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, deployment_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, strategy NVARCHAR(80) NOT NULL, environment_name NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, traffic_allocation INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL, rollback_ready BIT NOT NULL);
CREATE TABLE dbo.ai_release_feature_flags (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, flag_code NVARCHAR(80) NOT NULL, flag_name NVARCHAR(160) NOT NULL, release_code NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, targeting_rule NVARCHAR(220) NOT NULL, exposure_percent INT NOT NULL);
CREATE TABLE dbo.ai_release_database_migrations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, migration_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, rollback_eligible BIT NOT NULL, order_no INT NOT NULL, validation_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_configuration_drift (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, drift_code NVARCHAR(80) NOT NULL, component_name NVARCHAR(180) NOT NULL, environment_name NVARCHAR(80) NOT NULL, drift_type NVARCHAR(120) NOT NULL, severity NVARCHAR(80) NOT NULL, resolution_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_validation_gates (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, gate_name NVARCHAR(160) NOT NULL, release_code NVARCHAR(80) NOT NULL, gate_status NVARCHAR(80) NOT NULL, pass_rate DECIMAL(8,2) NOT NULL, blocker_count INT NOT NULL);
CREATE TABLE dbo.ai_release_risk_assessments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, risk_level NVARCHAR(80) NOT NULL, primary_risk NVARCHAR(180) NOT NULL, mitigation_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_approvals (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, approval_type NVARCHAR(120) NOT NULL, status NVARCHAR(80) NOT NULL, approver_role NVARCHAR(120) NOT NULL, sla_minutes INT NOT NULL);
CREATE TABLE dbo.ai_release_health (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, availability DECIMAL(8,2) NOT NULL, quality DECIMAL(8,2) NOT NULL, cost_change DECIMAL(8,2) NOT NULL, latency_change DECIMAL(8,2) NOT NULL, reliability DECIMAL(8,2) NOT NULL, error_rate DECIMAL(8,2) NOT NULL, final_output_performance DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_release_regressions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, regression_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, detected_area NVARCHAR(140) NOT NULL, severity NVARCHAR(80) NOT NULL, rollback_recommended BIT NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_rollbacks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, rollback_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, previous_release NVARCHAR(80) NOT NULL, trigger_reason NVARCHAR(180) NOT NULL, status NVARCHAR(80) NOT NULL, automatic_rollback BIT NOT NULL, completed_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_release_recoveries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recovery_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, recovery_path NVARCHAR(220) NOT NULL, status NVARCHAR(80) NOT NULL, recovery_minutes INT NOT NULL);
CREATE TABLE dbo.ai_release_notes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, note_title NVARCHAR(180) NOT NULL, audience NVARCHAR(120) NOT NULL, generated_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_analytics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, metric_name NVARCHAR(160) NOT NULL, metric_value DECIMAL(18,2) NOT NULL, metric_unit NVARCHAR(40) NOT NULL, trend NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_final_output_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, release_code NVARCHAR(80) NOT NULL, business_outcome NVARCHAR(180) NOT NULL, quality_delta DECIMAL(8,2) NOT NULL, audience_delta DECIMAL(8,2) NOT NULL, revenue_delta DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_release_autonomous_decisions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_code NVARCHAR(80) NOT NULL, release_code NVARCHAR(80) NOT NULL, decision_name NVARCHAR(180) NOT NULL, decision_status NVARCHAR(80) NOT NULL, queue_name NVARCHAR(120) NOT NULL, event_name NVARCHAR(120) NOT NULL, decided_at DATETIME2 NOT NULL);

EXEC('CREATE VIEW vw_agent_component_versions AS SELECT * FROM ai_release_component_versions');
EXEC('CREATE VIEW vw_agent_releases AS SELECT * FROM ai_release_releases');
EXEC('CREATE VIEW vw_agent_version_release_summary AS SELECT organization_id,
CAST((SELECT COUNT(*) FROM ai_release_component_versions c WHERE c.organization_id=o.organization_id) AS INT) versioned_components,
CAST(8 AS INT) active_releases,
CAST(14 AS INT) ready_for_promotion,
CAST(5 AS INT) releases_awaiting_approval,
CAST(98.6 AS DECIMAL(8,2)) production_deployment_success,
CAST((SELECT AVG(CASE WHEN c.rollback_ready=1 THEN 100.0 ELSE 0.0 END) FROM ai_release_component_versions c WHERE c.organization_id=o.organization_id) AS DECIMAL(8,2)) rollback_readiness,
CAST((SELECT COUNT(*) FROM ai_release_rollbacks b WHERE b.organization_id=o.organization_id) AS INT) releases_rolled_back,
CAST(12 AS INT) average_deployment_minutes,
CAST(48 AS INT) average_deployment_seconds,
CAST(96.8 AS DECIMAL(8,2)) final_output_release_readiness,
CAST(0 AS INT) human_attention_required,
CAST((SELECT COUNT(*) FROM ai_release_component_versions c WHERE c.organization_id=o.organization_id AND c.version_drift=1) AS INT) components_with_version_drift,
CAST(4 AS INT) releases_blocked_by_dependencies,
MAX(updated_at) last_release_event_at
FROM ai_release_component_versions o GROUP BY organization_id');
