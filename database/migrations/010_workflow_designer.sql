SET NOCOUNT ON;

IF COL_LENGTH('workflow_definitions', 'category') IS NULL ALTER TABLE workflow_definitions ADD category NVARCHAR(120) NULL;
IF COL_LENGTH('workflow_definitions', 'current_draft_version') IS NULL ALTER TABLE workflow_definitions ADD current_draft_version INT NOT NULL CONSTRAINT df_workflow_definitions_current_draft_version DEFAULT 1;
IF COL_LENGTH('workflow_definitions', 'current_published_version') IS NULL ALTER TABLE workflow_definitions ADD current_published_version INT NULL;
IF COL_LENGTH('workflow_definitions', 'execution_mode') IS NULL ALTER TABLE workflow_definitions ADD execution_mode NVARCHAR(80) NOT NULL CONSTRAINT df_workflow_definitions_execution_mode DEFAULT 'autonomous';
IF COL_LENGTH('workflow_definitions', 'owner_id') IS NULL ALTER TABLE workflow_definitions ADD owner_id NVARCHAR(120) NULL;
IF COL_LENGTH('workflow_definitions', 'tags_json') IS NULL ALTER TABLE workflow_definitions ADD tags_json NVARCHAR(MAX) NULL;

IF OBJECT_ID('workflow_definition_versions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_versions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    version_number INT NOT NULL,
    version_label NVARCHAR(120) NULL,
    status NVARCHAR(80) NOT NULL DEFAULT 'draft',
    definition_json NVARCHAR(MAX) NULL,
    created_by NVARCHAR(120) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    published_at DATETIME2 NULL,
    CONSTRAINT uq_workflow_definition_versions UNIQUE (workflow_definition_id, version_number)
  );
END;

