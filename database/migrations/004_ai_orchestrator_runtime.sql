IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '004_ai_orchestrator_runtime')
BEGIN
IF OBJECT_ID('ai_providers', 'U') IS NULL
BEGIN
  CREATE TABLE ai_providers (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NULL,
    code NVARCHAR(120) NULL,
    name NVARCHAR(180) NULL,
    provider_name NVARCHAR(180) NULL,
    provider_type NVARCHAR(80) NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'disabled',
    base_url NVARCHAR(500) NULL,
    config_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_active BIT NOT NULL DEFAULT 1,
    is_deleted BIT NOT NULL DEFAULT 0
  );
END
ELSE
BEGIN
  IF COL_LENGTH('ai_providers', 'organization_id') IS NULL ALTER TABLE ai_providers ADD organization_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('ai_providers', 'code') IS NULL ALTER TABLE ai_providers ADD code NVARCHAR(120) NULL;
  IF COL_LENGTH('ai_providers', 'name') IS NULL ALTER TABLE ai_providers ADD name NVARCHAR(180) NULL;
  IF COL_LENGTH('ai_providers', 'provider_type') IS NULL ALTER TABLE ai_providers ADD provider_type NVARCHAR(80) NULL;
  IF COL_LENGTH('ai_providers', 'config_json') IS NULL ALTER TABLE ai_providers ADD config_json NVARCHAR(MAX) NULL;
END;

IF OBJECT_ID('ai_models', 'U') IS NULL
BEGIN
  CREATE TABLE ai_models (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    provider_id UNIQUEIDENTIFIER NOT NULL,
    code NVARCHAR(120) NULL,
    name NVARCHAR(180) NULL,
    model_name NVARCHAR(180) NULL,
    model_type NVARCHAR(80) NOT NULL,
    context_window INT NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'disabled',
    quality_tier NVARCHAR(40) NULL,
    latency_tier NVARCHAR(40) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_active BIT NOT NULL DEFAULT 1,
    is_deleted BIT NOT NULL DEFAULT 0
  );
END
ELSE
BEGIN
  IF COL_LENGTH('ai_models', 'code') IS NULL ALTER TABLE ai_models ADD code NVARCHAR(120) NULL;
  IF COL_LENGTH('ai_models', 'name') IS NULL ALTER TABLE ai_models ADD name NVARCHAR(180) NULL;
  IF COL_LENGTH('ai_models', 'quality_tier') IS NULL ALTER TABLE ai_models ADD quality_tier NVARCHAR(40) NULL;
  IF COL_LENGTH('ai_models', 'latency_tier') IS NULL ALTER TABLE ai_models ADD latency_tier NVARCHAR(40) NULL;
END;

IF OBJECT_ID('ai_agents', 'U') IS NULL
BEGIN
  CREATE TABLE ai_agents (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NULL,
    code NVARCHAR(120) NULL,
    name NVARCHAR(180) NOT NULL,
    domain NVARCHAR(80) NULL,
    description NVARCHAR(1000) NULL,
    current_version INT NOT NULL DEFAULT 1,
    status NVARCHAR(40) NOT NULL DEFAULT 'active',
    approval_required BIT NOT NULL DEFAULT 0,
    timeout_seconds INT NOT NULL DEFAULT 120,
    max_retries INT NOT NULL DEFAULT 2,
    concurrency_limit INT NOT NULL DEFAULT 5,
    cost_limit DECIMAL(18,4) NOT NULL DEFAULT 0,
    owner NVARCHAR(160) NULL,
    tags NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    created_by UNIQUEIDENTIFIER NULL,
    updated_by UNIQUEIDENTIFIER NULL,
    is_active BIT NOT NULL DEFAULT 1,
    is_deleted BIT NOT NULL DEFAULT 0
  );
