SET NOCOUNT ON;

IF OBJECT_ID('workflow_action_categories', 'U') IS NULL
  CREATE TABLE workflow_action_categories (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, category_name NVARCHAR(160) NOT NULL, description NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('workflow_actions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_actions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    action_code NVARCHAR(120) NOT NULL,
    action_name NVARCHAR(220) NOT NULL,
    description NVARCHAR(1000) NULL,
    category_id UNIQUEIDENTIFIER NULL,
    action_type NVARCHAR(120) NOT NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'draft',
    current_version INT NOT NULL DEFAULT 1,
    published_version INT NULL,
    execution_mode NVARCHAR(80) NOT NULL DEFAULT 'fully_autonomous',
    queue_name NVARCHAR(120) NOT NULL DEFAULT 'workflow-actions',
    worker_pool_id NVARCHAR(160) NULL,
    required_permission NVARCHAR(160) NULL,
    timeout_seconds INT NOT NULL DEFAULT 120,
    rate_limit INT NOT NULL DEFAULT 120,
    idempotency_enabled BIT NOT NULL DEFAULT 1,
    retry_enabled BIT NOT NULL DEFAULT 1,
    recovery_enabled BIT NOT NULL DEFAULT 1,
    owner_id NVARCHAR(180) NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT fk_workflow_actions_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_workflow_actions_category FOREIGN KEY (category_id) REFERENCES workflow_action_categories(id)
  );
END;
ELSE
BEGIN
  IF COL_LENGTH('workflow_actions', 'organization_id') IS NULL ALTER TABLE workflow_actions ADD organization_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_actions', 'action_code') IS NULL ALTER TABLE workflow_actions ADD action_code NVARCHAR(120) NULL;
  IF COL_LENGTH('workflow_actions', 'action_name') IS NULL ALTER TABLE workflow_actions ADD action_name NVARCHAR(220) NULL;
  IF COL_LENGTH('workflow_actions', 'description') IS NULL ALTER TABLE workflow_actions ADD description NVARCHAR(1000) NULL;
  IF COL_LENGTH('workflow_actions', 'category_id') IS NULL ALTER TABLE workflow_actions ADD category_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_actions', 'action_type') IS NULL ALTER TABLE workflow_actions ADD action_type NVARCHAR(120) NULL;
  IF COL_LENGTH('workflow_actions', 'status') IS NULL ALTER TABLE workflow_actions ADD status NVARCHAR(40) NOT NULL CONSTRAINT df_workflow_actions_status DEFAULT 'draft';
  IF COL_LENGTH('workflow_actions', 'current_version') IS NULL ALTER TABLE workflow_actions ADD current_version INT NOT NULL CONSTRAINT df_workflow_actions_current_version DEFAULT 1;
  IF COL_LENGTH('workflow_actions', 'published_version') IS NULL ALTER TABLE workflow_actions ADD published_version INT NULL;
  IF COL_LENGTH('workflow_actions', 'execution_mode') IS NULL ALTER TABLE workflow_actions ADD execution_mode NVARCHAR(80) NOT NULL CONSTRAINT df_workflow_actions_execution_mode DEFAULT 'fully_autonomous';
  IF COL_LENGTH('workflow_actions', 'queue_name') IS NULL ALTER TABLE workflow_actions ADD queue_name NVARCHAR(120) NOT NULL CONSTRAINT df_workflow_actions_queue DEFAULT 'workflow-actions';
  IF COL_LENGTH('workflow_actions', 'worker_pool_id') IS NULL ALTER TABLE workflow_actions ADD worker_pool_id NVARCHAR(160) NULL;
  IF COL_LENGTH('workflow_actions', 'required_permission') IS NULL ALTER TABLE workflow_actions ADD required_permission NVARCHAR(160) NULL;
  IF COL_LENGTH('workflow_actions', 'timeout_seconds') IS NULL ALTER TABLE workflow_actions ADD timeout_seconds INT NOT NULL CONSTRAINT df_workflow_actions_timeout DEFAULT 120;
  IF COL_LENGTH('workflow_actions', 'rate_limit') IS NULL ALTER TABLE workflow_actions ADD rate_limit INT NOT NULL CONSTRAINT df_workflow_actions_rate_limit DEFAULT 120;
  IF COL_LENGTH('workflow_actions', 'idempotency_enabled') IS NULL ALTER TABLE workflow_actions ADD idempotency_enabled BIT NOT NULL CONSTRAINT df_workflow_actions_idempotency DEFAULT 1;
  IF COL_LENGTH('workflow_actions', 'retry_enabled') IS NULL ALTER TABLE workflow_actions ADD retry_enabled BIT NOT NULL CONSTRAINT df_workflow_actions_retry DEFAULT 1;
  IF COL_LENGTH('workflow_actions', 'recovery_enabled') IS NULL ALTER TABLE workflow_actions ADD recovery_enabled BIT NOT NULL CONSTRAINT df_workflow_actions_recovery DEFAULT 1;
  IF COL_LENGTH('workflow_actions', 'owner_id') IS NULL ALTER TABLE workflow_actions ADD owner_id NVARCHAR(180) NULL;
  IF COL_LENGTH('workflow_actions', 'environment') IS NULL ALTER TABLE workflow_actions ADD environment NVARCHAR(80) NOT NULL CONSTRAINT df_workflow_actions_environment DEFAULT 'production';
  IF COL_LENGTH('workflow_actions', 'created_at') IS NULL ALTER TABLE workflow_actions ADD created_at DATETIME2 NOT NULL CONSTRAINT df_workflow_actions_created_at DEFAULT SYSUTCDATETIME();
  IF COL_LENGTH('workflow_actions', 'updated_at') IS NULL ALTER TABLE workflow_actions ADD updated_at DATETIME2 NULL;
  IF COL_LENGTH('workflow_actions', 'is_deleted') IS NULL ALTER TABLE workflow_actions ADD is_deleted BIT NOT NULL CONSTRAINT df_workflow_actions_deleted DEFAULT 0;
  EXEC('UPDATE workflow_actions SET organization_id = COALESCE(organization_id, (SELECT TOP 1 id FROM organizations ORDER BY created_at)) WHERE organization_id IS NULL');
END;

IF OBJECT_ID('workflow_action_versions', 'U') IS NULL
  CREATE TABLE workflow_action_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, version_number INT NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'draft', change_summary NVARCHAR(500) NULL, validation_status NVARCHAR(80) NULL, test_status NVARCHAR(80) NULL, published_environment NVARCHAR(80) NULL, execution_count INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, rollback_eligible BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_handlers', 'U') IS NULL
  CREATE TABLE workflow_action_handlers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, handler_name NVARCHAR(180) NOT NULL, handler_type NVARCHAR(120) NOT NULL, config_json NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_input_schemas', 'U') IS NULL
  CREATE TABLE workflow_action_input_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, input_schema NVARCHAR(MAX) NULL, required_fields NVARCHAR(MAX) NULL, optional_fields NVARCHAR(MAX) NULL, default_values NVARCHAR(MAX) NULL, validation_rules NVARCHAR(MAX) NULL, sensitive_fields NVARCHAR(MAX) NULL, examples NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_output_schemas', 'U') IS NULL
  CREATE TABLE workflow_action_output_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, output_schema NVARCHAR(MAX) NULL, output_mapping NVARCHAR(MAX) NULL, storage_destination NVARCHAR(220) NULL, retention_policy NVARCHAR(120) NULL, examples NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_permissions', 'U') IS NULL
  CREATE TABLE workflow_action_permissions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, required_permission NVARCHAR(160) NOT NULL, role_restrictions NVARCHAR(MAX) NULL, service_account_access NVARCHAR(180) NULL, tenant_isolation BIT NOT NULL DEFAULT 1, data_classification NVARCHAR(80) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_guardrails', 'U') IS NULL
  CREATE TABLE workflow_action_guardrails (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, cost_ceiling DECIMAL(18,4) NOT NULL DEFAULT 0, risk_threshold DECIMAL(8,2) NOT NULL DEFAULT 80, confirmation_requirement NVARCHAR(120) NULL, security_boundary NVARCHAR(180) NULL, maximum_batch_size INT NOT NULL DEFAULT 100, maximum_retry_count INT NOT NULL DEFAULT 3, maximum_execution_duration_seconds INT NOT NULL DEFAULT 300, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_reliability_policies', 'U') IS NULL
  CREATE TABLE workflow_action_reliability_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, idempotency_strategy NVARCHAR(180) NULL, retry_policy NVARCHAR(180) NULL, backoff_policy NVARCHAR(180) NULL, circuit_breaker_policy NVARCHAR(180) NULL, dead_letter_behavior NVARCHAR(180) NULL, compensation_action NVARCHAR(220) NULL, rollback_action NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_retry_policies', 'U') IS NULL
  CREATE TABLE workflow_action_retry_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, max_attempts INT NOT NULL DEFAULT 3, backoff_seconds INT NOT NULL DEFAULT 30, retry_on NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_recovery_policies', 'U') IS NULL
  CREATE TABLE workflow_action_recovery_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, recovery_policy NVARCHAR(180) NOT NULL, fallback_action NVARCHAR(220) NULL, incident_creation BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_circuit_breakers', 'U') IS NULL
  CREATE TABLE workflow_action_circuit_breakers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, dependency NVARCHAR(180) NOT NULL, state NVARCHAR(80) NOT NULL DEFAULT 'Closed', failure_threshold INT NOT NULL DEFAULT 5, failure_count INT NOT NULL DEFAULT 0, opened_at DATETIME2 NULL, retry_at DATETIME2 NULL, fallback_action NVARCHAR(220) NULL, impact NVARCHAR(220) NULL, recovery_status NVARCHAR(120) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);
IF OBJECT_ID('workflow_action_dependencies', 'U') IS NULL
  CREATE TABLE workflow_action_dependencies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, dependency_type NVARCHAR(80) NOT NULL, dependency_name NVARCHAR(180) NOT NULL, status NVARCHAR(80) NOT NULL DEFAULT 'healthy', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_executions', 'U') IS NULL
  CREATE TABLE workflow_action_executions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, organization_id UNIQUEIDENTIFIER NOT NULL, triggered_by NVARCHAR(180) NOT NULL, workflow_reference NVARCHAR(180) NULL, reference_id NVARCHAR(180) NULL, status NVARCHAR(40) NOT NULL DEFAULT 'Queued', queue_name NVARCHAR(120) NULL, worker_name NVARCHAR(160) NULL, attempt INT NOT NULL DEFAULT 1, progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, duration_ms INT NOT NULL DEFAULT 0, cost DECIMAL(18,6) NOT NULL DEFAULT 0, retry_used BIT NOT NULL DEFAULT 0, recovery_used BIT NOT NULL DEFAULT 0, idempotency_status NVARCHAR(80) NULL, output_status NVARCHAR(80) NULL, started_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_execution_steps', 'U') IS NULL
  CREATE TABLE workflow_action_execution_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_execution_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, status NVARCHAR(40) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, evidence NVARCHAR(MAX) NULL, decision NVARCHAR(220) NULL, confidence_percent DECIMAL(8,2) NULL, risk_level NVARCHAR(80) NULL, component NVARCHAR(120) NULL, audit_reference NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_outputs', 'U') IS NULL
  CREATE TABLE workflow_action_outputs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_execution_id UNIQUEIDENTIFIER NOT NULL, output_reference NVARCHAR(300) NOT NULL, output_status NVARCHAR(80) NOT NULL DEFAULT 'validated', storage_destination NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_failures', 'U') IS NULL
  CREATE TABLE workflow_action_failures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_execution_id UNIQUEIDENTIFIER NOT NULL, failure_code NVARCHAR(120) NOT NULL, failure_message NVARCHAR(500) NOT NULL, recoverability NVARCHAR(80) NOT NULL DEFAULT 'recoverable', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_retries', 'U') IS NULL
  CREATE TABLE workflow_action_retries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_execution_id UNIQUEIDENTIFIER NOT NULL, retry_number INT NOT NULL, retry_reason NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_recoveries', 'U') IS NULL
  CREATE TABLE workflow_action_recoveries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, workflow_action_execution_id UNIQUEIDENTIFIER NULL, failure NVARCHAR(240) NOT NULL, strategy NVARCHAR(180) NOT NULL, policy_name NVARCHAR(180) NOT NULL, attempt INT NOT NULL DEFAULT 1, progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, output_protected BIT NOT NULL DEFAULT 1, expected_recovery_at DATETIME2 NULL, outcome NVARCHAR(160) NOT NULL DEFAULT 'in_progress', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_dead_letters', 'U') IS NULL
  CREATE TABLE workflow_action_dead_letters (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_execution_id UNIQUEIDENTIFIER NOT NULL, reason NVARCHAR(500) NOT NULL, status NVARCHAR(80) NOT NULL DEFAULT 'pending', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_validation_runs', 'U') IS NULL
  CREATE TABLE workflow_action_validation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(40) NOT NULL, error_count INT NOT NULL DEFAULT 0, warning_count INT NOT NULL DEFAULT 0, recommendation_count INT NOT NULL DEFAULT 0, validated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_validation_results', 'U') IS NULL
  CREATE TABLE workflow_action_validation_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, validation_run_id UNIQUEIDENTIFIER NOT NULL, severity NVARCHAR(40) NOT NULL, affected_section NVARCHAR(160) NOT NULL, message NVARCHAR(500) NOT NULL, suggested_fix NVARCHAR(500) NULL, auto_fix_available BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_test_runs', 'U') IS NULL
  CREATE TABLE workflow_action_test_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, test_mode NVARCHAR(80) NOT NULL DEFAULT 'Dry Run', permission_result NVARCHAR(80) NULL, guardrail_result NVARCHAR(80) NULL, idempotency_result NVARCHAR(80) NULL, estimated_duration_ms INT NOT NULL DEFAULT 0, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, final_outcome NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_test_results', 'U') IS NULL
  CREATE TABLE workflow_action_test_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, test_run_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, result NVARCHAR(180) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_metrics', 'U') IS NULL
  CREATE TABLE workflow_action_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, metric_date DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE), executions_today INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, failure_rate DECIMAL(8,2) NOT NULL DEFAULT 0, avg_duration_ms INT NOT NULL DEFAULT 0, p95_duration_ms INT NOT NULL DEFAULT 0, avg_cost DECIMAL(18,6) NOT NULL DEFAULT 0, total_cost DECIMAL(18,4) NOT NULL DEFAULT 0, recovery_rate DECIMAL(8,2) NOT NULL DEFAULT 0, idempotency_protection_rate DECIMAL(8,2) NOT NULL DEFAULT 0, circuit_breaker_events INT NOT NULL DEFAULT 0, final_output_readiness DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_recommendations', 'U') IS NULL
  CREATE TABLE workflow_action_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, description NVARCHAR(1000) NULL, impact NVARCHAR(80) NOT NULL DEFAULT 'medium', confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, inside_guardrails BIT NOT NULL DEFAULT 1, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_change_history', 'U') IS NULL
  CREATE TABLE workflow_action_change_history (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, change_type NVARCHAR(120) NOT NULL, change_summary NVARCHAR(500) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_documentation', 'U') IS NULL
  CREATE TABLE workflow_action_documentation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, title NVARCHAR(220) NOT NULL, content_markdown NVARCHAR(MAX) NOT NULL, generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_tags', 'U') IS NULL
  CREATE TABLE workflow_action_tags (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, tag NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_action_final_output_links', 'U') IS NULL
  CREATE TABLE workflow_action_final_output_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_action_id UNIQUEIDENTIFIER NOT NULL, workflow_stage NVARCHAR(180) NULL, output_name NVARCHAR(180) NULL, storage_state NVARCHAR(80) NULL, approval_state NVARCHAR(80) NULL, publishing_state NVARCHAR(80) NULL, analytics_state NVARCHAR(80) NULL, learning_state NVARCHAR(80) NULL, readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0, linkage_status NVARCHAR(120) NOT NULL DEFAULT 'incomplete', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('vw_workflow_actions_list', 'V') IS NOT NULL DROP VIEW vw_workflow_actions_list;
EXEC('CREATE VIEW vw_workflow_actions_list AS
SELECT a.id, a.organization_id, a.action_code, a.action_name, COALESCE(c.category_name, ''Uncategorized'') AS category, a.action_type, a.description, a.status,
  a.current_version, a.published_version, a.environment, a.execution_mode, a.queue_name, COALESCE(a.worker_pool_id, ''automation-workers'') AS worker_pool,
  COALESCE(a.required_permission, ''workflow_actions.execute'') AS required_permission, a.idempotency_enabled, a.retry_enabled, a.recovery_enabled,
  a.timeout_seconds, a.rate_limit, COALESCE(m.executions_today, 0) AS executions_today, COALESCE(m.success_rate, 100) AS success_rate,
  COALESCE(m.failure_rate, 0) AS failure_rate, COALESCE(m.avg_duration_ms, 0) AS avg_duration_ms, COALESCE(m.avg_cost, 0) AS avg_cost,
  (SELECT MAX(started_at) FROM workflow_action_executions e WHERE e.workflow_action_id = a.id) AS last_execution,
  COALESCE(a.owner_id, ''action-engine'') AS owner, org.name AS organization, COALESCE(m.recovery_rate, 0) AS recovery_rate,
  COALESCE(m.idempotency_protection_rate, 0) AS idempotency_protection_rate, COALESCE(m.total_cost, 0) AS total_cost,
  a.created_at, COALESCE(a.updated_at, a.created_at) AS updated_at
FROM workflow_actions a
JOIN organizations org ON org.id = a.organization_id
LEFT JOIN workflow_action_categories c ON c.id = a.category_id
LEFT JOIN workflow_action_metrics m ON m.workflow_action_id = a.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE a.is_deleted = 0');

IF OBJECT_ID('vw_action_engine_summary', 'V') IS NOT NULL DROP VIEW vw_action_engine_summary;
EXEC('CREATE VIEW vw_action_engine_summary AS
SELECT organization_id, COUNT(*) AS total_actions, COUNT(CASE WHEN status = ''active'' THEN 1 END) AS active_actions,
  SUM(executions_today) AS executions_today, CAST(AVG(success_rate) AS DECIMAL(8,2)) AS successful_executions,
  CAST(AVG(failure_rate) AS DECIMAL(8,2)) AS failed_executions,
  CAST(SUM(ROUND(executions_today * recovery_rate / 100.0, 0)) AS INT) AS auto_recovered,
  CAST(AVG(avg_duration_ms) AS DECIMAL(18,2)) AS average_duration_ms,
  CAST(AVG(idempotency_protection_rate) AS DECIMAL(8,2)) AS idempotency_protection,
  CAST(SUM(total_cost) AS DECIMAL(18,2)) AS action_cost_today,
  COUNT(CASE WHEN status IN (''invalid'',''warning'') THEN 1 END) AS human_attention_required,
  COUNT(CASE WHEN status = ''disabled'' THEN 1 END) AS disabled_actions,
  MAX(last_execution) AS last_action_event
FROM vw_workflow_actions_list GROUP BY organization_id');

IF OBJECT_ID('vw_action_executions', 'V') IS NOT NULL DROP VIEW vw_action_executions;
EXEC('CREATE VIEW vw_action_executions AS SELECT e.*, a.action_code, a.action_name, c.category_name AS category, org.name AS organization FROM workflow_action_executions e JOIN workflow_actions a ON a.id = e.workflow_action_id LEFT JOIN workflow_action_categories c ON c.id = a.category_id JOIN organizations org ON org.id = e.organization_id');
IF OBJECT_ID('vw_action_recoveries', 'V') IS NOT NULL DROP VIEW vw_action_recoveries;
EXEC('CREATE VIEW vw_action_recoveries AS SELECT r.*, a.organization_id, a.action_code, a.action_name FROM workflow_action_recoveries r JOIN workflow_actions a ON a.id = r.workflow_action_id');
IF OBJECT_ID('vw_action_circuit_breakers', 'V') IS NOT NULL DROP VIEW vw_action_circuit_breakers;
EXEC('CREATE VIEW vw_action_circuit_breakers AS SELECT cb.*, a.organization_id, a.action_code, a.action_name FROM workflow_action_circuit_breakers cb JOIN workflow_actions a ON a.id = cb.workflow_action_id');
IF OBJECT_ID('vw_action_performance', 'V') IS NOT NULL DROP VIEW vw_action_performance;
EXEC('CREATE VIEW vw_action_performance AS SELECT m.*, a.organization_id, a.action_code, a.action_name, c.category_name AS category, a.action_type, a.status FROM workflow_action_metrics m JOIN workflow_actions a ON a.id = m.workflow_action_id LEFT JOIN workflow_action_categories c ON c.id = a.category_id');
IF OBJECT_ID('vw_action_recommendations', 'V') IS NOT NULL DROP VIEW vw_action_recommendations;
EXEC('CREATE VIEW vw_action_recommendations AS SELECT r.*, a.organization_id, a.action_code, a.action_name, c.category_name AS category FROM workflow_action_recommendations r JOIN workflow_actions a ON a.id = r.workflow_action_id LEFT JOIN workflow_action_categories c ON c.id = a.category_id');
IF OBJECT_ID('vw_action_final_output_linkage', 'V') IS NOT NULL DROP VIEW vw_action_final_output_linkage;
EXEC('CREATE VIEW vw_action_final_output_linkage AS SELECT l.*, a.organization_id, a.action_code, a.action_name, c.category_name AS category FROM workflow_action_final_output_links l JOIN workflow_actions a ON a.id = l.workflow_action_id LEFT JOIN workflow_action_categories c ON c.id = a.category_id');
