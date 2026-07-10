SET NOCOUNT ON;

IF OBJECT_ID('workflow_triggers', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_triggers (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    trigger_code NVARCHAR(120) NOT NULL,
    trigger_name NVARCHAR(220) NOT NULL,
    description NVARCHAR(1000) NULL,
    trigger_type NVARCHAR(80) NOT NULL,
    category NVARCHAR(120) NOT NULL,
    source_id UNIQUEIDENTIFIER NULL,
    event_name NVARCHAR(180) NOT NULL,
    target_workflow_id UNIQUEIDENTIFIER NULL,
    target_workflow_version INT NOT NULL DEFAULT 1,
    priority NVARCHAR(40) NOT NULL DEFAULT 'medium',
    status NVARCHAR(40) NOT NULL DEFAULT 'draft',
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    debounce_ms INT NOT NULL DEFAULT 0,
    throttle_limit INT NOT NULL DEFAULT 100,
    deduplication_window_seconds INT NOT NULL DEFAULT 300,
    retry_policy_id NVARCHAR(120) NULL,
    dead_letter_enabled BIT NOT NULL DEFAULT 1,
    owner_id NVARCHAR(180) NULL,
    current_version INT NOT NULL DEFAULT 1,
    published_version INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_workflow_triggers_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );
END;

IF OBJECT_ID('workflow_trigger_sources', 'U') IS NULL
  CREATE TABLE workflow_trigger_sources (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_name NVARCHAR(180) NOT NULL, source_system NVARCHAR(180) NOT NULL, topic_channel NVARCHAR(180) NULL, endpoint NVARCHAR(500) NULL, provider NVARCHAR(180) NULL, service_name NVARCHAR(180) NULL, authentication_method NVARCHAR(120) NULL, status NVARCHAR(40) NOT NULL DEFAULT 'connected', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_versions', 'U') IS NULL
  CREATE TABLE workflow_trigger_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, version_number INT NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'draft', change_summary NVARCHAR(500) NULL, validation_status NVARCHAR(80) NULL, test_status NVARCHAR(80) NULL, published_environment NVARCHAR(80) NULL, execution_count INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, rollback_eligible BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_event_schemas', 'U') IS NULL
  CREATE TABLE workflow_trigger_event_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, schema_version NVARCHAR(40) NOT NULL DEFAULT '1.0', input_schema NVARCHAR(MAX) NULL, required_fields NVARCHAR(MAX) NULL, optional_fields NVARCHAR(MAX) NULL, validation_rules NVARCHAR(MAX) NULL, sample_event NVARCHAR(MAX) NULL, sensitive_fields NVARCHAR(MAX) NULL, redaction_rules NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_scopes', 'U') IS NULL
  CREATE TABLE workflow_trigger_scopes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, scope_type NVARCHAR(80) NOT NULL, scope_value NVARCHAR(220) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_condition_groups', 'U') IS NULL
  CREATE TABLE workflow_trigger_condition_groups (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, parent_group_id UNIQUEIDENTIFIER NULL, boolean_operator NVARCHAR(20) NOT NULL DEFAULT 'AND', group_order INT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_conditions', 'U') IS NULL
  CREATE TABLE workflow_trigger_conditions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, condition_group_id UNIQUEIDENTIFIER NOT NULL, field_path NVARCHAR(240) NOT NULL, operator NVARCHAR(80) NOT NULL, compare_value NVARCHAR(500) NULL, context_variable NVARCHAR(180) NULL, fallback_value NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_mappings', 'U') IS NULL
  CREATE TABLE workflow_trigger_mappings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, workflow_definition_id UNIQUEIDENTIFIER NULL, input_mapping NVARCHAR(MAX) NULL, reference_mapping NVARCHAR(220) NULL, queue_name NVARCHAR(120) NULL, correlation_strategy NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_schedules', 'U') IS NULL
  CREATE TABLE workflow_trigger_schedules (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, schedule_type NVARCHAR(80) NOT NULL, timezone NVARCHAR(80) NOT NULL DEFAULT 'Africa/Lagos', recurrence NVARCHAR(180) NULL, missed_run_policy NVARCHAR(80) NOT NULL DEFAULT 'recalculate', next_run_at DATETIME2 NULL, previous_run_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_reliability_policies', 'U') IS NULL
  CREATE TABLE workflow_trigger_reliability_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, idempotency_key NVARCHAR(240) NULL, replay_policy NVARCHAR(180) NULL, retry_policy NVARCHAR(180) NULL, timeout_seconds INT NOT NULL DEFAULT 120, dead_letter_queue NVARCHAR(180) NULL, rate_limit_per_minute INT NOT NULL DEFAULT 120, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_guardrails', 'U') IS NULL
  CREATE TABLE workflow_trigger_guardrails (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, cost_limit DECIMAL(18,4) NOT NULL DEFAULT 0, security_boundary NVARCHAR(180) NULL, required_permission NVARCHAR(160) NULL, tenant_isolation BIT NOT NULL DEFAULT 1, max_workflow_launches INT NOT NULL DEFAULT 1000, escalation_rule NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_events', 'U') IS NULL
  CREATE TABLE workflow_trigger_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, workflow_trigger_id UNIQUEIDENTIFIER NULL, event_id NVARCHAR(180) NOT NULL, source NVARCHAR(180) NOT NULL, event_type NVARCHAR(180) NOT NULL, correlation_id NVARCHAR(180) NULL, schema_version NVARCHAR(40) NOT NULL DEFAULT '1.0', validation_status NVARCHAR(40) NOT NULL DEFAULT 'valid', candidate_triggers INT NOT NULL DEFAULT 0, matched_triggers INT NOT NULL DEFAULT 0, workflow_launched BIT NOT NULL DEFAULT 0, processing_duration_ms INT NOT NULL DEFAULT 0, outcome NVARCHAR(120) NOT NULL DEFAULT 'processed', payload_redacted NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_executions', 'U') IS NULL
  CREATE TABLE workflow_trigger_executions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, organization_id UNIQUEIDENTIFIER NOT NULL, event_id NVARCHAR(180) NOT NULL, matched BIT NOT NULL DEFAULT 0, workflow_started BIT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'Evaluating', duration_ms INT NOT NULL DEFAULT 0, duplicate_suppressed BIT NOT NULL DEFAULT 0, throttled BIT NOT NULL DEFAULT 0, retry_used BIT NOT NULL DEFAULT 0, workflow_instance_id UNIQUEIDENTIFIER NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_failures', 'U') IS NULL
  CREATE TABLE workflow_trigger_failures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NULL, event_id NVARCHAR(180) NOT NULL, failure_reason NVARCHAR(500) NOT NULL, validation_error NVARCHAR(500) NULL, recoverability NVARCHAR(80) NOT NULL DEFAULT 'recoverable', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_retries', 'U') IS NULL
  CREATE TABLE workflow_trigger_retries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NULL, event_id NVARCHAR(180) NOT NULL, retry_count INT NOT NULL DEFAULT 0, retry_reason NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_dead_letters', 'U') IS NULL
  CREATE TABLE workflow_trigger_dead_letters (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, workflow_trigger_id UNIQUEIDENTIFIER NULL, event_id NVARCHAR(180) NOT NULL, source NVARCHAR(180) NOT NULL, event_type NVARCHAR(180) NOT NULL, failure_reason NVARCHAR(500) NOT NULL, validation_error NVARCHAR(500) NULL, retry_count INT NOT NULL DEFAULT 0, first_failed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), last_retry_at DATETIME2 NULL, related_workflow NVARCHAR(180) NULL, recoverability NVARCHAR(80) NOT NULL DEFAULT 'Recoverable', recommended_action NVARCHAR(240) NULL, status NVARCHAR(80) NOT NULL DEFAULT 'Pending Review', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_replays', 'U') IS NULL
  CREATE TABLE workflow_trigger_replays (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NULL, event_id NVARCHAR(180) NOT NULL, replay_status NVARCHAR(80) NOT NULL DEFAULT 'queued', replayed_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_conflicts', 'U') IS NULL
  CREATE TABLE workflow_trigger_conflicts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, primary_trigger_id UNIQUEIDENTIFIER NOT NULL, conflicting_trigger_id UNIQUEIDENTIFIER NULL, source NVARCHAR(180) NOT NULL, event_name NVARCHAR(180) NOT NULL, conflict_type NVARCHAR(160) NOT NULL, impact NVARCHAR(220) NULL, risk_score DECIMAL(8,2) NOT NULL DEFAULT 0, suggested_resolution NVARCHAR(500) NULL, auto_resolution_available BIT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_validation_runs', 'U') IS NULL
  CREATE TABLE workflow_trigger_validation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(40) NOT NULL, error_count INT NOT NULL DEFAULT 0, warning_count INT NOT NULL DEFAULT 0, recommendation_count INT NOT NULL DEFAULT 0, validated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_validation_results', 'U') IS NULL
  CREATE TABLE workflow_trigger_validation_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, validation_run_id UNIQUEIDENTIFIER NOT NULL, severity NVARCHAR(40) NOT NULL, affected_field NVARCHAR(160) NOT NULL, message NVARCHAR(500) NOT NULL, suggested_fix NVARCHAR(500) NULL, auto_fix_available BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_test_runs', 'U') IS NULL
  CREATE TABLE workflow_trigger_test_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, test_mode NVARCHAR(80) NOT NULL DEFAULT 'Dry Run', schema_validation NVARCHAR(80) NULL, scope_resolution NVARCHAR(80) NULL, deduplication_result NVARCHAR(80) NULL, trigger_matched BIT NOT NULL DEFAULT 0, workflow_selected NVARCHAR(180) NULL, estimated_impact NVARCHAR(180) NULL, final_result NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_test_results', 'U') IS NULL
  CREATE TABLE workflow_trigger_test_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, test_run_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, result NVARCHAR(180) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_metrics', 'U') IS NULL
  CREATE TABLE workflow_trigger_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, metric_date DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE), events_received_today INT NOT NULL DEFAULT 0, workflows_started INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, failure_count INT NOT NULL DEFAULT 0, duplicate_suppression_count INT NOT NULL DEFAULT 0, delayed_events INT NOT NULL DEFAULT 0, average_latency_ms INT NOT NULL DEFAULT 0, dead_letter_count INT NOT NULL DEFAULT 0, replay_success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, final_output_readiness DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_recommendations', 'U') IS NULL
  CREATE TABLE workflow_trigger_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, description NVARCHAR(1000) NULL, impact NVARCHAR(80) NOT NULL DEFAULT 'medium', confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, inside_guardrails BIT NOT NULL DEFAULT 1, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_change_history', 'U') IS NULL
  CREATE TABLE workflow_trigger_change_history (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, change_type NVARCHAR(120) NOT NULL, change_summary NVARCHAR(500) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_trigger_documentation', 'U') IS NULL
  CREATE TABLE workflow_trigger_documentation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_trigger_id UNIQUEIDENTIFIER NOT NULL, title NVARCHAR(220) NOT NULL, content_markdown NVARCHAR(MAX) NOT NULL, generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('vw_workflow_triggers_list', 'V') IS NOT NULL DROP VIEW vw_workflow_triggers_list;
EXEC('CREATE VIEW vw_workflow_triggers_list AS
SELECT t.id, t.organization_id, t.trigger_code, t.trigger_name, t.description, t.trigger_type, t.category,
  COALESCE(src.source_system, t.event_name) AS source, t.event_name, COALESCE(wd.name, ''Unmapped Workflow'') AS workflow,
  COALESCE(sc.scope_value, ''organization'') AS scope, t.environment, t.status, t.priority,
  (SELECT COUNT(*) FROM workflow_trigger_conditions c JOIN workflow_trigger_condition_groups g ON g.id = c.condition_group_id WHERE g.workflow_trigger_id = t.id) AS conditions,
  t.debounce_ms, t.throttle_limit, CASE WHEN t.deduplication_window_seconds > 0 THEN ''enabled'' ELSE ''missing'' END AS deduplication,
  COALESCE(t.retry_policy_id, ''retry:3 exponential'') AS retry_policy, CASE WHEN t.dead_letter_enabled = 1 THEN ''dead-letter enabled'' ELSE ''missing dead-letter'' END AS failure_policy,
  COALESCE(m.events_received_today, 0) AS events_received_today, COALESCE(m.workflows_started, 0) AS workflows_started, COALESCE(m.success_rate, 100) AS success_rate,
  COALESCE(m.failure_count, 0) AS failure_count, COALESCE(m.duplicate_suppression_count, 0) AS duplicate_suppression_count, COALESCE(m.delayed_events, 0) AS delayed_events,
  COALESCE(m.average_latency_ms, 0) AS avg_latency, (SELECT MAX(created_at) FROM workflow_trigger_events e WHERE e.workflow_trigger_id = t.id) AS last_event,
  (SELECT MAX(created_at) FROM workflow_trigger_executions x WHERE x.workflow_trigger_id = t.id AND x.workflow_started = 1) AS last_activation,
  (SELECT MIN(next_run_at) FROM workflow_trigger_schedules s WHERE s.workflow_trigger_id = t.id) AS next_scheduled_run,
  COALESCE(t.owner_id, ''trigger-engine'') AS owner, org.name AS organization, t.current_version, t.published_version, t.target_workflow_id, t.target_workflow_version,
  t.dead_letter_enabled, t.created_at, COALESCE(t.updated_at, t.created_at) AS updated_at
FROM workflow_triggers t
JOIN organizations org ON org.id = t.organization_id
LEFT JOIN workflow_trigger_sources src ON src.id = t.source_id
LEFT JOIN workflow_definitions wd ON wd.id = t.target_workflow_id
LEFT JOIN workflow_trigger_scopes sc ON sc.workflow_trigger_id = t.id AND sc.scope_type = ''organization''
LEFT JOIN workflow_trigger_metrics m ON m.workflow_trigger_id = t.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE t.is_deleted = 0');

IF OBJECT_ID('vw_trigger_engine_summary', 'V') IS NOT NULL DROP VIEW vw_trigger_engine_summary;
EXEC('CREATE VIEW vw_trigger_engine_summary AS
SELECT organization_id, COUNT(*) AS total_triggers, COUNT(CASE WHEN status = ''active'' THEN 1 END) AS active_triggers,
  SUM(events_received_today) AS events_received_today, SUM(workflows_started) AS workflows_started, SUM(duplicate_suppression_count) AS suppressed_duplicates,
  SUM(failure_count) AS failed_evaluations, SUM(delayed_events) AS delayed_events, CAST(AVG(success_rate) AS DECIMAL(8,2)) AS trigger_success_rate,
  CAST(AVG(avg_latency) AS DECIMAL(8,2)) AS average_evaluation_time, COUNT(CASE WHEN status IN (''failed'',''invalid'') THEN 1 END) AS human_attention_required,
  MAX(last_event) AS last_trigger_event
FROM vw_workflow_triggers_list GROUP BY organization_id');

IF OBJECT_ID('vw_trigger_event_stream', 'V') IS NOT NULL DROP VIEW vw_trigger_event_stream;
EXEC('CREATE VIEW vw_trigger_event_stream AS SELECT e.*, org.name AS organization FROM workflow_trigger_events e JOIN organizations org ON org.id = e.organization_id');
IF OBJECT_ID('vw_trigger_dead_letters', 'V') IS NOT NULL DROP VIEW vw_trigger_dead_letters;
EXEC('CREATE VIEW vw_trigger_dead_letters AS SELECT d.*, t.trigger_code, t.trigger_name, org.name AS organization FROM workflow_trigger_dead_letters d LEFT JOIN workflow_triggers t ON t.id = d.workflow_trigger_id JOIN organizations org ON org.id = d.organization_id');
IF OBJECT_ID('vw_trigger_performance', 'V') IS NOT NULL DROP VIEW vw_trigger_performance;
EXEC('CREATE VIEW vw_trigger_performance AS SELECT m.*, t.organization_id, t.trigger_code, t.trigger_name, t.trigger_type, t.category, t.status FROM workflow_trigger_metrics m JOIN workflow_triggers t ON t.id = m.workflow_trigger_id');
IF OBJECT_ID('vw_trigger_conflicts', 'V') IS NOT NULL DROP VIEW vw_trigger_conflicts;
EXEC('CREATE VIEW vw_trigger_conflicts AS SELECT c.*, t.trigger_code, t.trigger_name, ct.trigger_code AS conflicting_trigger_code, ct.trigger_name AS conflicting_trigger_name FROM workflow_trigger_conflicts c JOIN workflow_triggers t ON t.id = c.primary_trigger_id LEFT JOIN workflow_triggers ct ON ct.id = c.conflicting_trigger_id');
IF OBJECT_ID('vw_trigger_final_output_linkage', 'V') IS NOT NULL DROP VIEW vw_trigger_final_output_linkage;
EXEC('CREATE VIEW vw_trigger_final_output_linkage AS
SELECT t.id, t.organization_id, t.trigger_code, t.trigger_name, t.category, COALESCE(wd.name, ''Missing Workflow'') AS workflow,
  CASE WHEN t.target_workflow_id IS NULL THEN ''missing workflow'' WHEN COALESCE(m.final_output_readiness, 0) < 70 THEN ''final output at risk'' ELSE ''complete linkage'' END AS linkage_status,
  COALESCE(m.final_output_readiness, 0) AS readiness_percent,
  CASE WHEN t.target_workflow_id IS NULL THEN 1 ELSE 0 END AS missing_workflow,
  CASE WHEN COALESCE(m.final_output_readiness, 0) < 80 THEN 1 ELSE 0 END AS missing_analytics,
  CASE WHEN COALESCE(m.final_output_readiness, 0) < 75 THEN 1 ELSE 0 END AS missing_learning
FROM workflow_triggers t LEFT JOIN workflow_definitions wd ON wd.id = t.target_workflow_id LEFT JOIN workflow_trigger_metrics m ON m.workflow_trigger_id = t.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE t.is_deleted = 0');
IF OBJECT_ID('vw_trigger_recommendations', 'V') IS NOT NULL DROP VIEW vw_trigger_recommendations;
EXEC('CREATE VIEW vw_trigger_recommendations AS SELECT r.*, t.organization_id, t.trigger_code, t.trigger_name, t.category FROM workflow_trigger_recommendations r JOIN workflow_triggers t ON t.id = r.workflow_trigger_id');
