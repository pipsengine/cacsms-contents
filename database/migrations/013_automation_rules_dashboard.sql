SET NOCOUNT ON;

IF OBJECT_ID('automation_rules', 'U') IS NULL
BEGIN
  CREATE TABLE automation_rules (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    rule_code NVARCHAR(120) NOT NULL,
    rule_name NVARCHAR(220) NOT NULL,
    description NVARCHAR(1000) NULL,
    category NVARCHAR(120) NOT NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'draft',
    current_version INT NOT NULL DEFAULT 1,
    published_version INT NULL,
    priority NVARCHAR(40) NOT NULL DEFAULT 'medium',
    execution_mode NVARCHAR(80) NOT NULL DEFAULT 'fully_autonomous',
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    owner_id NVARCHAR(180) NULL,
    recovery_enabled BIT NOT NULL DEFAULT 1,
    human_escalation_enabled BIT NOT NULL DEFAULT 1,
    effective_at DATETIME2 NULL,
    expires_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_automation_rules_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );
END;

IF OBJECT_ID('automation_rule_versions', 'U') IS NULL
  CREATE TABLE automation_rule_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, version_number INT NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'draft', change_summary NVARCHAR(500) NULL, validation_status NVARCHAR(80) NULL, simulation_status NVARCHAR(80) NULL, published_environment NVARCHAR(80) NULL, execution_count INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, rollback_eligible BIT NOT NULL DEFAULT 0, created_by NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_scopes', 'U') IS NULL
  CREATE TABLE automation_rule_scopes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, scope_type NVARCHAR(80) NOT NULL, scope_value NVARCHAR(220) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_triggers', 'U') IS NULL
  CREATE TABLE automation_rule_triggers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, trigger_type NVARCHAR(80) NOT NULL, trigger_source NVARCHAR(180) NOT NULL, event_name NVARCHAR(180) NULL, schedule_expression NVARCHAR(120) NULL, webhook_url NVARCHAR(500) NULL, data_source NVARCHAR(180) NULL, scope NVARCHAR(180) NULL, debounce_seconds INT NOT NULL DEFAULT 0, throttle_seconds INT NOT NULL DEFAULT 0, idempotency_key NVARCHAR(240) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_condition_groups', 'U') IS NULL
  CREATE TABLE automation_rule_condition_groups (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, parent_group_id UNIQUEIDENTIFIER NULL, boolean_operator NVARCHAR(20) NOT NULL DEFAULT 'AND', group_order INT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_conditions', 'U') IS NULL
  CREATE TABLE automation_rule_conditions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, condition_group_id UNIQUEIDENTIFIER NOT NULL, data_source NVARCHAR(180) NOT NULL, field_path NVARCHAR(240) NOT NULL, operator NVARCHAR(80) NOT NULL, compare_value NVARCHAR(500) NULL, time_window NVARCHAR(120) NULL, fallback_value NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_actions', 'U') IS NULL
  CREATE TABLE automation_rule_actions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, action_name NVARCHAR(180) NOT NULL, action_type NVARCHAR(120) NOT NULL, execution_order INT NOT NULL DEFAULT 1, execution_mode NVARCHAR(80) NOT NULL DEFAULT 'sequential', retry_policy NVARCHAR(500) NULL, timeout_seconds INT NOT NULL DEFAULT 120, worker_pool NVARCHAR(120) NULL, queue_name NVARCHAR(120) NULL, required_permission NVARCHAR(160) NULL, output_mapping NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_action_steps', 'U') IS NULL
  CREATE TABLE automation_rule_action_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_action_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, step_order INT NOT NULL DEFAULT 1, config_json NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_recovery_actions', 'U') IS NULL
  CREATE TABLE automation_rule_recovery_actions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, recovery_policy NVARCHAR(180) NOT NULL, retry_strategy NVARCHAR(180) NULL, compensation_action NVARCHAR(220) NULL, fallback_action NVARCHAR(220) NULL, incident_creation BIT NOT NULL DEFAULT 0, escalation_rule NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_guardrails', 'U') IS NULL
  CREATE TABLE automation_rule_guardrails (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, cost_limit DECIMAL(18,4) NOT NULL DEFAULT 0, risk_threshold DECIMAL(8,2) NOT NULL DEFAULT 80, confidence_threshold DECIMAL(8,2) NOT NULL DEFAULT 70, rate_limit_per_minute INT NOT NULL DEFAULT 60, concurrency_limit INT NOT NULL DEFAULT 5, security_boundary NVARCHAR(180) NULL, data_classification NVARCHAR(80) NULL, human_escalation_boundary NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_schedules', 'U') IS NULL
  CREATE TABLE automation_rule_schedules (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, cron_expression NVARCHAR(120) NOT NULL, timezone NVARCHAR(80) NOT NULL DEFAULT 'Africa/Lagos', next_run_at DATETIME2 NULL, last_run_at DATETIME2 NULL, is_enabled BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_executions', 'U') IS NULL
  CREATE TABLE automation_rule_executions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, organization_id UNIQUEIDENTIFIER NOT NULL, trigger_event NVARCHAR(180) NOT NULL, matched BIT NOT NULL DEFAULT 0, conditions_passed BIT NOT NULL DEFAULT 0, decision NVARCHAR(220) NULL, actions_executed INT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'evaluating', duration_ms INT NOT NULL DEFAULT 0, cost DECIMAL(18,6) NOT NULL DEFAULT 0, recovery_used BIT NOT NULL DEFAULT 0, conflict_detected BIT NOT NULL DEFAULT 0, workflow_reference NVARCHAR(180) NULL, reference_id NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_execution_steps', 'U') IS NULL
  CREATE TABLE automation_rule_execution_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_execution_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, status NVARCHAR(40) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, evidence NVARCHAR(MAX) NULL, confidence_percent DECIMAL(8,2) NULL, risk_level NVARCHAR(80) NULL, component NVARCHAR(120) NULL, audit_reference NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_decisions', 'U') IS NULL
  CREATE TABLE automation_rule_decisions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, automation_rule_execution_id UNIQUEIDENTIFIER NULL, triggering_event NVARCHAR(220) NOT NULL, evaluated_values NVARCHAR(MAX) NULL, matched_conditions NVARCHAR(MAX) NULL, alternative_rules NVARCHAR(MAX) NULL, conflict_resolution NVARCHAR(220) NULL, selected_actions NVARCHAR(MAX) NULL, confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, risk_level NVARCHAR(80) NOT NULL DEFAULT 'low', outcome NVARCHAR(180) NOT NULL, final_output_impact NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_conflicts', 'U') IS NULL
  CREATE TABLE automation_rule_conflicts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, primary_rule_id UNIQUEIDENTIFIER NOT NULL, conflicting_rule_id UNIQUEIDENTIFIER NULL, trigger_name NVARCHAR(180) NOT NULL, conflict_type NVARCHAR(160) NOT NULL, impact NVARCHAR(220) NULL, risk_score DECIMAL(8,2) NOT NULL DEFAULT 0, execution_ambiguity NVARCHAR(220) NULL, suggested_resolution NVARCHAR(500) NULL, auto_resolution_available BIT NOT NULL DEFAULT 0, governance_review_required BIT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_validation_runs', 'U') IS NULL
  CREATE TABLE automation_rule_validation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(40) NOT NULL, error_count INT NOT NULL DEFAULT 0, warning_count INT NOT NULL DEFAULT 0, recommendation_count INT NOT NULL DEFAULT 0, validated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_validation_results', 'U') IS NULL
  CREATE TABLE automation_rule_validation_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, validation_run_id UNIQUEIDENTIFIER NOT NULL, severity NVARCHAR(40) NOT NULL, rule_section NVARCHAR(120) NOT NULL, message NVARCHAR(500) NOT NULL, suggested_fix NVARCHAR(500) NULL, auto_fix_available BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_simulation_runs', 'U') IS NULL
  CREATE TABLE automation_rule_simulation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, matched BIT NOT NULL DEFAULT 0, decision NVARCHAR(220) NULL, estimated_duration_ms INT NOT NULL DEFAULT 0, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, final_outcome NVARCHAR(180) NULL, audit_preview NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_simulation_steps', 'U') IS NULL
  CREATE TABLE automation_rule_simulation_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, simulation_run_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, result NVARCHAR(180) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_metrics', 'U') IS NULL
  CREATE TABLE automation_rule_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, execution_count_today INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, failure_rate DECIMAL(8,2) NOT NULL DEFAULT 0, avg_evaluation_ms INT NOT NULL DEFAULT 0, avg_action_duration_ms INT NOT NULL DEFAULT 0, cost_per_execution DECIMAL(18,6) NOT NULL DEFAULT 0, recovery_rate DECIMAL(8,2) NOT NULL DEFAULT 0, duplicate_suppression_count INT NOT NULL DEFAULT 0, conflict_rate DECIMAL(8,2) NOT NULL DEFAULT 0, human_escalation_rate DECIMAL(8,2) NOT NULL DEFAULT 0, final_output_impact_score DECIMAL(8,2) NOT NULL DEFAULT 0, sla_improvement_percent DECIMAL(8,2) NOT NULL DEFAULT 0, cost_savings DECIMAL(18,4) NOT NULL DEFAULT 0, metric_date DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE), created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_recommendations', 'U') IS NULL
  CREATE TABLE automation_rule_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, description NVARCHAR(1000) NULL, impact NVARCHAR(80) NOT NULL DEFAULT 'medium', confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, inside_guardrails BIT NOT NULL DEFAULT 1, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_change_history', 'U') IS NULL
  CREATE TABLE automation_rule_change_history (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, change_type NVARCHAR(120) NOT NULL, change_summary NVARCHAR(500) NOT NULL, changed_by NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_documentation', 'U') IS NULL
  CREATE TABLE automation_rule_documentation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, title NVARCHAR(220) NOT NULL, content_markdown NVARCHAR(MAX) NOT NULL, generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_tags', 'U') IS NULL
  CREATE TABLE automation_rule_tags (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, tag NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('automation_rule_dependencies', 'U') IS NULL
  CREATE TABLE automation_rule_dependencies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, automation_rule_id UNIQUEIDENTIFIER NOT NULL, dependency_type NVARCHAR(80) NOT NULL, dependency_name NVARCHAR(180) NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'healthy', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('vw_automation_rules_list', 'V') IS NOT NULL DROP VIEW vw_automation_rules_list;
EXEC('CREATE VIEW vw_automation_rules_list AS
SELECT r.id, r.organization_id, r.rule_code, r.rule_name, r.description, r.category, COALESCE(t.trigger_type, ''Event'') AS trigger_type, COALESCE(t.trigger_source, ''event-bus'') AS trigger_source,
  (SELECT COUNT(*) FROM automation_rule_conditions c JOIN automation_rule_condition_groups g ON g.id = c.condition_group_id WHERE g.automation_rule_id = r.id) AS condition_count,
  (SELECT COUNT(*) FROM automation_rule_actions a WHERE a.automation_rule_id = r.id) AS action_count,
  r.priority, r.status, r.current_version, r.published_version, r.environment, r.execution_mode, COALESCE(m.success_rate, 100) AS success_rate, COALESCE(m.avg_evaluation_ms, 0) AS avg_evaluation_time,
  COALESCE(m.execution_count_today, 0) AS executions_today, CAST(ROUND(COALESCE(m.execution_count_today, 0) * COALESCE(m.failure_rate, 0) / 100.0, 0) AS INT) AS failed_actions,
  CAST(ROUND(COALESCE(m.execution_count_today, 0) * COALESCE(m.recovery_rate, 0) / 100.0, 0) AS INT) AS recoveries,
  COALESCE(m.duplicate_suppression_count, 0) AS duplicate_suppression_count,
  CASE WHEN EXISTS (SELECT 1 FROM automation_rule_conflicts c WHERE c.primary_rule_id = r.id AND c.status = ''open'') THEN ''conflicted'' ELSE ''clear'' END AS conflict_status,
  (SELECT MAX(created_at) FROM automation_rule_executions e WHERE e.automation_rule_id = r.id) AS last_execution,
  (SELECT MIN(next_run_at) FROM automation_rule_schedules s WHERE s.automation_rule_id = r.id AND s.is_enabled = 1) AS next_scheduled_evaluation,
  COALESCE(r.owner_id, ''automation-engine'') AS owner,
  org.name AS organization,
  r.recovery_enabled,
  r.human_escalation_enabled,
  r.effective_at,
  r.expires_at,
  r.created_at,
  COALESCE(r.updated_at, r.created_at) AS updated_at
FROM automation_rules r
JOIN organizations org ON org.id = r.organization_id
LEFT JOIN automation_rule_triggers t ON t.automation_rule_id = r.id
LEFT JOIN automation_rule_metrics m ON m.automation_rule_id = r.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE r.is_deleted = 0');

IF OBJECT_ID('vw_automation_rule_health', 'V') IS NOT NULL DROP VIEW vw_automation_rule_health;
EXEC('CREATE VIEW vw_automation_rule_health AS
SELECT organization_id,
  COUNT(*) AS total_rules,
  COUNT(CASE WHEN status = ''active'' THEN 1 END) AS active_rules,
  SUM(executions_today) AS executions_today,
  CAST(AVG(success_rate) AS DECIMAL(8,2)) AS successful_executions,
  CAST(AVG(CASE WHEN success_rate IS NULL THEN 0 ELSE 100 - success_rate END) AS DECIMAL(8,2)) AS failed_executions,
  SUM(duplicate_suppression_count) AS suppressed_duplicates,
  COUNT(CASE WHEN conflict_status = ''conflicted'' THEN 1 END) AS rule_conflicts,
  SUM(recoveries) AS auto_recovered_failures,
  CAST(AVG(avg_evaluation_time) AS DECIMAL(8,2)) AS average_evaluation_time,
  COUNT(CASE WHEN human_escalation_enabled = 1 AND status IN (''invalid'',''conflicted'') THEN 1 END) AS human_attention_required,
  MAX(last_execution) AS last_rule_evaluation
FROM vw_automation_rules_list
GROUP BY organization_id');

IF OBJECT_ID('vw_automation_rule_executions', 'V') IS NOT NULL DROP VIEW vw_automation_rule_executions;
EXEC('CREATE VIEW vw_automation_rule_executions AS SELECT e.*, r.rule_code, r.rule_name, r.category, org.name AS organization FROM automation_rule_executions e JOIN automation_rules r ON r.id = e.automation_rule_id JOIN organizations org ON org.id = e.organization_id');

IF OBJECT_ID('vw_automation_rule_conflicts', 'V') IS NOT NULL DROP VIEW vw_automation_rule_conflicts;
EXEC('CREATE VIEW vw_automation_rule_conflicts AS SELECT c.*, r.rule_code, r.rule_name, r.category, cr.rule_code AS conflicting_rule_code, cr.rule_name AS conflicting_rule_name FROM automation_rule_conflicts c JOIN automation_rules r ON r.id = c.primary_rule_id LEFT JOIN automation_rules cr ON cr.id = c.conflicting_rule_id');

IF OBJECT_ID('vw_automation_rule_performance', 'V') IS NOT NULL DROP VIEW vw_automation_rule_performance;
EXEC('CREATE VIEW vw_automation_rule_performance AS SELECT m.*, r.organization_id, r.rule_code, r.rule_name, r.category, r.status FROM automation_rule_metrics m JOIN automation_rules r ON r.id = m.automation_rule_id');

IF OBJECT_ID('vw_automation_rule_recommendations', 'V') IS NOT NULL DROP VIEW vw_automation_rule_recommendations;
EXEC('CREATE VIEW vw_automation_rule_recommendations AS SELECT rec.*, r.organization_id, r.rule_code, r.rule_name, r.category FROM automation_rule_recommendations rec JOIN automation_rules r ON r.id = rec.automation_rule_id');

IF OBJECT_ID('vw_automation_rule_final_output_impact', 'V') IS NOT NULL DROP VIEW vw_automation_rule_final_output_impact;
EXEC('CREATE VIEW vw_automation_rule_final_output_impact AS
SELECT r.id, r.organization_id, r.rule_code, r.rule_name, r.category,
  CASE WHEN r.category IN (''Publishing Automation'',''Analytics Automation'',''Learning Automation'',''Workflow Execution'') THEN ''keeps workflows on track'' WHEN EXISTS (SELECT 1 FROM automation_rule_conflicts c WHERE c.primary_rule_id = r.id AND c.status = ''open'') THEN ''causing conflicts'' ELSE ''preventing failures'' END AS impact_type,
  COALESCE(m.final_output_impact_score, 0) AS impact_score,
  COALESCE(m.sla_improvement_percent, 0) AS sla_improvement_percent,
  COALESCE(m.cost_savings, 0) AS cost_savings,
  CASE WHEN COALESCE(m.final_output_impact_score, 0) >= 80 THEN ''improving final-output completion'' WHEN COALESCE(m.final_output_impact_score, 0) < 50 THEN ''requiring optimization'' ELSE ''stable'' END AS outcome
FROM automation_rules r LEFT JOIN automation_rule_metrics m ON m.automation_rule_id = r.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE r.is_deleted = 0');
