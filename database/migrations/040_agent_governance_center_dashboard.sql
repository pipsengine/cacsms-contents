IF OBJECT_ID('dbo.vw_agent_governance_summary','V') IS NOT NULL DROP VIEW dbo.vw_agent_governance_summary;
IF OBJECT_ID('dbo.vw_agent_governance_policies','V') IS NOT NULL DROP VIEW dbo.vw_agent_governance_policies;
IF OBJECT_ID('dbo.vw_agent_governance_domains','V') IS NOT NULL DROP VIEW dbo.vw_agent_governance_domains;
IF OBJECT_ID('dbo.vw_agent_governance_final_output','V') IS NOT NULL DROP VIEW dbo.vw_agent_governance_final_output;

IF OBJECT_ID('dbo.agent_governance_final_output','U') IS NOT NULL DROP TABLE dbo.agent_governance_final_output;
IF OBJECT_ID('dbo.agent_governance_recommendations','U') IS NOT NULL DROP TABLE dbo.agent_governance_recommendations;
IF OBJECT_ID('dbo.agent_governance_audit_events','U') IS NOT NULL DROP TABLE dbo.agent_governance_audit_events;
IF OBJECT_ID('dbo.agent_governance_coverage','U') IS NOT NULL DROP TABLE dbo.agent_governance_coverage;
IF OBJECT_ID('dbo.agent_governance_lifecycle','U') IS NOT NULL DROP TABLE dbo.agent_governance_lifecycle;
IF OBJECT_ID('dbo.agent_governance_use_cases','U') IS NOT NULL DROP TABLE dbo.agent_governance_use_cases;
IF OBJECT_ID('dbo.agent_governance_regulatory_mappings','U') IS NOT NULL DROP TABLE dbo.agent_governance_regulatory_mappings;
IF OBJECT_ID('dbo.agent_governance_controls','U') IS NOT NULL DROP TABLE dbo.agent_governance_controls;
IF OBJECT_ID('dbo.agent_governance_risks','U') IS NOT NULL DROP TABLE dbo.agent_governance_risks;
IF OBJECT_ID('dbo.agent_governance_violations','U') IS NOT NULL DROP TABLE dbo.agent_governance_violations;
IF OBJECT_ID('dbo.agent_governance_exceptions','U') IS NOT NULL DROP TABLE dbo.agent_governance_exceptions;
IF OBJECT_ID('dbo.agent_governance_approvals','U') IS NOT NULL DROP TABLE dbo.agent_governance_approvals;
IF OBJECT_ID('dbo.agent_governance_conflicts','U') IS NOT NULL DROP TABLE dbo.agent_governance_conflicts;
IF OBJECT_ID('dbo.agent_governance_decisions','U') IS NOT NULL DROP TABLE dbo.agent_governance_decisions;
IF OBJECT_ID('dbo.agent_governance_policy_versions','U') IS NOT NULL DROP TABLE dbo.agent_governance_policy_versions;
IF OBJECT_ID('dbo.agent_governance_policies','U') IS NOT NULL DROP TABLE dbo.agent_governance_policies;
IF OBJECT_ID('dbo.agent_governance_domains','U') IS NOT NULL DROP TABLE dbo.agent_governance_domains;

CREATE TABLE dbo.agent_governance_domains (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  domain_name NVARCHAR(160) NOT NULL,
  active_policies INT NOT NULL,
  coverage_percent DECIMAL(8,2) NOT NULL,
  open_approvals INT NOT NULL,
  exceptions INT NOT NULL,
  violations INT NOT NULL,
  risk_score DECIMAL(8,2) NOT NULL,
  last_review DATETIME2 NOT NULL,
  next_review DATETIME2 NOT NULL,
  final_output_coverage DECIMAL(8,2) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL
);

