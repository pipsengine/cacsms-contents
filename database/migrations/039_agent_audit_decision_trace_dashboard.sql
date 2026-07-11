IF OBJECT_ID('dbo.vw_audit_dashboard_summary','V') IS NOT NULL DROP VIEW dbo.vw_audit_dashboard_summary;
IF OBJECT_ID('dbo.vw_ai_decisions','V') IS NOT NULL DROP VIEW dbo.vw_ai_decisions;
IF OBJECT_ID('dbo.vw_ai_audit_logs','V') IS NOT NULL DROP VIEW dbo.vw_ai_audit_logs;
IF OBJECT_ID('dbo.vw_ai_decision_replay','V') IS NOT NULL DROP VIEW dbo.vw_ai_decision_replay;
IF OBJECT_ID('dbo.vw_ai_forensics','V') IS NOT NULL DROP VIEW dbo.vw_ai_forensics;
IF OBJECT_ID('dbo.vw_ai_compliance','V') IS NOT NULL DROP VIEW dbo.vw_ai_compliance;
IF OBJECT_ID('dbo.vw_ai_final_output_trace','V') IS NOT NULL DROP VIEW dbo.vw_ai_final_output_trace;

IF OBJECT_ID('dbo.ai_final_output_trace','U') IS NOT NULL DROP TABLE dbo.ai_final_output_trace;
IF OBJECT_ID('dbo.ai_traceability','U') IS NOT NULL DROP TABLE dbo.ai_traceability;
IF OBJECT_ID('dbo.ai_compliance','U') IS NOT NULL DROP TABLE dbo.ai_compliance;
IF OBJECT_ID('dbo.ai_retention','U') IS NOT NULL DROP TABLE dbo.ai_retention;
IF OBJECT_ID('dbo.ai_signatures','U') IS NOT NULL DROP TABLE dbo.ai_signatures;
IF OBJECT_ID('dbo.ai_hashes','U') IS NOT NULL DROP TABLE dbo.ai_hashes;
IF OBJECT_ID('dbo.ai_integrity','U') IS NOT NULL DROP TABLE dbo.ai_integrity;
IF OBJECT_ID('dbo.ai_forensics','U') IS NOT NULL DROP TABLE dbo.ai_forensics;
IF OBJECT_ID('dbo.ai_audit_events','U') IS NOT NULL DROP TABLE dbo.ai_audit_events;
IF OBJECT_ID('dbo.ai_audit_logs','U') IS NOT NULL DROP TABLE dbo.ai_audit_logs;
IF OBJECT_ID('dbo.ai_decision_replay','U') IS NOT NULL DROP TABLE dbo.ai_decision_replay;
IF OBJECT_ID('dbo.ai_decision_graph','U') IS NOT NULL DROP TABLE dbo.ai_decision_graph;
IF OBJECT_ID('dbo.ai_decision_versions','U') IS NOT NULL DROP TABLE dbo.ai_decision_versions;
IF OBJECT_ID('dbo.ai_decision_dependencies','U') IS NOT NULL DROP TABLE dbo.ai_decision_dependencies;
IF OBJECT_ID('dbo.ai_decision_evidence','U') IS NOT NULL DROP TABLE dbo.ai_decision_evidence;
IF OBJECT_ID('dbo.ai_decision_reasoning','U') IS NOT NULL DROP TABLE dbo.ai_decision_reasoning;
IF OBJECT_ID('dbo.ai_decision_scores','U') IS NOT NULL DROP TABLE dbo.ai_decision_scores;
IF OBJECT_ID('dbo.ai_decision_steps','U') IS NOT NULL DROP TABLE dbo.ai_decision_steps;
IF OBJECT_ID('dbo.ai_decisions','U') IS NOT NULL DROP TABLE dbo.ai_decisions;

CREATE TABLE dbo.ai_decisions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  decision_code NVARCHAR(80) NOT NULL,
  decision_type NVARCHAR(120) NOT NULL,
  agent_name NVARCHAR(180) NOT NULL,
  workflow_name NVARCHAR(220) NOT NULL,
  objective NVARCHAR(420) NOT NULL,
  reason NVARCHAR(600) NOT NULL,
  confidence DECIMAL(8,2) NOT NULL,
  risk DECIMAL(8,2) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  outcome NVARCHAR(160) NOT NULL,
  business_impact NVARCHAR(220) NOT NULL,
  trace_completeness DECIMAL(8,2) NOT NULL,
  explainability_score DECIMAL(8,2) NOT NULL,
  evidence_integrity DECIMAL(8,2) NOT NULL,
  compliance_score DECIMAL(8,2) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_decision_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(120) NOT NULL, component NVARCHAR(180) NOT NULL, state NVARCHAR(80) NOT NULL, duration_ms INT NOT NULL, evidence_count INT NOT NULL);
