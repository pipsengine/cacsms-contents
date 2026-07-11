SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID('dbo.vw_prompt_final_outputs','V') IS NOT NULL DROP VIEW dbo.vw_prompt_final_outputs;
IF OBJECT_ID('dbo.vw_prompt_deployments','V') IS NOT NULL DROP VIEW dbo.vw_prompt_deployments;
IF OBJECT_ID('dbo.vw_prompt_security','V') IS NOT NULL DROP VIEW dbo.vw_prompt_security;
IF OBJECT_ID('dbo.vw_prompt_metrics','V') IS NOT NULL DROP VIEW dbo.vw_prompt_metrics;
IF OBJECT_ID('dbo.vw_prompt_validation','V') IS NOT NULL DROP VIEW dbo.vw_prompt_validation;
IF OBJECT_ID('dbo.vw_prompt_ab_tests','V') IS NOT NULL DROP VIEW dbo.vw_prompt_ab_tests;
IF OBJECT_ID('dbo.vw_prompt_simulations','V') IS NOT NULL DROP VIEW dbo.vw_prompt_simulations;
IF OBJECT_ID('dbo.vw_prompt_tests','V') IS NOT NULL DROP VIEW dbo.vw_prompt_tests;
IF OBJECT_ID('dbo.vw_prompt_rag','V') IS NOT NULL DROP VIEW dbo.vw_prompt_rag;
IF OBJECT_ID('dbo.vw_prompt_memory','V') IS NOT NULL DROP VIEW dbo.vw_prompt_memory;
IF OBJECT_ID('dbo.vw_prompt_providers','V') IS NOT NULL DROP VIEW dbo.vw_prompt_providers;
IF OBJECT_ID('dbo.vw_prompt_models','V') IS NOT NULL DROP VIEW dbo.vw_prompt_models;
IF OBJECT_ID('dbo.vw_prompt_tools','V') IS NOT NULL DROP VIEW dbo.vw_prompt_tools;
IF OBJECT_ID('dbo.vw_prompt_context','V') IS NOT NULL DROP VIEW dbo.vw_prompt_context;
IF OBJECT_ID('dbo.vw_prompt_variables','V') IS NOT NULL DROP VIEW dbo.vw_prompt_variables;
IF OBJECT_ID('dbo.vw_prompt_versions','V') IS NOT NULL DROP VIEW dbo.vw_prompt_versions;
IF OBJECT_ID('dbo.vw_prompt_categories','V') IS NOT NULL DROP VIEW dbo.vw_prompt_categories;
IF OBJECT_ID('dbo.vw_prompts','V') IS NOT NULL DROP VIEW dbo.vw_prompts;
IF OBJECT_ID('dbo.vw_prompt_management_summary','V') IS NOT NULL DROP VIEW dbo.vw_prompt_management_summary;

