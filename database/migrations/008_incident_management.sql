SET NOCOUNT ON;

IF OBJECT_ID('incident_sources', 'U') IS NULL
BEGIN
  CREATE TABLE incident_sources (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    source_type NVARCHAR(80) NOT NULL,
    source_name NVARCHAR(160) NOT NULL,
    service_name NVARCHAR(160) NULL,
    module_name NVARCHAR(160) NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    status NVARCHAR(40) NOT NULL DEFAULT 'Healthy',
    signal_count INT NOT NULL DEFAULT 0,
    last_signal_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_services', 'U') IS NULL
BEGIN
  CREATE TABLE incident_services (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    service_name NVARCHAR(160) NOT NULL,
    service_tier NVARCHAR(80) NOT NULL DEFAULT 'Tier 2',
    owner_team NVARCHAR(160) NULL,
    health_status NVARCHAR(40) NOT NULL DEFAULT 'Operational',
    active_incident_count INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_modules', 'U') IS NULL
BEGIN
  CREATE TABLE incident_modules (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    module_name NVARCHAR(160) NOT NULL,
    module_group NVARCHAR(160) NULL,
    owner_team NVARCHAR(160) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_sla_policies', 'U') IS NULL
BEGIN
  CREATE TABLE incident_sla_policies (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    policy_name NVARCHAR(160) NOT NULL,
    severity NVARCHAR(40) NOT NULL,
    acknowledge_minutes INT NOT NULL,
    resolve_minutes INT NOT NULL,
    escalation_minutes INT NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incidents', 'U') IS NULL
BEGIN
  CREATE TABLE incidents (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    incident_number NVARCHAR(80) NOT NULL,
    title NVARCHAR(240) NOT NULL,
    description NVARCHAR(MAX) NULL,
    source_type NVARCHAR(80) NOT NULL,
    source_reference_id NVARCHAR(120) NULL,
    severity NVARCHAR(40) NOT NULL,
    priority NVARCHAR(40) NOT NULL,
    status NVARCHAR(60) NOT NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    affected_service_id UNIQUEIDENTIFIER NULL,
    affected_module_id UNIQUEIDENTIFIER NULL,
    customer_impact NVARCHAR(80) NOT NULL DEFAULT 'None',
    impact_scope NVARCHAR(160) NULL,
    assigned_team_id NVARCHAR(120) NULL,
    assigned_team_name NVARCHAR(160) NULL,
    incident_commander_id NVARCHAR(120) NULL,
    incident_commander_name NVARCHAR(160) NULL,
    acknowledged_at DATETIME2 NULL,
    investigating_at DATETIME2 NULL,
    mitigated_at DATETIME2 NULL,
    resolved_at DATETIME2 NULL,
    closed_at DATETIME2 NULL,
    sla_deadline DATETIME2 NULL,
    root_cause_status NVARCHAR(80) NOT NULL DEFAULT 'Not Started',
    resolution_summary NVARCHAR(MAX) NULL,
    detection_signal NVARCHAR(260) NULL,
    escalation_level INT NOT NULL DEFAULT 0,
    communication_status NVARCHAR(80) NOT NULL DEFAULT 'Automated updates active',
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_incidents_number UNIQUE (organization_id, incident_number)
  );
END;

IF OBJECT_ID('incident_responders', 'U') IS NULL
BEGIN
  CREATE TABLE incident_responders (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    incident_id UNIQUEIDENTIFIER NULL,
    responder_name NVARCHAR(160) NOT NULL,
    responder_role NVARCHAR(120) NOT NULL,
    team_name NVARCHAR(160) NULL,
    on_call_status NVARCHAR(60) NOT NULL DEFAULT 'Available',
    joined_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_assignments', 'U') IS NULL
BEGIN
  CREATE TABLE incident_assignments (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    assigned_team_name NVARCHAR(160) NOT NULL,
    assignee_name NVARCHAR(160) NULL,
    assignment_status NVARCHAR(60) NOT NULL DEFAULT 'Active',
    assigned_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_events', 'U') IS NULL
BEGIN
  CREATE TABLE incident_events (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    event_type NVARCHAR(100) NOT NULL,
    event_title NVARCHAR(220) NOT NULL,
    event_detail NVARCHAR(MAX) NULL,
    actor_type NVARCHAR(80) NOT NULL DEFAULT 'system',
    actor_name NVARCHAR(160) NULL,
    event_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    metadata_json NVARCHAR(MAX) NULL
  );
END;

IF OBJECT_ID('incident_status_history', 'U') IS NULL
BEGIN
  CREATE TABLE incident_status_history (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    previous_status NVARCHAR(60) NULL,
    next_status NVARCHAR(60) NOT NULL,
    changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    changed_by NVARCHAR(160) NULL
  );
END;

IF OBJECT_ID('incident_severity_history', 'U') IS NULL
BEGIN
  CREATE TABLE incident_severity_history (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    previous_severity NVARCHAR(40) NULL,
    next_severity NVARCHAR(40) NOT NULL,
    changed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    changed_by NVARCHAR(160) NULL
  );
END;

IF OBJECT_ID('incident_sla_tracking', 'U') IS NULL
BEGIN
  CREATE TABLE incident_sla_tracking (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    policy_id UNIQUEIDENTIFIER NULL,
    acknowledge_due_at DATETIME2 NULL,
    resolve_due_at DATETIME2 NULL,
    sla_status NVARCHAR(60) NOT NULL DEFAULT 'Within SLA',
    minutes_remaining INT NULL,
    breached_at DATETIME2 NULL,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_alert_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_alert_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, alert_source NVARCHAR(120) NOT NULL, alert_reference NVARCHAR(160) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_log_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_log_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, log_entry_id UNIQUEIDENTIFIER NULL, log_query NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_trace_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_trace_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, trace_id NVARCHAR(120) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_workflow_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_workflow_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, workflow_instance_id UNIQUEIDENTIFIER NULL, workflow_name NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_agent_run_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_agent_run_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, agent_run_id UNIQUEIDENTIFIER NULL, agent_name NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_job_links', 'U') IS NULL
BEGIN
  CREATE TABLE incident_job_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, job_id UNIQUEIDENTIFIER NULL, queue_name NVARCHAR(160) NULL, job_name NVARCHAR(180) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_communications', 'U') IS NULL
BEGIN
  CREATE TABLE incident_communications (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    incident_id UNIQUEIDENTIFIER NOT NULL,
    channel NVARCHAR(80) NOT NULL,
    subject NVARCHAR(220) NULL,
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(60) NOT NULL DEFAULT 'Sent',
    sent_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('incident_communication_recipients', 'U') IS NULL
BEGIN
  CREATE TABLE incident_communication_recipients (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, communication_id UNIQUEIDENTIFIER NOT NULL, recipient NVARCHAR(180) NOT NULL, delivery_status NVARCHAR(60) NOT NULL DEFAULT 'Delivered', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_bridge_sessions', 'U') IS NULL
BEGIN
  CREATE TABLE incident_bridge_sessions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, bridge_name NVARCHAR(180) NOT NULL, bridge_url NVARCHAR(500) NULL, status NVARCHAR(60) NOT NULL DEFAULT 'Open', started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), ended_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_bridge_participants', 'U') IS NULL
BEGIN
  CREATE TABLE incident_bridge_participants (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, bridge_session_id UNIQUEIDENTIFIER NOT NULL, participant_name NVARCHAR(160) NOT NULL, participant_role NVARCHAR(120) NULL, joined_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), left_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_bridge_notes', 'U') IS NULL
BEGIN
  CREATE TABLE incident_bridge_notes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, bridge_session_id UNIQUEIDENTIFIER NOT NULL, note NVARCHAR(MAX) NOT NULL, author NVARCHAR(160) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_decisions', 'U') IS NULL
BEGIN
  CREATE TABLE incident_decisions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, decision_title NVARCHAR(220) NOT NULL, decision_detail NVARCHAR(MAX) NULL, owner NVARCHAR(160) NULL, decided_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_action_items', 'U') IS NULL
BEGIN
  CREATE TABLE incident_action_items (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, title NVARCHAR(220) NOT NULL, owner NVARCHAR(160) NULL, status NVARCHAR(60) NOT NULL DEFAULT 'Open', due_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), completed_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_diagnostics', 'U') IS NULL
BEGIN
  CREATE TABLE incident_diagnostics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, diagnostic_name NVARCHAR(180) NOT NULL, status NVARCHAR(60) NOT NULL, result_summary NVARCHAR(MAX) NULL, started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), completed_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_remediations', 'U') IS NULL
BEGIN
  CREATE TABLE incident_remediations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, remediation_name NVARCHAR(180) NOT NULL, status NVARCHAR(60) NOT NULL, result_summary NVARCHAR(MAX) NULL, started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), completed_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_escalations', 'U') IS NULL
BEGIN
  CREATE TABLE incident_escalations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, escalation_level INT NOT NULL, escalated_to NVARCHAR(160) NOT NULL, reason NVARCHAR(MAX) NULL, status NVARCHAR(60) NOT NULL DEFAULT 'Active', escalated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), resolved_at DATETIME2 NULL);
END;

IF OBJECT_ID('incident_root_causes', 'U') IS NULL
BEGIN
  CREATE TABLE incident_root_causes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(60) NOT NULL, summary NVARCHAR(MAX) NULL, category NVARCHAR(120) NULL, confirmed_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_root_cause_evidence', 'U') IS NULL
BEGIN
  CREATE TABLE incident_root_cause_evidence (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, root_cause_id UNIQUEIDENTIFIER NOT NULL, evidence_type NVARCHAR(80) NOT NULL, evidence_reference NVARCHAR(240) NOT NULL, notes NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_postmortems', 'U') IS NULL
BEGIN
  CREATE TABLE incident_postmortems (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, status NVARCHAR(60) NOT NULL, summary NVARCHAR(MAX) NULL, lessons_learned NVARCHAR(MAX) NULL, owner NVARCHAR(160) NULL, due_at DATETIME2 NULL, completed_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_postmortem_approvals', 'U') IS NULL
BEGIN
  CREATE TABLE incident_postmortem_approvals (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, postmortem_id UNIQUEIDENTIFIER NOT NULL, approval_status NVARCHAR(60) NOT NULL DEFAULT 'Autonomous Review', approver NVARCHAR(160) NULL, decided_at DATETIME2 NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_tags', 'U') IS NULL
BEGIN
  CREATE TABLE incident_tags (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, tag NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_comments', 'U') IS NULL
BEGIN
  CREATE TABLE incident_comments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, comment_text NVARCHAR(MAX) NOT NULL, author NVARCHAR(160) NULL, source_type NVARCHAR(80) NOT NULL DEFAULT 'system', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_attachments', 'U') IS NULL
BEGIN
  CREATE TABLE incident_attachments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, incident_id UNIQUEIDENTIFIER NOT NULL, file_name NVARCHAR(240) NOT NULL, file_url NVARCHAR(500) NULL, content_type NVARCHAR(120) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_metrics', 'U') IS NULL
BEGIN
  CREATE TABLE incident_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, metric_date DATE NOT NULL, active_incidents INT NOT NULL DEFAULT 0, critical_incidents INT NOT NULL DEFAULT 0, resolved_incidents INT NOT NULL DEFAULT 0, mt_ack_seconds INT NOT NULL DEFAULT 0, mt_resolve_minutes INT NOT NULL DEFAULT 0, sla_breaches INT NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF OBJECT_ID('incident_saved_views', 'U') IS NULL
BEGIN
  CREATE TABLE incident_saved_views (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, name NVARCHAR(160) NOT NULL, description NVARCHAR(260) NULL, filters_json NVARCHAR(MAX) NULL, columns_json NVARCHAR(MAX) NULL, owner NVARCHAR(160) NULL, visibility NVARCHAR(40) NOT NULL DEFAULT 'Organization', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_incidents_org_status')
  CREATE INDEX ix_incidents_org_status ON incidents(organization_id, status, severity, created_at DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_incident_events_incident_time')
  CREATE INDEX ix_incident_events_incident_time ON incident_events(incident_id, event_time DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_incident_sla_tracking_status')
  CREATE INDEX ix_incident_sla_tracking_status ON incident_sla_tracking(sla_status, resolve_due_at);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_incident_sources_org_type')
  CREATE INDEX ix_incident_sources_org_type ON incident_sources(organization_id, source_type, status);
