IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002_enterprise_core_engines')
BEGIN
IF COL_LENGTH('pages', 'required_permission') IS NULL
  ALTER TABLE pages ADD required_permission NVARCHAR(120) NULL;

IF COL_LENGTH('routes', 'required_permission') IS NULL
  ALTER TABLE routes ADD required_permission NVARCHAR(120) NULL;

IF COL_LENGTH('sidebar_items', 'required_permission') IS NULL
  ALTER TABLE sidebar_items ADD required_permission NVARCHAR(120) NULL;

CREATE TABLE sessions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NOT NULL,
  refresh_token_hash NVARCHAR(255) NOT NULL,
  ip_address NVARCHAR(80) NULL,
  user_agent NVARCHAR(500) NULL,
  expires_at DATETIME2 NOT NULL,
  revoked_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_sessions_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE login_history (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NULL,
  email NVARCHAR(255) NOT NULL,
  status NVARCHAR(40) NOT NULL,
  ip_address NVARCHAR(80) NULL,
  user_agent NVARCHAR(500) NULL,
  failure_reason NVARCHAR(255) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_login_history_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_login_history_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE page_permissions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  page_id UNIQUEIDENTIFIER NOT NULL,
  permission_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_page_permissions_page FOREIGN KEY (page_id) REFERENCES pages(id),
  CONSTRAINT fk_page_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
  CONSTRAINT uq_page_permissions UNIQUE (page_id, permission_id)
);

CREATE TABLE action_permissions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  action_code NVARCHAR(120) NOT NULL,
  permission_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_action_permissions_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_action_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
  CONSTRAINT uq_action_permissions UNIQUE (organization_id, action_code, permission_id)
);

CREATE TABLE api_permissions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  api_endpoint_id UNIQUEIDENTIFIER NOT NULL,
  permission_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_api_permissions_endpoint FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoints(id),
  CONSTRAINT fk_api_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
  CONSTRAINT uq_api_permissions UNIQUE (api_endpoint_id, permission_id)
);