CREATE TABLE dbo.ai_decision_scores (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, score_name NVARCHAR(120) NOT NULL, score_value DECIMAL(8,2) NOT NULL, weight_value DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_decision_reasoning (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, why_text NVARCHAR(800) NOT NULL, why_not_text NVARCHAR(800) NOT NULL, alternatives NVARCHAR(800) NOT NULL, dependencies NVARCHAR(800) NOT NULL);
CREATE TABLE dbo.ai_decision_evidence (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, evidence_type NVARCHAR(120) NOT NULL, evidence_title NVARCHAR(220) NOT NULL, evidence_location NVARCHAR(420) NOT NULL, hash_value NVARCHAR(128) NOT NULL, integrity_state NVARCHAR(80) NOT NULL, retained_until DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_decision_dependencies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, dependency_type NVARCHAR(120) NOT NULL, dependency_name NVARCHAR(220) NOT NULL, version_label NVARCHAR(80) NOT NULL, trace_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_decision_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, prompt_version NVARCHAR(80) NOT NULL, model_name NVARCHAR(160) NOT NULL, provider_name NVARCHAR(160) NOT NULL, tool_versions NVARCHAR(420) NOT NULL);
CREATE TABLE dbo.ai_decision_graph (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, from_node NVARCHAR(160) NOT NULL, to_node NVARCHAR(160) NOT NULL, edge_reason NVARCHAR(300) NOT NULL);
CREATE TABLE dbo.ai_decision_replay (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, second_offset INT NOT NULL, replay_stage NVARCHAR(140) NOT NULL, actor NVARCHAR(180) NOT NULL, event_text NVARCHAR(500) NOT NULL, replay_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_audit_logs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, decision_id UNIQUEIDENTIFIER NULL, occurred_at DATETIME2 NOT NULL, actor NVARCHAR(180) NOT NULL, component NVARCHAR(180) NOT NULL, action_name NVARCHAR(180) NOT NULL, old_value NVARCHAR(420) NOT NULL, new_value NVARCHAR(420) NOT NULL, reason NVARCHAR(420) NOT NULL, evidence NVARCHAR(420) NOT NULL, approval NVARCHAR(120) NOT NULL, result NVARCHAR(120) NOT NULL);
CREATE TABLE dbo.ai_audit_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, event_name NVARCHAR(160) NOT NULL, event_count INT NOT NULL, last_event_at DATETIME2 NOT NULL);
CREATE TABLE dbo.ai_forensics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, investigation_code NVARCHAR(80) NOT NULL, incident NVARCHAR(220) NOT NULL, evidence_count INT NOT NULL, logs_count INT NOT NULL, prompts_count INT NOT NULL, models_count INT NOT NULL, outputs_count INT NOT NULL, recovery_state NVARCHAR(120) NOT NULL, business_impact NVARCHAR(220) NOT NULL);
CREATE TABLE dbo.ai_integrity (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, artifact_name NVARCHAR(220) NOT NULL, integrity_score DECIMAL(8,2) NOT NULL, verification_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_hashes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, artifact_name NVARCHAR(220) NOT NULL, hash_value NVARCHAR(128) NOT NULL, hash_algorithm NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_signatures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, artifact_name NVARCHAR(220) NOT NULL, signature_value NVARCHAR(220) NOT NULL, signature_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_retention (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, retention_policy NVARCHAR(120) NOT NULL, retention_period_days INT NOT NULL, legal_hold BIT NOT NULL, archive_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_compliance (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, policy_name NVARCHAR(180) NOT NULL, approval_state NVARCHAR(120) NOT NULL, audit_state NVARCHAR(120) NOT NULL, traceability_score DECIMAL(8,2) NOT NULL, evidence_score DECIMAL(8,2) NOT NULL, retention_state NVARCHAR(80) NOT NULL, legal_hold BIT NOT NULL);
CREATE TABLE dbo.ai_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, trace_name NVARCHAR(220) NOT NULL, objective_linked BIT NOT NULL, workflow_linked BIT NOT NULL, agent_linked BIT NOT NULL, prompt_linked BIT NOT NULL, model_linked BIT NOT NULL, tool_linked BIT NOT NULL, retrieval_linked BIT NOT NULL, output_linked BIT NOT NULL);
CREATE TABLE dbo.ai_final_output_trace (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(260) NOT NULL, decision_id UNIQUEIDENTIFIER NOT NULL, objective NVARCHAR(420) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, agent_name NVARCHAR(180) NOT NULL, prompt_version NVARCHAR(80) NOT NULL, model_name NVARCHAR(160) NOT NULL, provider_name NVARCHAR(160) NOT NULL, traceability_score DECIMAL(8,2) NOT NULL, business_outcome NVARCHAR(220) NOT NULL);

EXEC('CREATE VIEW vw_ai_decisions AS SELECT * FROM ai_decisions');
EXEC('CREATE VIEW vw_ai_audit_logs AS SELECT * FROM ai_audit_logs');
EXEC('CREATE VIEW vw_ai_decision_replay AS SELECT r.*, d.decision_code, d.workflow_name FROM ai_decision_replay r JOIN ai_decisions d ON d.id=r.decision_id');
EXEC('CREATE VIEW vw_ai_forensics AS SELECT * FROM ai_forensics');
EXEC('CREATE VIEW vw_ai_compliance AS SELECT * FROM ai_compliance');
EXEC('CREATE VIEW vw_ai_final_output_trace AS SELECT f.*, d.decision_code, d.decision_type FROM ai_final_output_trace f JOIN ai_decisions d ON d.id=f.decision_id');
EXEC('CREATE VIEW vw_audit_dashboard_summary AS SELECT organization_id, COUNT(*) total_decisions, CAST((SELECT COUNT(*) FROM ai_audit_logs a WHERE a.organization_id=d.organization_id) AS INT) audit_records, COUNT(*) decision_traces, CAST(AVG(trace_completeness) AS DECIMAL(8,2)) trace_completeness, CAST(AVG(explainability_score) AS DECIMAL(8,2)) explainability_score, CAST(AVG(evidence_integrity) AS DECIMAL(8,2)) evidence_integrity, CAST(AVG(compliance_score) AS DECIMAL(8,2)) compliance_score, CAST(AVG(trace_completeness) AS DECIMAL(8,2)) audit_coverage, CAST((SELECT AVG(traceability_score) FROM ai_final_output_trace f WHERE f.organization_id=d.organization_id) AS DECIMAL(8,2)) final_output_traceability, CAST(0 AS INT) human_attention_required, MAX(created_at) last_decision_at FROM ai_decisions d GROUP BY organization_id');