IF OBJECT_ID('dbo.ai_prompt_final_outputs','U') IS NOT NULL DROP TABLE dbo.ai_prompt_final_outputs;
IF OBJECT_ID('dbo.ai_prompt_deployments','U') IS NOT NULL DROP TABLE dbo.ai_prompt_deployments;
IF OBJECT_ID('dbo.ai_prompt_security','U') IS NOT NULL DROP TABLE dbo.ai_prompt_security;
IF OBJECT_ID('dbo.ai_prompt_recoveries','U') IS NOT NULL DROP TABLE dbo.ai_prompt_recoveries;
IF OBJECT_ID('dbo.ai_prompt_costs','U') IS NOT NULL DROP TABLE dbo.ai_prompt_costs;
IF OBJECT_ID('dbo.ai_prompt_metrics','U') IS NOT NULL DROP TABLE dbo.ai_prompt_metrics;
IF OBJECT_ID('dbo.ai_prompt_validation','U') IS NOT NULL DROP TABLE dbo.ai_prompt_validation;
IF OBJECT_ID('dbo.ai_prompt_ab_tests','U') IS NOT NULL DROP TABLE dbo.ai_prompt_ab_tests;
IF OBJECT_ID('dbo.ai_prompt_simulations','U') IS NOT NULL DROP TABLE dbo.ai_prompt_simulations;
IF OBJECT_ID('dbo.ai_prompt_tests','U') IS NOT NULL DROP TABLE dbo.ai_prompt_tests;
IF OBJECT_ID('dbo.ai_prompt_rag','U') IS NOT NULL DROP TABLE dbo.ai_prompt_rag;
IF OBJECT_ID('dbo.ai_prompt_memory','U') IS NOT NULL DROP TABLE dbo.ai_prompt_memory;
IF OBJECT_ID('dbo.ai_prompt_providers','U') IS NOT NULL DROP TABLE dbo.ai_prompt_providers;
IF OBJECT_ID('dbo.ai_prompt_models','U') IS NOT NULL DROP TABLE dbo.ai_prompt_models;
IF OBJECT_ID('dbo.ai_prompt_tools','U') IS NOT NULL DROP TABLE dbo.ai_prompt_tools;
IF OBJECT_ID('dbo.ai_prompt_context','U') IS NOT NULL DROP TABLE dbo.ai_prompt_context;
IF OBJECT_ID('dbo.ai_prompt_variables','U') IS NOT NULL DROP TABLE dbo.ai_prompt_variables;
IF OBJECT_ID('dbo.ai_prompt_versions','U') IS NOT NULL DROP TABLE dbo.ai_prompt_versions;
IF OBJECT_ID('dbo.ai_prompts','U') IS NOT NULL DROP TABLE dbo.ai_prompts;
IF OBJECT_ID('dbo.ai_prompt_categories','U') IS NOT NULL DROP TABLE dbo.ai_prompt_categories;