CREATE TABLE activity_logs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  actor_user_id UNIQUEIDENTIFIER NULL,
  activity_type NVARCHAR(120) NOT NULL,
  description NVARCHAR(500) NOT NULL,
  metadata NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_activity_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE feature_flags (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  flag_key NVARCHAR(150) NOT NULL,
  is_enabled BIT NOT NULL DEFAULT 0,
  environment NVARCHAR(40) NOT NULL DEFAULT 'all',
  description NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_feature_flags_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE tenant_settings (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  setting_key NVARCHAR(150) NOT NULL,
  setting_value NVARCHAR(MAX) NULL,
  environment NVARCHAR(40) NOT NULL DEFAULT 'all',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_tenant_settings_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT uq_tenant_settings UNIQUE (organization_id, setting_key, environment)
);

CREATE TABLE health_checks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  check_name NVARCHAR(160) NOT NULL,
  target_type NVARCHAR(80) NOT NULL,
  status NVARCHAR(40) NOT NULL,
  latency_ms INT NULL,
  details NVARCHAR(MAX) NULL,
  checked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_health_checks_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE queue_health (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  queue_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(40) NOT NULL,
  depth INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  checked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_queue_health_queue FOREIGN KEY (queue_id) REFERENCES job_queues(id)
);

CREATE TABLE workflow_transitions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  from_stage_id UNIQUEIDENTIFIER NULL,
  to_stage_id UNIQUEIDENTIFIER NOT NULL,
  transition_name NVARCHAR(160) NOT NULL,
  rule_expression NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_transitions_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_transitions_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id),
  CONSTRAINT fk_workflow_transitions_from FOREIGN KEY (from_stage_id) REFERENCES workflow_stages(id),
  CONSTRAINT fk_workflow_transitions_to FOREIGN KEY (to_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_approvals (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  stage_id UNIQUEIDENTIFIER NOT NULL,
  requested_by UNIQUEIDENTIFIER NULL,
  approved_by UNIQUEIDENTIFIER NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'pending',
  comments NVARCHAR(1000) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_approvals_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_approvals_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id),
  CONSTRAINT fk_workflow_approvals_stage FOREIGN KEY (stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_execution_logs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  stage_id UNIQUEIDENTIFIER NULL,
  status NVARCHAR(40) NOT NULL,
  message NVARCHAR(500) NULL,
  metadata NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_execution_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_execution_logs_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id),
  CONSTRAINT fk_workflow_execution_logs_stage FOREIGN KEY (stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workers (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  queue_id UNIQUEIDENTIFIER NOT NULL,
  worker_name NVARCHAR(160) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'idle',
  heartbeat_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workers_queue FOREIGN KEY (queue_id) REFERENCES job_queues(id)
);

CREATE TABLE failed_jobs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  job_id UNIQUEIDENTIFIER NOT NULL,
  error_message NVARCHAR(MAX) NOT NULL,
  failed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  retry_after DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_failed_jobs_job FOREIGN KEY (job_id) REFERENCES background_jobs(id)
);

CREATE TABLE notification_templates (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  template_key NVARCHAR(150) NOT NULL,
  channel NVARCHAR(40) NOT NULL,
  subject NVARCHAR(255) NULL,
  body NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_notification_templates_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE event_logs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  event_name NVARCHAR(160) NOT NULL,
  aggregate_type NVARCHAR(120) NULL,
  aggregate_id UNIQUEIDENTIFIER NULL,
  payload NVARCHAR(MAX) NULL,
  occurred_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_event_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE event_subscriptions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  event_name NVARCHAR(160) NOT NULL,
  handler_name NVARCHAR(160) NOT NULL,
  is_enabled BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_event_subscriptions_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE storage_providers (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  provider_name NVARCHAR(120) NOT NULL,
  provider_type NVARCHAR(40) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'active',
  config_reference NVARCHAR(255) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_storage_providers_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE asset_storage (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  storage_provider_id UNIQUEIDENTIFIER NULL,
  asset_key NVARCHAR(255) NOT NULL,
  file_name NVARCHAR(255) NOT NULL,
  mime_type NVARCHAR(120) NULL,
  size_bytes BIGINT NULL,
  metadata NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_asset_storage_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_asset_storage_provider FOREIGN KEY (storage_provider_id) REFERENCES storage_providers(id)
);

CREATE TABLE ai_providers (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  provider_name NVARCHAR(120) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'active',
  base_url NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE ai_models (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  provider_id UNIQUEIDENTIFIER NOT NULL,
  model_name NVARCHAR(160) NOT NULL,
  model_type NVARCHAR(80) NOT NULL,
  context_window INT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'active',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_ai_models_provider FOREIGN KEY (provider_id) REFERENCES ai_providers(id)
);

CREATE TABLE prompts (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  prompt_key NVARCHAR(150) NOT NULL,
  prompt_text NVARCHAR(MAX) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_prompts_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE agent_runs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  agent_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(40) NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(18, 6) NOT NULL DEFAULT 0,
  started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  completed_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_agent_runs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_agent_runs_agent FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
);

CREATE TABLE ai_usage_logs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  provider_id UNIQUEIDENTIFIER NULL,
  model_id UNIQUEIDENTIFIER NULL,
  agent_run_id UNIQUEIDENTIFIER NULL,
  usage_type NVARCHAR(80) NOT NULL,
  token_count INT NOT NULL DEFAULT 0,
  cost_usd DECIMAL(18, 6) NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_ai_usage_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_ai_usage_logs_provider FOREIGN KEY (provider_id) REFERENCES ai_providers(id),
  CONSTRAINT fk_ai_usage_logs_model FOREIGN KEY (model_id) REFERENCES ai_models(id),
  CONSTRAINT fk_ai_usage_logs_run FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id)
);

CREATE INDEX ix_sessions_user_active ON sessions(user_id, is_active);
CREATE INDEX ix_login_history_org_created ON login_history(organization_id, created_at DESC);
CREATE INDEX ix_activity_logs_org_created ON activity_logs(organization_id, created_at DESC);
CREATE INDEX ix_health_checks_target ON health_checks(target_type, checked_at DESC);
CREATE INDEX ix_event_logs_name_time ON event_logs(event_name, occurred_at DESC);
CREATE INDEX ix_agent_runs_agent_time ON agent_runs(agent_id, started_at DESC);

INSERT INTO schema_migrations(version) VALUES ('002_enterprise_core_engines');
END;