END
ELSE
BEGIN
  IF COL_LENGTH('ai_agents', 'code') IS NULL ALTER TABLE ai_agents ADD code NVARCHAR(120) NULL;
  IF COL_LENGTH('ai_agents', 'domain') IS NULL ALTER TABLE ai_agents ADD domain NVARCHAR(80) NULL;
  IF COL_LENGTH('ai_agents', 'description') IS NULL ALTER TABLE ai_agents ADD description NVARCHAR(1000) NULL;
  IF COL_LENGTH('ai_agents', 'current_version') IS NULL ALTER TABLE ai_agents ADD current_version INT NOT NULL CONSTRAINT df_ai_agents_current_version DEFAULT 1;
  IF COL_LENGTH('ai_agents', 'approval_required') IS NULL ALTER TABLE ai_agents ADD approval_required BIT NOT NULL CONSTRAINT df_ai_agents_approval_required DEFAULT 0;
  IF COL_LENGTH('ai_agents', 'timeout_seconds') IS NULL ALTER TABLE ai_agents ADD timeout_seconds INT NOT NULL CONSTRAINT df_ai_agents_timeout DEFAULT 120;
  IF COL_LENGTH('ai_agents', 'max_retries') IS NULL ALTER TABLE ai_agents ADD max_retries INT NOT NULL CONSTRAINT df_ai_agents_retries DEFAULT 2;
  IF COL_LENGTH('ai_agents', 'concurrency_limit') IS NULL ALTER TABLE ai_agents ADD concurrency_limit INT NOT NULL CONSTRAINT df_ai_agents_concurrency DEFAULT 5;
  IF COL_LENGTH('ai_agents', 'cost_limit') IS NULL ALTER TABLE ai_agents ADD cost_limit DECIMAL(18,4) NOT NULL CONSTRAINT df_ai_agents_cost_limit DEFAULT 0;
  IF COL_LENGTH('ai_agents', 'owner') IS NULL ALTER TABLE ai_agents ADD owner NVARCHAR(160) NULL;
  IF COL_LENGTH('ai_agents', 'tags') IS NULL ALTER TABLE ai_agents ADD tags NVARCHAR(MAX) NULL;
END;