IF OBJECT_ID('workflow_stage_dependencies', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_stage_dependencies (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    workflow_stage_id UNIQUEIDENTIFIER NOT NULL,
    depends_on_stage_id UNIQUEIDENTIFIER NOT NULL,
    dependency_type NVARCHAR(80) NOT NULL DEFAULT 'success',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_rules', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_rules (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    rule_name NVARCHAR(180) NOT NULL,
    rule_type NVARCHAR(80) NOT NULL,
    expression NVARCHAR(MAX) NULL,
    severity NVARCHAR(40) NOT NULL DEFAULT 'warning',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_actions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_actions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    workflow_stage_id UNIQUEIDENTIFIER NULL,
    action_name NVARCHAR(180) NOT NULL,
    action_type NVARCHAR(80) NOT NULL,
    config_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_templates', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_templates (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    template_code NVARCHAR(120) NOT NULL,
    template_name NVARCHAR(180) NOT NULL,
    category NVARCHAR(120) NOT NULL,
    description NVARCHAR(500) NULL,
    status NVARCHAR(80) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
  );
END;

IF OBJECT_ID('workflow_template_versions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_template_versions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    template_id UNIQUEIDENTIFIER NOT NULL,
    version_number INT NOT NULL,
    template_json NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(80) NOT NULL DEFAULT 'active',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_node_types', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_node_types (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    category NVARCHAR(120) NOT NULL,
    node_type NVARCHAR(120) NOT NULL,
    display_name NVARCHAR(180) NOT NULL,
    description NVARCHAR(500) NULL,
    icon NVARCHAR(80) NULL,
    required_permission NVARCHAR(120) NULL,
    expected_inputs_json NVARCHAR(MAX) NULL,
    expected_outputs_json NVARCHAR(MAX) NULL,
    color_token NVARCHAR(40) NOT NULL DEFAULT 'blue',
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_node_configurations', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_node_configurations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    workflow_stage_id UNIQUEIDENTIFIER NULL,
    node_type_id UNIQUEIDENTIFIER NULL,
    node_key NVARCHAR(120) NOT NULL,
    node_name NVARCHAR(180) NOT NULL,
    node_type NVARCHAR(120) NOT NULL,
    category NVARCHAR(120) NOT NULL,
    description NVARCHAR(500) NULL,
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    status NVARCHAR(80) NOT NULL DEFAULT 'Configured',
    input_count INT NOT NULL DEFAULT 0,
    output_count INT NOT NULL DEFAULT 1,
    retry_policy NVARCHAR(160) NULL,
    timeout_seconds INT NULL,
    approval_required BIT NOT NULL DEFAULT 0,
    validation_state NVARCHAR(80) NOT NULL DEFAULT 'Valid',
    error_count INT NOT NULL DEFAULT 0,
    warning_count INT NOT NULL DEFAULT 0,
    config_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
  );
END;

IF OBJECT_ID('workflow_connections', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_connections (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    from_node_id UNIQUEIDENTIFIER NULL,
    to_node_id UNIQUEIDENTIFIER NULL,
    from_stage_id UNIQUEIDENTIFIER NULL,
    to_stage_id UNIQUEIDENTIFIER NULL,
    transition_name NVARCHAR(180) NOT NULL,
    connection_type NVARCHAR(80) NOT NULL DEFAULT 'success',
    condition_expression NVARCHAR(MAX) NULL,
    priority INT NOT NULL DEFAULT 1,
    line_style NVARCHAR(80) NOT NULL DEFAULT 'solid',
    audit_required BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_groups', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_groups (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, group_name NVARCHAR(180) NOT NULL, color_token NVARCHAR(40) NULL, collapsed BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_annotations', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_annotations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, node_id UNIQUEIDENTIFIER NULL, annotation_text NVARCHAR(MAX) NOT NULL, position_x INT NOT NULL DEFAULT 0, position_y INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_variables', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_variables (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, variable_name NVARCHAR(120) NOT NULL, variable_type NVARCHAR(80) NOT NULL, default_value NVARCHAR(MAX) NULL, required BIT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_input_schemas', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_input_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, schema_json NVARCHAR(MAX) NOT NULL, version_number INT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_output_schemas', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_output_schemas (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, schema_json NVARCHAR(MAX) NOT NULL, version_number INT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_validation_runs', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_validation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(80) NOT NULL, error_count INT NOT NULL DEFAULT 0, warning_count INT NOT NULL DEFAULT 0, validated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), summary NVARCHAR(MAX) NULL);
END;
IF OBJECT_ID('workflow_validation_results', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_validation_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, validation_run_id UNIQUEIDENTIFIER NOT NULL, node_id UNIQUEIDENTIFIER NULL, severity NVARCHAR(40) NOT NULL, message NVARCHAR(MAX) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_simulation_runs', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_simulation_runs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(80) NOT NULL, simulated_duration_seconds INT NOT NULL DEFAULT 0, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), completed_at DATETIME2 NULL, summary NVARCHAR(MAX) NULL);
END;
IF OBJECT_ID('workflow_simulation_steps', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_simulation_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, simulation_run_id UNIQUEIDENTIFIER NOT NULL, node_id UNIQUEIDENTIFIER NULL, step_name NVARCHAR(180) NOT NULL, status NVARCHAR(80) NOT NULL, duration_seconds INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_cost_estimates', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_cost_estimates (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, estimated_cost DECIMAL(18,6) NOT NULL DEFAULT 0, currency NVARCHAR(10) NOT NULL DEFAULT 'USD', estimate_basis NVARCHAR(240) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_performance_estimates', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_performance_estimates (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, estimated_duration_seconds INT NOT NULL DEFAULT 0, throughput_per_hour INT NOT NULL DEFAULT 0, bottleneck_node NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_comments', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_comments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, node_id UNIQUEIDENTIFIER NULL, comment_text NVARCHAR(MAX) NOT NULL, author NVARCHAR(160) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_change_history', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_change_history (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, change_type NVARCHAR(120) NOT NULL, change_summary NVARCHAR(MAX) NOT NULL, actor NVARCHAR(160) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;
IF OBJECT_ID('workflow_deployments', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_deployments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, version_number INT NOT NULL, environment NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, deployed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), deployed_by NVARCHAR(160) NULL);
END;
IF OBJECT_ID('workflow_environment_versions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_environment_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_definition_id UNIQUEIDENTIFIER NOT NULL, environment NVARCHAR(80) NOT NULL, active_version INT NOT NULL, status NVARCHAR(80) NOT NULL DEFAULT 'active', updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_workflow_nodes_definition')
  CREATE INDEX ix_workflow_nodes_definition ON workflow_node_configurations(workflow_definition_id, category, status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_workflow_connections_definition')
  CREATE INDEX ix_workflow_connections_definition ON workflow_connections(workflow_definition_id, connection_type);
