SET NOCOUNT ON;

IF OBJECT_ID('log_sources', 'U') IS NULL
BEGIN
  CREATE TABLE log_sources (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    source_type NVARCHAR(80) NOT NULL,
    source_name NVARCHAR(160) NOT NULL,
    service_name NVARCHAR(160) NOT NULL,
    module_name NVARCHAR(160) NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    region NVARCHAR(80) NULL,
    host NVARCHAR(160) NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'Healthy',
    health_percent DECIMAL(8,2) NOT NULL DEFAULT 100,
    logs_per_minute INT NOT NULL DEFAULT 0,
    ingestion_delay_ms INT NOT NULL DEFAULT 0,
    dropped_events INT NOT NULL DEFAULT 0,
    parsing_errors INT NOT NULL DEFAULT 0,
    storage_destination NVARCHAR(160) NULL,
    last_event_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_entries', 'U') IS NULL
BEGIN
  CREATE TABLE log_entries (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    timestamp DATETIME2 NOT NULL,
    level NVARCHAR(40) NOT NULL,
    source_type NVARCHAR(80) NOT NULL,
    source_name NVARCHAR(160) NOT NULL,
    service_name NVARCHAR(160) NOT NULL,
    module_name NVARCHAR(160) NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    message NVARCHAR(MAX) NOT NULL,
    message_template NVARCHAR(MAX) NULL,
    error_code NVARCHAR(120) NULL,
    exception_type NVARCHAR(180) NULL,
    stack_trace NVARCHAR(MAX) NULL,
    request_id NVARCHAR(120) NULL,
    trace_id NVARCHAR(120) NULL,
    span_id NVARCHAR(120) NULL,
    correlation_id NVARCHAR(120) NULL,
    workflow_instance_id UNIQUEIDENTIFIER NULL,
    workflow_stage_id UNIQUEIDENTIFIER NULL,
    agent_run_id UNIQUEIDENTIFIER NULL,
    job_id UNIQUEIDENTIFIER NULL,
    user_id NVARCHAR(120) NULL,
    endpoint NVARCHAR(260) NULL,
    http_method NVARCHAR(20) NULL,
    status_code INT NULL,
    duration_ms INT NULL,
    region NVARCHAR(80) NULL,
    host NVARCHAR(160) NULL,
    ip_address NVARCHAR(80) NULL,
    metadata_json NVARCHAR(MAX) NULL,
    is_sensitive BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_entry_properties', 'U') IS NULL
BEGIN
  CREATE TABLE log_entry_properties (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    log_entry_id UNIQUEIDENTIFIER NOT NULL,
    property_name NVARCHAR(160) NOT NULL,
    property_value NVARCHAR(MAX) NULL,
    is_sensitive BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_traces', 'U') IS NULL
BEGIN
  CREATE TABLE log_traces (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    trace_id NVARCHAR(120) NOT NULL,
    correlation_id NVARCHAR(120) NULL,
    root_service NVARCHAR(160) NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'completed',
    started_at DATETIME2 NOT NULL,
    ended_at DATETIME2 NULL,
    duration_ms INT NULL,
    log_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_spans', 'U') IS NULL
BEGIN
  CREATE TABLE log_spans (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    trace_id NVARCHAR(120) NOT NULL,
    span_id NVARCHAR(120) NOT NULL,
    parent_span_id NVARCHAR(120) NULL,
    service_name NVARCHAR(160) NOT NULL,
    operation_name NVARCHAR(180) NOT NULL,
    status NVARCHAR(40) NOT NULL,
    started_at DATETIME2 NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    error_state BIT NOT NULL DEFAULT 0,
    metadata_json NVARCHAR(MAX) NULL
  );
END;

IF OBJECT_ID('log_correlations', 'U') IS NULL
BEGIN
  CREATE TABLE log_correlations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    correlation_id NVARCHAR(120) NOT NULL,
    correlation_type NVARCHAR(80) NOT NULL,
    entity_id NVARCHAR(120) NULL,
    entity_name NVARCHAR(180) NULL,
    log_count INT NOT NULL DEFAULT 0,
    status NVARCHAR(40) NOT NULL DEFAULT 'active',
    started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    last_seen_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_error_clusters', 'U') IS NULL
BEGIN
  CREATE TABLE log_error_clusters (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(220) NOT NULL,
    error_code NVARCHAR(120) NULL,
    exception_type NVARCHAR(180) NULL,
    message_signature NVARCHAR(260) NOT NULL,
    service_name NVARCHAR(160) NULL,
    module_name NVARCHAR(160) NULL,
    occurrence_count INT NOT NULL DEFAULT 0,
    first_seen_at DATETIME2 NOT NULL,
    last_seen_at DATETIME2 NOT NULL,
    affected_services INT NOT NULL DEFAULT 0,
    affected_users INT NOT NULL DEFAULT 0,
    impact NVARCHAR(120) NULL,
    trend NVARCHAR(80) NULL,
    resolution_status NVARCHAR(80) NOT NULL DEFAULT 'Open',
    linked_incident NVARCHAR(120) NULL,
    owner NVARCHAR(160) NULL,
    root_cause NVARCHAR(260) NULL
  );
END;

IF OBJECT_ID('log_saved_views', 'U') IS NULL
BEGIN
  CREATE TABLE log_saved_views (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(160) NOT NULL,
    description NVARCHAR(260) NULL,
    query_text NVARCHAR(MAX) NULL,
    filters_json NVARCHAR(MAX) NULL,
    columns_json NVARCHAR(MAX) NULL,
    sort_json NVARCHAR(MAX) NULL,
    owner NVARCHAR(160) NULL,
    visibility NVARCHAR(40) NOT NULL DEFAULT 'Organization',
    default_date_range NVARCHAR(80) NULL,
    alert_attached BIT NOT NULL DEFAULT 0,
    last_used_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_alert_rules', 'U') IS NULL
BEGIN
  CREATE TABLE log_alert_rules (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(180) NOT NULL,
    description NVARCHAR(300) NULL,
    query_text NVARCHAR(MAX) NOT NULL,
    severity NVARCHAR(40) NOT NULL,
    threshold_value INT NOT NULL,
    evaluation_window NVARCHAR(80) NOT NULL,
    frequency NVARCHAR(80) NOT NULL,
    cooldown NVARCHAR(80) NULL,
    notification_channels NVARCHAR(MAX) NULL,
    owner NVARCHAR(160) NULL,
    enabled BIT NOT NULL DEFAULT 1,
    auto_create_incident BIT NOT NULL DEFAULT 0,
    auto_run_remediation_workflow BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_alert_executions', 'U') IS NULL
BEGIN
  CREATE TABLE log_alert_executions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    alert_rule_id UNIQUEIDENTIFIER NOT NULL,
    status NVARCHAR(40) NOT NULL,
    matched_count INT NOT NULL DEFAULT 0,
    executed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    metadata_json NVARCHAR(MAX) NULL
  );
END;

IF OBJECT_ID('log_investigations', 'U') IS NULL
BEGIN
  CREATE TABLE log_investigations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    title NVARCHAR(220) NOT NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'Open',
    owner NVARCHAR(160) NULL,
    linked_incident NVARCHAR(120) NULL,
    tags_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_investigation_entries', 'U') IS NULL
BEGIN
  CREATE TABLE log_investigation_entries (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    investigation_id UNIQUEIDENTIFIER NOT NULL,
    log_entry_id UNIQUEIDENTIFIER NOT NULL,
    pinned_by NVARCHAR(160) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_investigation_notes', 'U') IS NULL
BEGIN
  CREATE TABLE log_investigation_notes (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    investigation_id UNIQUEIDENTIFIER NOT NULL,
    note NVARCHAR(MAX) NOT NULL,
    author NVARCHAR(160) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_retention_policies', 'U') IS NULL
BEGIN
  CREATE TABLE log_retention_policies (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    level NVARCHAR(40) NOT NULL,
    retention_days INT NOT NULL,
    storage_tier NVARCHAR(40) NOT NULL,
    archive_enabled BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('log_export_jobs', 'U') IS NULL
BEGIN
  CREATE TABLE log_export_jobs (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    query_text NVARCHAR(MAX) NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'queued',
    requested_by NVARCHAR(160) NULL,
    row_count INT NOT NULL DEFAULT 0,
    file_url NVARCHAR(260) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    completed_at DATETIME2 NULL
  );
END;

IF OBJECT_ID('log_ingestion_metrics', 'U') IS NULL
BEGIN
  CREATE TABLE log_ingestion_metrics (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    bucket_start DATETIME2 NOT NULL,
    total_logs INT NOT NULL DEFAULT 0,
    error_logs INT NOT NULL DEFAULT 0,
    warning_logs INT NOT NULL DEFAULT 0,
    critical_logs INT NOT NULL DEFAULT 0,
    avg_ingestion_delay_ms INT NOT NULL DEFAULT 0
  );
END;

IF OBJECT_ID('log_source_health', 'U') IS NULL
BEGIN
  CREATE TABLE log_source_health (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    source_id UNIQUEIDENTIFIER NOT NULL,
    measured_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    status NVARCHAR(40) NOT NULL,
    logs_per_minute INT NOT NULL DEFAULT 0,
    ingestion_delay_ms INT NOT NULL DEFAULT 0,
    dropped_events INT NOT NULL DEFAULT 0,
    parsing_errors INT NOT NULL DEFAULT 0,
    health_percent DECIMAL(8,2) NOT NULL DEFAULT 100
  );
END;

IF OBJECT_ID('log_archives', 'U') IS NULL
BEGIN
  CREATE TABLE log_archives (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    archive_key NVARCHAR(180) NOT NULL,
    storage_tier NVARCHAR(40) NOT NULL,
    from_timestamp DATETIME2 NOT NULL,
    to_timestamp DATETIME2 NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    compressed_size_mb DECIMAL(12,2) NOT NULL DEFAULT 0,
    status NVARCHAR(40) NOT NULL DEFAULT 'available',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_timestamp')
  CREATE INDEX ix_log_entries_timestamp ON log_entries(timestamp DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_level')
  CREATE INDEX ix_log_entries_level ON log_entries(level);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_source')
  CREATE INDEX ix_log_entries_source ON log_entries(source_name);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_service')
  CREATE INDEX ix_log_entries_service ON log_entries(service_name);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_module')
  CREATE INDEX ix_log_entries_module ON log_entries(module_name);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_request')
  CREATE INDEX ix_log_entries_request ON log_entries(request_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_trace')
  CREATE INDEX ix_log_entries_trace ON log_entries(trace_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_correlation')
  CREATE INDEX ix_log_entries_correlation ON log_entries(correlation_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_workflow')
  CREATE INDEX ix_log_entries_workflow ON log_entries(workflow_instance_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_agent')
  CREATE INDEX ix_log_entries_agent ON log_entries(agent_run_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_job')
  CREATE INDEX ix_log_entries_job ON log_entries(job_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_error_code')
  CREATE INDEX ix_log_entries_error_code ON log_entries(error_code);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_log_entries_org')
  CREATE INDEX ix_log_entries_org ON log_entries(organization_id);