CREATE TABLE dbo.agent_governance_policies (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  policy_code NVARCHAR(80) NOT NULL,
  policy_name NVARCHAR(240) NOT NULL,
  domain NVARCHAR(160) NOT NULL,
  policy_type NVARCHAR(120) NOT NULL,
  scope_text NVARCHAR(260) NOT NULL,
  version_label NVARCHAR(40) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  priority_level NVARCHAR(60) NOT NULL,
  enforcement_mode NVARCHAR(80) NOT NULL,
  risk_level NVARCHAR(80) NOT NULL,
  applies_to NVARCHAR(420) NOT NULL,
  conditions_text NVARCHAR(600) NOT NULL,
  actions_text NVARCHAR(420) NOT NULL,
  approval_requirement NVARCHAR(160) NOT NULL,
  exception_allowed BIT NOT NULL,
  violation_count INT NOT NULL,
  compliance_rate DECIMAL(8,2) NOT NULL,
  last_evaluated DATETIME2 NOT NULL,
  last_reviewed DATETIME2 NOT NULL,
  next_review DATETIME2 NOT NULL,
  owner_name NVARCHAR(160) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  environment_name NVARCHAR(80) NOT NULL,
  final_output_impact NVARCHAR(180) NOT NULL,
  business_objective NVARCHAR(500) NOT NULL,
  decision_logic NVARCHAR(900) NOT NULL,
  evidence_required NVARCHAR(500) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.agent_governance_policy_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, policy_id UNIQUEIDENTIFIER NOT NULL, version_label NVARCHAR(40) NOT NULL, change_summary NVARCHAR(400) NOT NULL, published_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_decisions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, policy_id UNIQUEIDENTIFIER NULL, decision_code NVARCHAR(80) NOT NULL, request_type NVARCHAR(160) NOT NULL, route_selected NVARCHAR(120) NOT NULL, outcome NVARCHAR(100) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, evidence_hash NVARCHAR(128) NOT NULL, decided_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_conflicts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, conflict_code NVARCHAR(80) NOT NULL, policy_a NVARCHAR(180) NOT NULL, policy_b NVARCHAR(180) NOT NULL, severity NVARCHAR(80) NOT NULL, resolution_strategy NVARCHAR(240) NOT NULL, status NVARCHAR(80) NOT NULL, detected_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_approvals (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, approval_code NVARCHAR(80) NOT NULL, request_type NVARCHAR(160) NOT NULL, requested_by NVARCHAR(160) NOT NULL, approval_role NVARCHAR(160) NOT NULL, risk_level NVARCHAR(80) NOT NULL, sla_minutes INT NOT NULL, status NVARCHAR(80) NOT NULL, evidence_status NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_exceptions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, exception_code NVARCHAR(80) NOT NULL, policy_code NVARCHAR(80) NOT NULL, owner_name NVARCHAR(160) NOT NULL, reason NVARCHAR(420) NOT NULL, compensating_controls NVARCHAR(420) NOT NULL, status NVARCHAR(80) NOT NULL, expires_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_violations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, violation_code NVARCHAR(80) NOT NULL, policy_code NVARCHAR(80) NOT NULL, severity NVARCHAR(80) NOT NULL, action_contained NVARCHAR(220) NOT NULL, incident_state NVARCHAR(80) NOT NULL, final_output_risk NVARCHAR(120) NOT NULL, detected_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_risks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, risk_code NVARCHAR(80) NOT NULL, risk_name NVARCHAR(220) NOT NULL, category NVARCHAR(120) NOT NULL, inherent_score DECIMAL(8,2) NOT NULL, residual_score DECIMAL(8,2) NOT NULL, trend NVARCHAR(80) NOT NULL, owner_name NVARCHAR(160) NOT NULL, treatment_status NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.agent_governance_controls (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, control_code NVARCHAR(80) NOT NULL, control_name NVARCHAR(220) NOT NULL, control_type NVARCHAR(100) NOT NULL, domain NVARCHAR(160) NOT NULL, effectiveness DECIMAL(8,2) NOT NULL, test_status NVARCHAR(100) NOT NULL, last_tested DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_regulatory_mappings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, regulation NVARCHAR(180) NOT NULL, requirement_name NVARCHAR(240) NOT NULL, mapped_policies INT NOT NULL, evidence_score DECIMAL(8,2) NOT NULL, coverage_percent DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_governance_use_cases (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, use_case_name NVARCHAR(220) NOT NULL, domain NVARCHAR(160) NOT NULL, autonomy_level NVARCHAR(120) NOT NULL, approval_gate NVARCHAR(120) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, governance_state NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.agent_governance_lifecycle (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, sequence_no INT NOT NULL, stage_name NVARCHAR(180) NOT NULL, request_count INT NOT NULL, allowed_count INT NOT NULL, approval_count INT NOT NULL, rejected_count INT NOT NULL, exception_count INT NOT NULL, violation_count INT NOT NULL, average_duration_ms INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL, current_blockers NVARCHAR(240) NOT NULL);
CREATE TABLE dbo.agent_governance_coverage (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, coverage_area NVARCHAR(180) NOT NULL, coverage_percent DECIMAL(8,2) NOT NULL, gaps_count INT NOT NULL, final_output_coverage DECIMAL(8,2) NOT NULL, owner_name NVARCHAR(160) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.agent_governance_audit_events (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, event_name NVARCHAR(180) NOT NULL, event_count INT NOT NULL, latest_event_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_code NVARCHAR(80) NOT NULL, title NVARCHAR(260) NOT NULL, priority_level NVARCHAR(80) NOT NULL, expected_impact NVARCHAR(260) NOT NULL, status NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL);
CREATE TABLE dbo.agent_governance_final_output (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(260) NOT NULL, governance_readiness DECIMAL(8,2) NOT NULL, unresolved_risk NVARCHAR(160) NOT NULL, blocking_policy NVARCHAR(160) NOT NULL, traceability_score DECIMAL(8,2) NOT NULL, decision_state NVARCHAR(120) NOT NULL, updated_at DATETIME2 NOT NULL);

EXEC('CREATE VIEW vw_agent_governance_policies AS SELECT * FROM agent_governance_policies');
EXEC('CREATE VIEW vw_agent_governance_domains AS SELECT * FROM agent_governance_domains');
EXEC('CREATE VIEW vw_agent_governance_final_output AS SELECT * FROM agent_governance_final_output');
EXEC('CREATE VIEW vw_agent_governance_summary AS SELECT organization_id, CAST((SELECT COUNT(*) FROM agent_governance_policies p WHERE p.organization_id=d.organization_id AND p.status IN (''Active'',''Warning'',''Conflicting'')) AS INT) active_policies, CAST(AVG(coverage_percent) AS DECIMAL(8,2)) governance_coverage, CAST((SELECT COUNT(*) FROM agent_governance_approvals a WHERE a.organization_id=d.organization_id AND a.status=''Pending'') AS INT) pending_approvals, CAST((SELECT COUNT(*) FROM agent_governance_exceptions e WHERE e.organization_id=d.organization_id AND e.status=''Active'') AS INT) open_exceptions, CAST((SELECT COUNT(*) FROM agent_governance_violations v WHERE v.organization_id=d.organization_id AND v.incident_state<>''Resolved'') AS INT) active_violations, CAST((SELECT COUNT(*) FROM agent_governance_decisions g WHERE g.organization_id=d.organization_id AND g.risk_score>=80) AS INT) high_risk_decisions, CAST(AVG(health_percent) AS DECIMAL(8,2)) policy_compliance_rate, CAST(96.8 AS DECIMAL(8,2)) auto_governed_decisions, CAST((SELECT AVG(governance_readiness) FROM agent_governance_final_output f WHERE f.organization_id=d.organization_id) AS DECIMAL(8,2)) final_output_governance_readiness, CAST(0 AS INT) human_attention_required, CAST((SELECT COUNT(*) FROM agent_governance_policies p WHERE p.organization_id=d.organization_id AND p.next_review<=DATEADD(day,14,SYSUTCDATETIME())) AS INT) policies_requiring_review, CAST((SELECT COUNT(*) FROM agent_governance_conflicts c WHERE c.organization_id=d.organization_id AND c.status=''Auto Resolved'') AS INT) conflicts_auto_resolved, MAX(last_review) last_policy_decision FROM agent_governance_domains d GROUP BY organization_id');