IF OBJECT_ID('ai_provider_credentials', 'U') IS NULL
  CREATE TABLE ai_provider_credentials (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, provider_id UNIQUEIDENTIFIER NOT NULL, credential_name NVARCHAR(160) NOT NULL, secret_reference NVARCHAR(500) NOT NULL, encryption_status NVARCHAR(40) NOT NULL DEFAULT 'external_secret', status NVARCHAR(40) NOT NULL DEFAULT 'inactive', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_model_capabilities', 'U') IS NULL
  CREATE TABLE ai_model_capabilities (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, model_id UNIQUEIDENTIFIER NOT NULL, capability NVARCHAR(120) NOT NULL, media_type NVARCHAR(80) NULL, max_input_tokens INT NULL, max_output_tokens INT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_model_health', 'U') IS NULL
  CREATE TABLE ai_model_health (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, model_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'unknown', success_rate DECIMAL(8,4) NOT NULL DEFAULT 0, avg_latency_ms INT NOT NULL DEFAULT 0, checked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_model_pricing', 'U') IS NULL
  CREATE TABLE ai_model_pricing (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, model_id UNIQUEIDENTIFIER NOT NULL, input_token_cost DECIMAL(18,8) NOT NULL DEFAULT 0, output_token_cost DECIMAL(18,8) NOT NULL DEFAULT 0, unit_cost DECIMAL(18,8) NOT NULL DEFAULT 0, currency NVARCHAR(10) NOT NULL DEFAULT 'USD', effective_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_versions', 'U') IS NULL
  CREATE TABLE ai_agent_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, agent_id UNIQUEIDENTIFIER NOT NULL, version INT NOT NULL, manifest_json NVARCHAR(MAX) NOT NULL, output_schema_json NVARCHAR(MAX) NULL, validation_rules_json NVARCHAR(MAX) NULL, status NVARCHAR(40) NOT NULL DEFAULT 'active', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_capabilities', 'U') IS NULL
  CREATE TABLE ai_agent_capabilities (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, agent_id UNIQUEIDENTIFIER NOT NULL, capability NVARCHAR(120) NOT NULL, input_type NVARCHAR(80) NULL, output_type NVARCHAR(80) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_tools', 'U') IS NULL
  CREATE TABLE ai_agent_tools (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, agent_id UNIQUEIDENTIFIER NULL, code NVARCHAR(120) NOT NULL, name NVARCHAR(180) NOT NULL, description NVARCHAR(1000) NULL, category NVARCHAR(80) NOT NULL, input_schema_json NVARCHAR(MAX) NULL, output_schema_json NVARCHAR(MAX) NULL, required_permission NVARCHAR(120) NULL, allowed_agents_json NVARCHAR(MAX) NULL, timeout_seconds INT NOT NULL DEFAULT 60, retry_policy_json NVARCHAR(MAX) NULL, rate_limit_json NVARCHAR(MAX) NULL, audit_policy NVARCHAR(80) NOT NULL DEFAULT 'always', status NVARCHAR(40) NOT NULL DEFAULT 'enabled', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_agent_prompts', 'U') IS NULL
  CREATE TABLE ai_agent_prompts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, agent_id UNIQUEIDENTIFIER NOT NULL, code NVARCHAR(120) NOT NULL, name NVARCHAR(180) NOT NULL, current_version INT NOT NULL DEFAULT 1, language NVARCHAR(40) NOT NULL DEFAULT 'en', status NVARCHAR(40) NOT NULL DEFAULT 'active', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_agent_prompt_versions', 'U') IS NULL
  CREATE TABLE ai_agent_prompt_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, version INT NOT NULL, system_prompt NVARCHAR(MAX) NOT NULL, user_prompt_template NVARCHAR(MAX) NOT NULL, variables_json NVARCHAR(MAX) NULL, output_schema_json NVARCHAR(MAX) NULL, model_settings_json NVARCHAR(MAX) NULL, approval_status NVARCHAR(40) NOT NULL DEFAULT 'approved', test_status NVARCHAR(40) NOT NULL DEFAULT 'untested', is_active BIT NOT NULL DEFAULT 1, rollback_version INT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_execution_plans', 'U') IS NULL
  CREATE TABLE ai_execution_plans (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, workflow_instance_id UNIQUEIDENTIFIER NULL, objective NVARCHAR(1000) NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'planned', estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, actual_cost DECIMAL(18,6) NOT NULL DEFAULT 0, estimated_duration_ms INT NOT NULL DEFAULT 0, actual_duration_ms INT NOT NULL DEFAULT 0, created_by NVARCHAR(120) NULL, correlation_id NVARCHAR(120) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_execution_plan_steps', 'U') IS NULL
  CREATE TABLE ai_execution_plan_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, plan_id UNIQUEIDENTIFIER NOT NULL, agent_id UNIQUEIDENTIFIER NOT NULL, workflow_stage_id UNIQUEIDENTIFIER NULL, execution_order INT NOT NULL, execution_mode NVARCHAR(40) NOT NULL DEFAULT 'sequential', dependency_step_ids NVARCHAR(MAX) NULL, status NVARCHAR(40) NOT NULL DEFAULT 'planned', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_agent_runs', 'U') IS NULL
  CREATE TABLE ai_agent_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, agent_id UNIQUEIDENTIFIER NOT NULL, agent_version INT NOT NULL DEFAULT 1, workflow_instance_id UNIQUEIDENTIFIER NULL, workflow_stage_id UNIQUEIDENTIFIER NULL, execution_plan_id UNIQUEIDENTIFIER NULL, task_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'queued', progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, provider_id UNIQUEIDENTIFIER NULL, model_id UNIQUEIDENTIFIER NULL, input_reference NVARCHAR(500) NULL, output_reference NVARCHAR(500) NULL, confidence_score DECIMAL(8,4) NULL, started_at DATETIME2 NULL, completed_at DATETIME2 NULL, latency_ms INT NULL, input_tokens INT NOT NULL DEFAULT 0, output_tokens INT NOT NULL DEFAULT 0, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, retry_count INT NOT NULL DEFAULT 0, correlation_id NVARCHAR(120) NOT NULL, error_code NVARCHAR(120) NULL, error_message NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_agent_run_steps', 'U') IS NULL
  CREATE TABLE ai_agent_run_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, run_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'queued', progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, started_at DATETIME2 NULL, completed_at DATETIME2 NULL, metadata_json NVARCHAR(MAX) NULL);

IF OBJECT_ID('ai_agent_run_logs', 'U') IS NULL
  CREATE TABLE ai_agent_run_logs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, run_id UNIQUEIDENTIFIER NOT NULL, severity NVARCHAR(40) NOT NULL DEFAULT 'info', message NVARCHAR(MAX) NOT NULL, metadata_json NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_outputs', 'U') IS NULL
  CREATE TABLE ai_agent_outputs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, run_id UNIQUEIDENTIFIER NOT NULL, workflow_instance_id UNIQUEIDENTIFIER NULL, workflow_stage_id UNIQUEIDENTIFIER NULL, content_item_id UNIQUEIDENTIFIER NULL, output_type NVARCHAR(120) NOT NULL, output_json NVARCHAR(MAX) NOT NULL, confidence_score DECIMAL(8,4) NULL, validation_status NVARCHAR(40) NOT NULL DEFAULT 'pending', validation_errors_json NVARCHAR(MAX) NULL, citations_json NVARCHAR(MAX) NULL, assets_json NVARCHAR(MAX) NULL, source_references_json NVARCHAR(MAX) NULL, provider_id UNIQUEIDENTIFIER NULL, model_id UNIQUEIDENTIFIER NULL, prompt_version_id UNIQUEIDENTIFIER NULL, version INT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_output_versions', 'U') IS NULL
  CREATE TABLE ai_agent_output_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, output_id UNIQUEIDENTIFIER NOT NULL, version INT NOT NULL, output_json NVARCHAR(MAX) NOT NULL, change_reason NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_failures', 'U') IS NULL
  CREATE TABLE ai_agent_failures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, run_id UNIQUEIDENTIFIER NOT NULL, failure_code NVARCHAR(120) NOT NULL, failure_message NVARCHAR(MAX) NOT NULL, is_retryable BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_retries', 'U') IS NULL
  CREATE TABLE ai_agent_retries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, run_id UNIQUEIDENTIFIER NOT NULL, retry_number INT NOT NULL, retry_reason NVARCHAR(500) NULL, scheduled_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), executed_at DATETIME2 NULL);

IF OBJECT_ID('ai_agent_memory', 'U') IS NULL
  CREATE TABLE ai_agent_memory (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, agent_id UNIQUEIDENTIFIER NULL, memory_type NVARCHAR(80) NOT NULL, memory_key NVARCHAR(180) NOT NULL, memory_json NVARCHAR(MAX) NOT NULL, provenance_json NVARCHAR(MAX) NULL, expires_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_context', 'U') IS NULL
  CREATE TABLE ai_agent_context (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, run_id UNIQUEIDENTIFIER NOT NULL, context_type NVARCHAR(80) NOT NULL, context_json NVARCHAR(MAX) NOT NULL, source_references_json NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_metrics', 'U') IS NULL
  CREATE TABLE ai_agent_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, agent_id UNIQUEIDENTIFIER NULL, metric_key NVARCHAR(120) NOT NULL, metric_value DECIMAL(18,6) NOT NULL, metric_date DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE), created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_agent_feedback', 'U') IS NULL
  CREATE TABLE ai_agent_feedback (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, run_id UNIQUEIDENTIFIER NULL, output_id UNIQUEIDENTIFIER NULL, feedback_type NVARCHAR(80) NOT NULL, rating DECIMAL(8,2) NULL, comments NVARCHAR(MAX) NULL, created_by NVARCHAR(120) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_usage_records', 'U') IS NULL
  CREATE TABLE ai_usage_records (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, run_id UNIQUEIDENTIFIER NULL, provider_id UNIQUEIDENTIFIER NULL, model_id UNIQUEIDENTIFIER NULL, input_tokens INT NOT NULL DEFAULT 0, output_tokens INT NOT NULL DEFAULT 0, latency_ms INT NOT NULL DEFAULT 0, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, outcome NVARCHAR(40) NOT NULL, recorded_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('ai_cost_budgets', 'U') IS NULL
  CREATE TABLE ai_cost_budgets (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, scope_type NVARCHAR(80) NOT NULL, scope_id NVARCHAR(120) NULL, period NVARCHAR(40) NOT NULL DEFAULT 'monthly', budget_amount DECIMAL(18,6) NOT NULL, warning_threshold_percent DECIMAL(8,2) NOT NULL DEFAULT 80, hard_limit BIT NOT NULL DEFAULT 1, status NVARCHAR(40) NOT NULL DEFAULT 'active', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF OBJECT_ID('ai_orchestration_events', 'U') IS NULL
  CREATE TABLE ai_orchestration_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NULL, execution_plan_id UNIQUEIDENTIFIER NULL, run_id UNIQUEIDENTIFIER NULL, event_name NVARCHAR(160) NOT NULL, payload_json NVARCHAR(MAX) NULL, correlation_id NVARCHAR(120) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('workflow_stage_agent_mappings', 'U') IS NULL
  CREATE TABLE workflow_stage_agent_mappings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, workflow_stage_id UNIQUEIDENTIFIER NOT NULL, agent_id UNIQUEIDENTIFIER NOT NULL, execution_order INT NOT NULL DEFAULT 1, execution_mode NVARCHAR(40) NOT NULL DEFAULT 'sequential', required BIT NOT NULL DEFAULT 1, condition_expression NVARCHAR(MAX) NULL, input_mapping NVARCHAR(MAX) NULL, output_mapping NVARCHAR(MAX) NULL, fallback_agent_id UNIQUEIDENTIFIER NULL, timeout_seconds INT NOT NULL DEFAULT 120, max_retries INT NOT NULL DEFAULT 2, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2 NULL);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_ai_agent_runs_workflow_stage') CREATE INDEX ix_ai_agent_runs_workflow_stage ON ai_agent_runs(workflow_instance_id, workflow_stage_id, status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_ai_outputs_workflow') CREATE INDEX ix_ai_outputs_workflow ON ai_agent_outputs(workflow_instance_id, workflow_stage_id, output_type);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_ai_events_run') CREATE INDEX ix_ai_events_run ON ai_orchestration_events(run_id, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_stage_agent_mappings_stage') CREATE INDEX ix_stage_agent_mappings_stage ON workflow_stage_agent_mappings(workflow_stage_id, execution_order);

INSERT INTO schema_migrations(version) VALUES ('004_ai_orchestrator_runtime');
END;