CREATE TABLE dbo.ai_prompt_categories (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ai_prompt_categories PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_name NVARCHAR(160) NOT NULL,
  total_prompts INT NOT NULL DEFAULT 0,
  active_prompts INT NOT NULL DEFAULT 0,
  average_confidence DECIMAL(8,2) NOT NULL DEFAULT 0,
  success_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  security_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  final_output_success DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_prompts (
  id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ai_prompts PRIMARY KEY DEFAULT NEWID(),
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_id UNIQUEIDENTIFIER NULL,
  prompt_code NVARCHAR(80) NOT NULL,
  prompt_name NVARCHAR(220) NOT NULL,
  purpose NVARCHAR(600) NOT NULL,
  current_version NVARCHAR(40) NOT NULL,
  status NVARCHAR(60) NOT NULL,
  assigned_agents INT NOT NULL DEFAULT 0,
  supported_models INT NOT NULL DEFAULT 0,
  supported_providers INT NOT NULL DEFAULT 0,
  average_tokens INT NOT NULL DEFAULT 0,
  average_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
  average_confidence DECIMAL(8,2) NOT NULL DEFAULT 0,
  acceptance_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  execution_count INT NOT NULL DEFAULT 0,
  success_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  final_output_state NVARCHAR(80) NOT NULL,
  prompt_text NVARCHAR(MAX) NOT NULL,
  system_instructions NVARCHAR(MAX) NULL,
  examples NVARCHAR(MAX) NULL,
  output_format NVARCHAR(400) NULL,
  human_attention_required BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.ai_prompt_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, version_label NVARCHAR(60) NOT NULL, version_state NVARCHAR(60) NOT NULL, quality_score DECIMAL(8,2) NOT NULL, token_delta INT NOT NULL, rollback_ready BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_variables (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, variable_name NVARCHAR(160) NOT NULL, variable_type NVARCHAR(120) NOT NULL, required BIT NOT NULL, source NVARCHAR(160) NOT NULL, validation_state NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_context (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, context_block NVARCHAR(180) NOT NULL, compression DECIMAL(8,2) NOT NULL, relevance DECIMAL(8,2) NOT NULL, freshness DECIMAL(8,2) NOT NULL, overflow_handling NVARCHAR(140) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_tools (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, tool_name NVARCHAR(160) NOT NULL, permission_state NVARCHAR(80) NOT NULL, invocation_mode NVARCHAR(100) NOT NULL, validation_state NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_models (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, model_name NVARCHAR(160) NOT NULL, compatibility_state NVARCHAR(80) NOT NULL, max_context INT NOT NULL, latency_ms INT NOT NULL, quality DECIMAL(8,2) NOT NULL, cost_score DECIMAL(8,2) NOT NULL, reliability DECIMAL(8,2) NOT NULL, recommended BIT NOT NULL DEFAULT 0);
CREATE TABLE dbo.ai_prompt_providers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, provider_name NVARCHAR(120) NOT NULL, compatibility_state NVARCHAR(80) NOT NULL, fallback_rank INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_prompt_memory (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, memory_type NVARCHAR(160) NOT NULL, orchestration_state NVARCHAR(80) NOT NULL, usage_percent DECIMAL(8,2) NOT NULL, retrieval_confidence DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_prompt_rag (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, knowledge_source NVARCHAR(180) NOT NULL, embedding_model NVARCHAR(160) NOT NULL, retriever NVARCHAR(120) NOT NULL, top_k INT NOT NULL, reranking_state NVARCHAR(80) NOT NULL, provenance DECIMAL(8,2) NOT NULL, confidence DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_prompt_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, test_name NVARCHAR(180) NOT NULL, test_type NVARCHAR(120) NOT NULL, result_state NVARCHAR(80) NOT NULL, quality_score DECIMAL(8,2) NOT NULL, regression_safe BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_simulations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, simulation_name NVARCHAR(180) NOT NULL, provider NVARCHAR(120) NOT NULL, model_name NVARCHAR(160) NOT NULL, confidence DECIMAL(8,2) NOT NULL, tokens INT NOT NULL, cost DECIMAL(18,4) NOT NULL, recovery_state NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_ab_tests (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, version_a NVARCHAR(60) NOT NULL, version_b NVARCHAR(60) NOT NULL, traffic_split NVARCHAR(40) NOT NULL, winner NVARCHAR(60) NOT NULL, success_lift DECIMAL(8,2) NOT NULL, cost_delta DECIMAL(8,2) NOT NULL, recommendation NVARCHAR(220) NOT NULL);
CREATE TABLE dbo.ai_prompt_validation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, validation_area NVARCHAR(160) NOT NULL, validation_state NVARCHAR(80) NOT NULL, issue_count INT NOT NULL, final_output_safe BIT NOT NULL DEFAULT 1, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, metric_date DATE NOT NULL DEFAULT CONVERT(DATE,SYSUTCDATETIME()), success DECIMAL(8,2) NOT NULL, failures INT NOT NULL, confidence DECIMAL(8,2) NOT NULL, tokens INT NOT NULL, latency_ms INT NOT NULL, cost DECIMAL(18,4) NOT NULL, acceptance DECIMAL(8,2) NOT NULL, quality DECIMAL(8,2) NOT NULL, revision_rate DECIMAL(8,2) NOT NULL, recovery DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_prompt_costs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, provider NVARCHAR(120) NOT NULL, model_name NVARCHAR(160) NOT NULL, average_cost DECIMAL(18,4) NOT NULL, token_savings DECIMAL(8,2) NOT NULL, optimization_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_prompt_recoveries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, recovery_rule NVARCHAR(220) NOT NULL, trigger_condition NVARCHAR(220) NOT NULL, recovery_state NVARCHAR(80) NOT NULL, success_rate DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_prompt_security (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, security_area NVARCHAR(160) NOT NULL, scan_state NVARCHAR(80) NOT NULL, risk_score DECIMAL(8,2) NOT NULL, auto_mitigation NVARCHAR(220) NOT NULL);
CREATE TABLE dbo.ai_prompt_deployments (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, environment NVARCHAR(80) NOT NULL, deployment_state NVARCHAR(80) NOT NULL, deployed_version NVARCHAR(60) NOT NULL, canary_percent INT NOT NULL, deployed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_prompt_final_outputs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, prompt_id UNIQUEIDENTIFIER NOT NULL, agent_name NVARCHAR(180) NOT NULL, workflow_name NVARCHAR(180) NOT NULL, output_name NVARCHAR(180) NOT NULL, validation_state NVARCHAR(80) NOT NULL, publishing_state NVARCHAR(80) NOT NULL, analytics_state NVARCHAR(80) NOT NULL, business_result NVARCHAR(220) NOT NULL, readiness DECIMAL(8,2) NOT NULL);

EXEC('CREATE VIEW vw_prompt_management_summary AS
SELECT organization_id, COUNT(*) total_prompts,
SUM(CASE WHEN status=''Production'' THEN 1 ELSE 0 END) active_prompts,
SUM(CASE WHEN status=''Draft'' THEN 1 ELSE 0 END) draft_prompts,
AVG(success_rate) prompt_success_rate,
AVG(average_confidence) average_prompt_confidence,
AVG(average_cost) average_prompt_cost,
AVG(CAST(average_tokens AS DECIMAL(18,2))) average_tokens,
AVG(acceptance_rate) prompt_acceptance_rate,
AVG(CASE WHEN final_output_state=''validated'' THEN success_rate ELSE success_rate-4 END) final_output_success,
SUM(CASE WHEN human_attention_required=1 THEN 1 ELSE 0 END) human_attention_required,
MAX(updated_at) last_prompt_deployment
FROM dbo.ai_prompts GROUP BY organization_id');
EXEC('CREATE VIEW vw_prompts AS SELECT p.*, c.category_name FROM dbo.ai_prompts p LEFT JOIN dbo.ai_prompt_categories c ON c.id=p.category_id');
EXEC('CREATE VIEW vw_prompt_categories AS SELECT * FROM dbo.ai_prompt_categories');
EXEC('CREATE VIEW vw_prompt_versions AS SELECT v.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_versions v JOIN dbo.ai_prompts p ON p.id=v.prompt_id');
EXEC('CREATE VIEW vw_prompt_variables AS SELECT v.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_variables v JOIN dbo.ai_prompts p ON p.id=v.prompt_id');
EXEC('CREATE VIEW vw_prompt_context AS SELECT x.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_context x JOIN dbo.ai_prompts p ON p.id=x.prompt_id');
EXEC('CREATE VIEW vw_prompt_tools AS SELECT t.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_tools t JOIN dbo.ai_prompts p ON p.id=t.prompt_id');
EXEC('CREATE VIEW vw_prompt_models AS SELECT m.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_models m JOIN dbo.ai_prompts p ON p.id=m.prompt_id');
EXEC('CREATE VIEW vw_prompt_providers AS SELECT pr.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_providers pr JOIN dbo.ai_prompts p ON p.id=pr.prompt_id');
EXEC('CREATE VIEW vw_prompt_memory AS SELECT m.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_memory m JOIN dbo.ai_prompts p ON p.id=m.prompt_id');
EXEC('CREATE VIEW vw_prompt_rag AS SELECT r.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_rag r JOIN dbo.ai_prompts p ON p.id=r.prompt_id');
EXEC('CREATE VIEW vw_prompt_tests AS SELECT t.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_tests t JOIN dbo.ai_prompts p ON p.id=t.prompt_id');
EXEC('CREATE VIEW vw_prompt_simulations AS SELECT s.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_simulations s JOIN dbo.ai_prompts p ON p.id=s.prompt_id');
EXEC('CREATE VIEW vw_prompt_ab_tests AS SELECT a.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_ab_tests a JOIN dbo.ai_prompts p ON p.id=a.prompt_id');
EXEC('CREATE VIEW vw_prompt_validation AS SELECT v.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_validation v JOIN dbo.ai_prompts p ON p.id=v.prompt_id');
EXEC('CREATE VIEW vw_prompt_metrics AS SELECT m.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_metrics m JOIN dbo.ai_prompts p ON p.id=m.prompt_id');
EXEC('CREATE VIEW vw_prompt_security AS SELECT s.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_security s JOIN dbo.ai_prompts p ON p.id=s.prompt_id');
EXEC('CREATE VIEW vw_prompt_deployments AS SELECT d.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_deployments d JOIN dbo.ai_prompts p ON p.id=d.prompt_id');
EXEC('CREATE VIEW vw_prompt_final_outputs AS SELECT f.*, p.organization_id, p.prompt_code, p.prompt_name FROM dbo.ai_prompt_final_outputs f JOIN dbo.ai_prompts p ON p.id=f.prompt_id');
