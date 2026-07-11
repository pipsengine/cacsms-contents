IF OBJECT_ID('dbo.vw_agent_security_summary','V') IS NOT NULL DROP VIEW dbo.vw_agent_security_summary;
IF OBJECT_ID('dbo.vw_agent_security_identities','V') IS NOT NULL DROP VIEW dbo.vw_agent_security_identities;
IF OBJECT_ID('dbo.vw_agent_security_domains','V') IS NOT NULL DROP VIEW dbo.vw_agent_security_domains;
IF OBJECT_ID('dbo.vw_agent_security_final_output','V') IS NOT NULL DROP VIEW dbo.vw_agent_security_final_output;

IF OBJECT_ID('dbo.agent_security_final_output','U') IS NOT NULL DROP TABLE dbo.agent_security_final_output;
IF OBJECT_ID('dbo.agent_security_recommendations','U') IS NOT NULL DROP TABLE dbo.agent_security_recommendations;
IF OBJECT_ID('dbo.agent_security_audit_events','U') IS NOT NULL DROP TABLE dbo.agent_security_audit_events;
IF OBJECT_ID('dbo.agent_security_risks','U') IS NOT NULL DROP TABLE dbo.agent_security_risks;
IF OBJECT_ID('dbo.agent_security_controls','U') IS NOT NULL DROP TABLE dbo.agent_security_controls;
IF OBJECT_ID('dbo.agent_security_vulnerabilities','U') IS NOT NULL DROP TABLE dbo.agent_security_vulnerabilities;
IF OBJECT_ID('dbo.agent_security_playbooks','U') IS NOT NULL DROP TABLE dbo.agent_security_playbooks;
IF OBJECT_ID('dbo.agent_security_containment','U') IS NOT NULL DROP TABLE dbo.agent_security_containment;
IF OBJECT_ID('dbo.agent_security_incidents','U') IS NOT NULL DROP TABLE dbo.agent_security_incidents;
IF OBJECT_ID('dbo.agent_security_events','U') IS NOT NULL DROP TABLE dbo.agent_security_events;
IF OBJECT_ID('dbo.agent_security_threat_intel','U') IS NOT NULL DROP TABLE dbo.agent_security_threat_intel;
IF OBJECT_ID('dbo.agent_security_behavior','U') IS NOT NULL DROP TABLE dbo.agent_security_behavior;
IF OBJECT_ID('dbo.agent_security_dlp','U') IS NOT NULL DROP TABLE dbo.agent_security_dlp;
IF OBJECT_ID('dbo.agent_security_secrets','U') IS NOT NULL DROP TABLE dbo.agent_security_secrets;
IF OBJECT_ID('dbo.agent_security_permissions','U') IS NOT NULL DROP TABLE dbo.agent_security_permissions;
IF OBJECT_ID('dbo.agent_security_zero_trust','U') IS NOT NULL DROP TABLE dbo.agent_security_zero_trust;
IF OBJECT_ID('dbo.agent_security_lifecycle','U') IS NOT NULL DROP TABLE dbo.agent_security_lifecycle;
IF OBJECT_ID('dbo.agent_security_identities','U') IS NOT NULL DROP TABLE dbo.agent_security_identities;
IF OBJECT_ID('dbo.agent_security_domains','U') IS NOT NULL DROP TABLE dbo.agent_security_domains;

CREATE TABLE dbo.agent_security_domains (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  domain_name NVARCHAR(160) NOT NULL,
  assets_count INT NOT NULL,
  active_findings INT NOT NULL,
  critical_findings INT NOT NULL,
  incidents INT NOT NULL,
  control_coverage DECIMAL(8,2) NOT NULL,
  compliance_percent DECIMAL(8,2) NOT NULL,
  risk_score DECIMAL(8,2) NOT NULL,
  last_scan DATETIME2 NOT NULL,
  final_output_coverage DECIMAL(8,2) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL
);

