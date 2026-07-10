IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003_workflow_engine_runtime')
BEGIN
IF COL_LENGTH('workflow_definitions', 'code') IS NULL
  ALTER TABLE workflow_definitions ADD code NVARCHAR(120) NULL;
IF COL_LENGTH('workflow_definitions', 'description') IS NULL
  ALTER TABLE workflow_definitions ADD description NVARCHAR(500) NULL;
IF COL_LENGTH('workflow_definitions', 'workflow_type') IS NULL
  ALTER TABLE workflow_definitions ADD workflow_type NVARCHAR(80) NULL;
IF COL_LENGTH('workflow_definitions', 'current_version') IS NULL
  ALTER TABLE workflow_definitions ADD current_version INT NOT NULL CONSTRAINT df_workflow_definitions_current_version DEFAULT 1;
IF COL_LENGTH('workflow_definitions', 'is_system_workflow') IS NULL
  ALTER TABLE workflow_definitions ADD is_system_workflow BIT NOT NULL CONSTRAINT df_workflow_definitions_is_system DEFAULT 0;

IF COL_LENGTH('workflow_stages', 'stage_code') IS NULL
  ALTER TABLE workflow_stages ADD stage_code NVARCHAR(120) NULL;
IF COL_LENGTH('workflow_stages', 'sequence_no') IS NULL
  ALTER TABLE workflow_stages ADD sequence_no INT NULL;
IF COL_LENGTH('workflow_stages', 'stage_type') IS NULL
  ALTER TABLE workflow_stages ADD stage_type NVARCHAR(80) NULL;
IF COL_LENGTH('workflow_stages', 'execution_mode') IS NULL
  ALTER TABLE workflow_stages ADD execution_mode NVARCHAR(40) NULL;
IF COL_LENGTH('workflow_stages', 'timeout_seconds') IS NULL
  ALTER TABLE workflow_stages ADD timeout_seconds INT NULL;
IF COL_LENGTH('workflow_stages', 'retry_policy') IS NULL
  ALTER TABLE workflow_stages ADD retry_policy NVARCHAR(MAX) NULL;
IF COL_LENGTH('workflow_stages', 'required_permission') IS NULL
  ALTER TABLE workflow_stages ADD required_permission NVARCHAR(120) NULL;
IF COL_LENGTH('workflow_stages', 'weight_percent') IS NULL
  ALTER TABLE workflow_stages ADD weight_percent DECIMAL(8,2) NOT NULL CONSTRAINT df_workflow_stages_weight DEFAULT 1;
IF COL_LENGTH('workflow_stages', 'is_optional') IS NULL
  ALTER TABLE workflow_stages ADD is_optional BIT NOT NULL CONSTRAINT df_workflow_stages_optional DEFAULT 0;

CREATE TABLE workflow_instances (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  workflow_version INT NOT NULL DEFAULT 1,
  reference_type NVARCHAR(120) NULL,
  reference_id NVARCHAR(120) NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'queued',
  current_stage_id UNIQUEIDENTIFIER NULL,
  progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  started_at DATETIME2 NULL,
  completed_at DATETIME2 NULL,
  stopped_at DATETIME2 NULL,
  paused_at DATETIME2 NULL,
  initiated_by NVARCHAR(120) NULL,
  correlation_id NVARCHAR(120) NOT NULL,
  context_json NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_instances_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_instances_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id),
  CONSTRAINT fk_workflow_instances_stage FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_instance_steps (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
  workflow_stage_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'queued',
  progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  started_at DATETIME2 NULL,
  completed_at DATETIME2 NULL,
  error_message NVARCHAR(MAX) NULL,
  retry_count INT NOT NULL DEFAULT 0,
  worker_id NVARCHAR(120) NULL,
  output_reference NVARCHAR(300) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  CONSTRAINT fk_workflow_instance_steps_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_workflow_instance_steps_stage FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_events (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  workflow_instance_id UNIQUEIDENTIFIER NULL,
  event_name NVARCHAR(160) NOT NULL,
  payload_json NVARCHAR(MAX) NULL,
  correlation_id NVARCHAR(120) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_workflow_events_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_events_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
);

CREATE TABLE workflow_failures (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
  workflow_stage_id UNIQUEIDENTIFIER NULL,
  failure_code NVARCHAR(120) NOT NULL,
  failure_message NVARCHAR(MAX) NOT NULL,
  stack_summary NVARCHAR(MAX) NULL,
  is_retryable BIT NOT NULL DEFAULT 1,
  resolution_status NVARCHAR(40) NOT NULL DEFAULT 'open',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_workflow_failures_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_workflow_failures_stage FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_retries (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
  workflow_stage_id UNIQUEIDENTIFIER NULL,
  requested_by NVARCHAR(120) NULL,
  retry_reason NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_workflow_retries_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_workflow_retries_stage FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE workflow_schedules (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  cron_expression NVARCHAR(120) NOT NULL,
  timezone NVARCHAR(80) NOT NULL DEFAULT 'UTC',
  next_run_at DATETIME2 NULL,
  last_run_at DATETIME2 NULL,
  is_enabled BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  CONSTRAINT fk_workflow_schedules_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id)
);

CREATE TABLE workflow_locks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_instance_id UNIQUEIDENTIFIER NULL,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  lock_key NVARCHAR(180) NOT NULL,
  locked_by NVARCHAR(120) NOT NULL,
  locked_until DATETIME2 NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_workflow_locks_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT uq_workflow_locks_key UNIQUE (organization_id, lock_key)
);

CREATE TABLE workflow_metrics (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
  metric_key NVARCHAR(120) NOT NULL,
  metric_value DECIMAL(18,4) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_workflow_metrics_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
);

CREATE TABLE system_runtime_state (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'stopped',
  startup_workflow_instance_id UNIQUEIDENTIFIER NULL,
  shutdown_workflow_instance_id UNIQUEIDENTIFIER NULL,
  started_at DATETIME2 NULL,
  stopped_at DATETIME2 NULL,
  paused_at DATETIME2 NULL,
  last_heartbeat_at DATETIME2 NULL,
  health_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  current_stage NVARCHAR(160) NULL,
  requested_by NVARCHAR(120) NULL,
  updated_at DATETIME2 NULL,
  CONSTRAINT fk_system_runtime_state_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_system_runtime_startup_instance FOREIGN KEY (startup_workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_system_runtime_shutdown_instance FOREIGN KEY (shutdown_workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT uq_system_runtime_state_org UNIQUE (organization_id)
);

CREATE INDEX ix_workflow_instances_org_status ON workflow_instances(organization_id, status, created_at DESC);
CREATE INDEX ix_workflow_steps_instance ON workflow_instance_steps(workflow_instance_id, status);
CREATE INDEX ix_workflow_events_instance ON workflow_events(workflow_instance_id, created_at DESC);

INSERT INTO schema_migrations(version) VALUES ('003_workflow_engine_runtime');
END;
