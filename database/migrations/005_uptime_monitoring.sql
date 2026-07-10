IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '005_uptime_monitoring')
BEGIN
CREATE TABLE uptime_monitors (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(180) NOT NULL,
  description NVARCHAR(1000) NULL,
  monitor_type NVARCHAR(80) NOT NULL,
  service_category NVARCHAR(120) NOT NULL,
  endpoint_resource NVARCHAR(500) NOT NULL,
  http_method NVARCHAR(12) NULL,
  expected_status_code INT NULL,
  expected_response_content NVARCHAR(500) NULL,
  region NVARCHAR(120) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'Unknown',
  uptime_24h DECIMAL(8,4) NOT NULL DEFAULT 0,
  uptime_7d DECIMAL(8,4) NOT NULL DEFAULT 0,
  uptime_30d DECIMAL(8,4) NOT NULL DEFAULT 0,
  response_time_ms INT NOT NULL DEFAULT 0,
  last_outage_at DATETIME2 NULL,
  downtime_minutes INT NOT NULL DEFAULT 0,
  check_frequency_seconds INT NOT NULL DEFAULT 60,
  timeout_seconds INT NOT NULL DEFAULT 10,
  retry_count INT NOT NULL DEFAULT 2,
  failure_threshold INT NOT NULL DEFAULT 3,
  recovery_threshold INT NOT NULL DEFAULT 2,
  sla_target DECIMAL(8,4) NOT NULL DEFAULT 99.90,
  owner NVARCHAR(160) NULL,
  alert_policy NVARCHAR(160) NULL,
  last_checked_at DATETIME2 NULL,
  is_enabled BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_uptime_monitors_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE uptime_monitor_regions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  region NVARCHAR(120) NOT NULL,
  availability_percent DECIMAL(8,4) NOT NULL DEFAULT 0,
  avg_latency_ms INT NOT NULL DEFAULT 0,
  failed_checks INT NOT NULL DEFAULT 0,
  degraded_services INT NOT NULL DEFAULT 0,
  last_incident_at DATETIME2 NULL,
  health_status NVARCHAR(40) NOT NULL DEFAULT 'Operational',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_monitor_regions_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_checks (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  region NVARCHAR(120) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'queued',
  correlation_id NVARCHAR(120) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_checks_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_check_results (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  check_id UNIQUEIDENTIFIER NULL,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  region NVARCHAR(120) NOT NULL,
  started_at DATETIME2 NOT NULL,
  completed_at DATETIME2 NOT NULL,
  success BIT NOT NULL,
  status_code INT NULL,
  response_time_ms INT NOT NULL,
  error_code NVARCHAR(120) NULL,
  error_message NVARCHAR(MAX) NULL,
  response_summary NVARCHAR(1000) NULL,
  correlation_id NVARCHAR(120) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_check_results_check FOREIGN KEY (check_id) REFERENCES uptime_checks(id),
  CONSTRAINT fk_uptime_check_results_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_daily_summaries (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  summary_date DATE NOT NULL,
  uptime_percent DECIMAL(8,4) NOT NULL,
  downtime_minutes INT NOT NULL DEFAULT 0,
  avg_response_time_ms INT NOT NULL DEFAULT 0,
  incident_count INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_daily_summaries_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_incidents (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  incident_key NVARCHAR(80) NOT NULL,
  severity NVARCHAR(40) NOT NULL,
  status NVARCHAR(40) NOT NULL,
  started_at DATETIME2 NOT NULL,
  resolved_at DATETIME2 NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  root_cause NVARCHAR(500) NULL,
  user_impact NVARCHAR(500) NULL,
  sla_impact NVARCHAR(160) NULL,
  assigned_team NVARCHAR(160) NULL,
  postmortem_status NVARCHAR(80) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_incidents_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_uptime_incidents_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_sla_policies (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  sla_target DECIMAL(8,4) NOT NULL,
  allowed_downtime_minutes INT NOT NULL,
  owner NVARCHAR(160) NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'active',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  CONSTRAINT fk_uptime_sla_policies_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE uptime_sla_results (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_uptime DECIMAL(8,4) NOT NULL,
  actual_downtime_minutes INT NOT NULL DEFAULT 0,
  remaining_allowance_minutes INT NOT NULL DEFAULT 0,
  breach_status NVARCHAR(40) NOT NULL,
  current_risk NVARCHAR(40) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_uptime_sla_results_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE maintenance_windows (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(180) NOT NULL,
  start_time DATETIME2 NOT NULL,
  end_time DATETIME2 NOT NULL,
  expected_impact NVARCHAR(500) NULL,
  owner NVARCHAR(160) NULL,
  approval_status NVARCHAR(40) NOT NULL DEFAULT 'pending',
  notification_status NVARCHAR(40) NOT NULL DEFAULT 'not_sent',
  current_state NVARCHAR(40) NOT NULL DEFAULT 'upcoming',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  CONSTRAINT fk_maintenance_windows_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE maintenance_services (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  maintenance_window_id UNIQUEIDENTIFIER NOT NULL,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_maintenance_services_window FOREIGN KEY (maintenance_window_id) REFERENCES maintenance_windows(id),
  CONSTRAINT fk_maintenance_services_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE monitor_alert_rules (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  rule_name NVARCHAR(160) NOT NULL,
  threshold_type NVARCHAR(80) NOT NULL,
  threshold_value DECIMAL(18,4) NOT NULL,
  severity NVARCHAR(40) NOT NULL,
  is_enabled BIT NOT NULL DEFAULT 1,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_monitor_alert_rules_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE TABLE monitor_status_history (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  monitor_id UNIQUEIDENTIFIER NOT NULL,
  status NVARCHAR(40) NOT NULL,
  started_at DATETIME2 NOT NULL,
  ended_at DATETIME2 NULL,
  response_time_ms INT NULL,
  incident_reference NVARCHAR(120) NULL,
  error_message NVARCHAR(500) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_monitor_status_history_monitor FOREIGN KEY (monitor_id) REFERENCES uptime_monitors(id)
);

CREATE INDEX ix_uptime_monitors_org_status ON uptime_monitors(organization_id, status, service_category);
CREATE INDEX ix_uptime_results_monitor_created ON uptime_check_results(monitor_id, created_at DESC);
CREATE INDEX ix_uptime_incidents_monitor_started ON uptime_incidents(monitor_id, started_at DESC);

INSERT INTO schema_migrations(version) VALUES ('005_uptime_monitoring');
END;