CREATE TABLE dbo.agent_security_identities (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  identity_code NVARCHAR(80) NOT NULL,
  identity_name NVARCHAR(220) NOT NULL,
  identity_type NVARCHAR(120) NOT NULL,
  linked_agent NVARCHAR(180) NOT NULL,
  service_account NVARCHAR(180) NOT NULL,
  role_name NVARCHAR(140) NOT NULL,
  team_name NVARCHAR(140) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  authentication_method NVARCHAR(120) NOT NULL,
  trust_level NVARCHAR(80) NOT NULL,
  risk_score DECIMAL(8,2) NOT NULL,
  permission_count INT NOT NULL,
  excessive_permissions INT NOT NULL,
  active_sessions INT NOT NULL,
  last_authentication DATETIME2 NOT NULL,
  last_activity DATETIME2 NOT NULL,
  secret_status NVARCHAR(80) NOT NULL,
  organization_scope NVARCHAR(160) NOT NULL,
  brand_scope NVARCHAR(160) NOT NULL,
  environment_scope NVARCHAR(80) NOT NULL,
  owner_name NVARCHAR(160) NOT NULL,
  final_output_access NVARCHAR(120) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.agent_security_lifecycle (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(180) NOT NULL, event_count INT NOT NULL, active_incidents INT NOT NULL, contained_events INT NOT NULL, failed_containment INT NOT NULL, average_response_ms INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL, current_blockers NVARCHAR(240) NOT NULL);
CREATE TABLE dbo.agent_security_zero_trust (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_code NVARCHAR(80) NOT NULL, identity_code NVARCHAR(80) NOT NULL, resource_name NVARCHAR(220) NOT NULL, decision_result NVARCHAR(100) NOT NULL, reason NVARCHAR(420) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, decided_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_permissions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, permission_code NVARCHAR(160) NOT NULL, permission_name NVARCHAR(220) NOT NULL, category NVARCHAR(120) NOT NULL, sensitivity NVARCHAR(80) NOT NULL, assigned_identities INT NOT NULL, excessive_findings INT NOT NULL, review_status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_security_secrets (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, secret_code NVARCHAR(80) NOT NULL, secret_name NVARCHAR(220) NOT NULL, secret_type NVARCHAR(120) NOT NULL, owner_name NVARCHAR(160) NOT NULL, rotation_state NVARCHAR(100) NOT NULL, days_to_expiry INT NOT NULL, risk_level NVARCHAR(80) NOT NULL, last_rotated DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_dlp (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, dlp_code NVARCHAR(80) NOT NULL, source_name NVARCHAR(220) NOT NULL, data_classification NVARCHAR(120) NOT NULL, action_taken NVARCHAR(180) NOT NULL, final_output_impact NVARCHAR(160) NOT NULL, detected_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_behavior (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, entity_name NVARCHAR(220) NOT NULL, anomaly_type NVARCHAR(160) NOT NULL, baseline_score DECIMAL(8,2) NOT NULL, observed_score DECIMAL(8,2) NOT NULL, risk_level NVARCHAR(80) NOT NULL, detected_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_threat_intel (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, intel_code NVARCHAR(80) NOT NULL, threat_name NVARCHAR(220) NOT NULL, threat_type NVARCHAR(120) NOT NULL, confidence DECIMAL(8,2) NOT NULL, mapped_controls INT NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_security_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, event_code NVARCHAR(80) NOT NULL, event_type NVARCHAR(160) NOT NULL, identity_code NVARCHAR(80) NOT NULL, asset_name NVARCHAR(220) NOT NULL, severity NVARCHAR(80) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, containment_state NVARCHAR(120) NOT NULL, evidence_hash NVARCHAR(128) NOT NULL, occurred_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_incidents (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, incident_code NVARCHAR(80) NOT NULL, title NVARCHAR(260) NOT NULL, severity NVARCHAR(80) NOT NULL, status NVARCHAR(100) NOT NULL, contained BIT NOT NULL, affected_assets INT NOT NULL, final_output_risk NVARCHAR(160) NOT NULL, opened_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_containment (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, containment_code NVARCHAR(80) NOT NULL, incident_code NVARCHAR(80) NOT NULL, action_name NVARCHAR(220) NOT NULL, target_name NVARCHAR(220) NOT NULL, state NVARCHAR(100) NOT NULL, executed_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_playbooks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, playbook_code NVARCHAR(80) NOT NULL, playbook_name NVARCHAR(220) NOT NULL, trigger_type NVARCHAR(160) NOT NULL, automation_level NVARCHAR(120) NOT NULL, success_rate DECIMAL(8,2) NOT NULL, last_executed DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_vulnerabilities (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, vulnerability_code NVARCHAR(80) NOT NULL, asset_name NVARCHAR(220) NOT NULL, vulnerability_type NVARCHAR(160) NOT NULL, severity NVARCHAR(80) NOT NULL, remediation_state NVARCHAR(120) NOT NULL, detected_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_controls (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, control_code NVARCHAR(80) NOT NULL, control_name NVARCHAR(220) NOT NULL, control_type NVARCHAR(100) NOT NULL, domain NVARCHAR(160) NOT NULL, effectiveness DECIMAL(8,2) NOT NULL, test_status NVARCHAR(100) NOT NULL, last_tested DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_risks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, risk_code NVARCHAR(80) NOT NULL, risk_name NVARCHAR(220) NOT NULL, category NVARCHAR(120) NOT NULL, inherent_score DECIMAL(8,2) NOT NULL, residual_score DECIMAL(8,2) NOT NULL, treatment_status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.agent_security_audit_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, event_name NVARCHAR(180) NOT NULL, event_count INT NOT NULL, latest_event_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_code NVARCHAR(80) NOT NULL, title NVARCHAR(260) NOT NULL, priority_level NVARCHAR(80) NOT NULL, expected_impact NVARCHAR(260) NOT NULL, status NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_security_final_output (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(260) NOT NULL, security_readiness DECIMAL(8,2) NOT NULL, unresolved_risk NVARCHAR(160) NOT NULL, blocking_control NVARCHAR(160) NOT NULL, traceability_score DECIMAL(8,2) NOT NULL, decision_state NVARCHAR(120) NOT NULL, updated_at DATETIME2 NOT NULL);

EXEC('CREATE VIEW vw_agent_security_identities AS SELECT * FROM agent_security_identities');
EXEC('CREATE VIEW vw_agent_security_domains AS SELECT * FROM agent_security_domains');
EXEC('CREATE VIEW vw_agent_security_final_output AS SELECT * FROM agent_security_final_output');
EXEC('CREATE VIEW vw_agent_security_summary AS SELECT organization_id, CAST(96.8 AS DECIMAL(8,2)) ai_security_posture, CAST((SELECT COUNT(*) FROM agent_security_identities i WHERE i.organization_id=d.organization_id) AS INT) active_ai_identities, CAST((SELECT SUM(excessive_permissions) FROM agent_security_identities i WHERE i.organization_id=d.organization_id) AS INT) excessive_permission_findings, CAST((SELECT COUNT(*) FROM agent_security_incidents s WHERE s.organization_id=d.organization_id AND s.status<>''Resolved'') AS INT) open_security_incidents, CAST((SELECT COUNT(*) FROM agent_security_events e WHERE e.organization_id=d.organization_id AND e.severity=''Critical'') AS INT) critical_threats, CAST((SELECT COUNT(*) FROM agent_security_events e WHERE e.organization_id=d.organization_id AND e.event_type=''Prompt Injection'') AS INT) prompt_injection_attempts, CAST((SELECT COUNT(*) FROM agent_security_secrets s WHERE s.organization_id=d.organization_id AND s.days_to_expiry<=14) AS INT) secrets_expiring_soon, CAST(94.2 AS DECIMAL(8,2)) autonomous_containment_rate, CAST((SELECT AVG(security_readiness) FROM agent_security_final_output f WHERE f.organization_id=d.organization_id) AS DECIMAL(8,2)) final_output_security_readiness, CAST(1 AS INT) human_attention_required, CAST((SELECT COUNT(*) FROM agent_security_events e WHERE e.organization_id=d.organization_id AND e.containment_state=''Blocked'') AS INT) blocked_unauthorized_actions, CAST((SELECT COUNT(*) FROM agent_security_events e WHERE e.organization_id=d.organization_id AND e.event_type=''High-Risk Tool Call'') AS INT) high_risk_tool_calls, MAX(last_scan) last_security_decision FROM agent_security_domains d GROUP BY organization_id');
