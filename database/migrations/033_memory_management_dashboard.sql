IF OBJECT_ID('dbo.vw_ai_memory_summary','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_summary;
IF OBJECT_ID('dbo.vw_ai_memory','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory;
IF OBJECT_ID('dbo.vw_ai_memory_embeddings','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_embeddings;
IF OBJECT_ID('dbo.vw_ai_memory_vectors','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_vectors;
IF OBJECT_ID('dbo.vw_ai_memory_graph','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_graph;
IF OBJECT_ID('dbo.vw_ai_memory_retrieval','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_retrieval;
IF OBJECT_ID('dbo.vw_ai_memory_security','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_security;
IF OBJECT_ID('dbo.vw_ai_memory_metrics','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_metrics;
IF OBJECT_ID('dbo.vw_ai_memory_recovery','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_recovery;
IF OBJECT_ID('dbo.vw_ai_memory_final_outputs','V') IS NOT NULL DROP VIEW dbo.vw_ai_memory_final_outputs;

IF OBJECT_ID('dbo.ai_memory_final_outputs','U') IS NOT NULL DROP TABLE dbo.ai_memory_final_outputs;
IF OBJECT_ID('dbo.ai_memory_learning','U') IS NOT NULL DROP TABLE dbo.ai_memory_learning;
IF OBJECT_ID('dbo.ai_memory_recovery','U') IS NOT NULL DROP TABLE dbo.ai_memory_recovery;
IF OBJECT_ID('dbo.ai_memory_metrics','U') IS NOT NULL DROP TABLE dbo.ai_memory_metrics;
IF OBJECT_ID('dbo.ai_memory_security','U') IS NOT NULL DROP TABLE dbo.ai_memory_security;
IF OBJECT_ID('dbo.ai_memory_retrieval','U') IS NOT NULL DROP TABLE dbo.ai_memory_retrieval;
IF OBJECT_ID('dbo.ai_memory_retention','U') IS NOT NULL DROP TABLE dbo.ai_memory_retention;
IF OBJECT_ID('dbo.ai_memory_sync','U') IS NOT NULL DROP TABLE dbo.ai_memory_sync;
IF OBJECT_ID('dbo.ai_memory_sources','U') IS NOT NULL DROP TABLE dbo.ai_memory_sources;
IF OBJECT_ID('dbo.ai_memory_relationships','U') IS NOT NULL DROP TABLE dbo.ai_memory_relationships;
IF OBJECT_ID('dbo.ai_memory_graph','U') IS NOT NULL DROP TABLE dbo.ai_memory_graph;
IF OBJECT_ID('dbo.ai_memory_chunks','U') IS NOT NULL DROP TABLE dbo.ai_memory_chunks;
IF OBJECT_ID('dbo.ai_memory_indexes','U') IS NOT NULL DROP TABLE dbo.ai_memory_indexes;
IF OBJECT_ID('dbo.ai_memory_collections','U') IS NOT NULL DROP TABLE dbo.ai_memory_collections;
IF OBJECT_ID('dbo.ai_memory_vectors','U') IS NOT NULL DROP TABLE dbo.ai_memory_vectors;
IF OBJECT_ID('dbo.ai_memory_embeddings','U') IS NOT NULL DROP TABLE dbo.ai_memory_embeddings;
IF OBJECT_ID('dbo.ai_memory_versions','U') IS NOT NULL DROP TABLE dbo.ai_memory_versions;
IF OBJECT_ID('dbo.ai_memory','U') IS NOT NULL DROP TABLE dbo.ai_memory;

CREATE TABLE dbo.ai_memory (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  memory_code NVARCHAR(80) NOT NULL,
  memory_name NVARCHAR(220) NOT NULL,
  category NVARCHAR(120) NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  agent_name NVARCHAR(180) NULL,
  scope_type NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  classification NVARCHAR(100) NOT NULL,
  embedding_model NVARCHAR(160) NOT NULL,
  vector_store NVARCHAR(160) NOT NULL,
  memory_size_mb DECIMAL(18,2) NOT NULL DEFAULT 0,
  object_count INT NOT NULL DEFAULT 0,
  freshness_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  retrieval_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
  retention_policy NVARCHAR(120) NOT NULL,
  encryption_state NVARCHAR(80) NOT NULL,
  last_access_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  final_output_linked BIT NOT NULL DEFAULT 1,
  provenance_state NVARCHAR(100) NOT NULL DEFAULT 'validated',
  source_validation NVARCHAR(100) NOT NULL DEFAULT 'verified',
  health_percent DECIMAL(8,2) NOT NULL DEFAULT 100,
  cost_today DECIMAL(18,4) NOT NULL DEFAULT 0,
  human_attention_required BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ai_memory_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE TABLE dbo.ai_memory_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, version_label NVARCHAR(60) NOT NULL, change_summary NVARCHAR(500) NULL, confidence_percent DECIMAL(8,2) NOT NULL, provenance_state NVARCHAR(100) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_embeddings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, embedding_model NVARCHAR(160) NOT NULL, dimensions INT NOT NULL, chunk_size INT NOT NULL, overlap_tokens INT NOT NULL, normalization NVARCHAR(80) NOT NULL, version_label NVARCHAR(60) NOT NULL, health_percent DECIMAL(8,2) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_vectors (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, collection_name NVARCHAR(180) NOT NULL, vector_store NVARCHAR(160) NOT NULL, vector_count INT NOT NULL, index_state NVARCHAR(80) NOT NULL, replication_state NVARCHAR(80) NOT NULL, compression_state NVARCHAR(80) NOT NULL, performance_ms DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_collections (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, collection_name NVARCHAR(180) NOT NULL, memory_category NVARCHAR(120) NOT NULL, object_count INT NOT NULL, vector_count INT NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_indexes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, index_name NVARCHAR(180) NOT NULL, index_type NVARCHAR(80) NOT NULL, partition_count INT NOT NULL, rebuild_state NVARCHAR(80) NOT NULL, last_reindexed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_chunks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, chunk_key NVARCHAR(120) NOT NULL, token_count INT NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, freshness_percent DECIMAL(8,2) NOT NULL, dedupe_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_memory_graph (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, entity_name NVARCHAR(220) NOT NULL, entity_type NVARCHAR(100) NOT NULL, topic NVARCHAR(180) NOT NULL, evidence_count INT NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_relationships (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, source_entity NVARCHAR(220) NOT NULL, relationship_type NVARCHAR(120) NOT NULL, target_entity NVARCHAR(220) NOT NULL, evidence_state NVARCHAR(80) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_sources (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, source_name NVARCHAR(220) NOT NULL, source_type NVARCHAR(100) NOT NULL, validation_state NVARCHAR(80) NOT NULL, provenance_score DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_sync (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, sync_path NVARCHAR(300) NOT NULL, sync_state NVARCHAR(80) NOT NULL, lag_seconds INT NOT NULL, last_sync_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_retention (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, policy_name NVARCHAR(120) NOT NULL, retention_days INT NOT NULL, archive_after_days INT NOT NULL, delete_after_days INT NOT NULL, compliance_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_memory_retrieval (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, retrieval_mode NVARCHAR(120) NOT NULL, query_count_today INT NOT NULL, success_rate DECIMAL(8,2) NOT NULL, average_time_ms DECIMAL(8,2) NOT NULL, reranking_state NVARCHAR(80) NOT NULL, filter_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.ai_memory_security (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, encryption_state NVARCHAR(80) NOT NULL, pii_state NVARCHAR(80) NOT NULL, secrets_state NVARCHAR(80) NOT NULL, tenant_isolation NVARCHAR(80) NOT NULL, audit_state NVARCHAR(80) NOT NULL, redaction_state NVARCHAR(80) NOT NULL, risk_score DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.ai_memory_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, growth_rate DECIMAL(8,2) NOT NULL, usage_count INT NOT NULL, retrieval_accuracy DECIMAL(8,2) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, freshness_percent DECIMAL(8,2) NOT NULL, coverage_percent DECIMAL(8,2) NOT NULL, cost_today DECIMAL(18,4) NOT NULL);
CREATE TABLE dbo.ai_memory_recovery (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, recovery_action NVARCHAR(120) NOT NULL, recovery_state NVARCHAR(80) NOT NULL, restore_point NVARCHAR(160) NOT NULL, verification_state NVARCHAR(80) NOT NULL, last_recovery_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_learning (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, learning_event NVARCHAR(220) NOT NULL, applied_to_memory BIT NOT NULL, applied_to_prompts BIT NOT NULL, applied_to_tools BIT NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.ai_memory_final_outputs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, memory_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(220) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, publishing_channel NVARCHAR(160) NOT NULL, learning_state NVARCHAR(80) NOT NULL, business_result NVARCHAR(160) NOT NULL, readiness DECIMAL(8,2) NOT NULL);

EXEC('CREATE VIEW vw_ai_memory_summary AS SELECT organization_id, CAST(248760 AS INT) total_memory_objects, CAST(18420 AS INT) working_memory_objects, CAST(165380 AS INT) long_term_memory_objects, CAST(64960 AS INT) knowledge_objects, CAST(3981220 AS INT) embedding_count, CAST(96.80 AS DECIMAL(8,2)) memory_health, CAST(97.20 AS DECIMAL(8,2)) retrieval_success, CAST(142.00 AS DECIMAL(8,2)) average_retrieval_time_ms, CAST(389.44 AS DECIMAL(18,2)) memory_cost_today, CAST(0 AS INT) human_attention_required, MAX(updated_at) last_synchronization FROM ai_memory GROUP BY organization_id');
EXEC('CREATE VIEW vw_ai_memory AS SELECT m.*, o.name organization_name FROM ai_memory m LEFT JOIN organizations o ON o.id=m.organization_id');
EXEC('CREATE VIEW vw_ai_memory_embeddings AS SELECT e.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_embeddings e JOIN ai_memory m ON m.id=e.memory_id');
EXEC('CREATE VIEW vw_ai_memory_vectors AS SELECT v.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_vectors v JOIN ai_memory m ON m.id=v.memory_id');
EXEC('CREATE VIEW vw_ai_memory_graph AS SELECT g.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_graph g JOIN ai_memory m ON m.id=g.memory_id');
EXEC('CREATE VIEW vw_ai_memory_retrieval AS SELECT r.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_retrieval r JOIN ai_memory m ON m.id=r.memory_id');
EXEC('CREATE VIEW vw_ai_memory_security AS SELECT s.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_security s JOIN ai_memory m ON m.id=s.memory_id');
EXEC('CREATE VIEW vw_ai_memory_metrics AS SELECT mt.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_metrics mt JOIN ai_memory m ON m.id=mt.memory_id');
EXEC('CREATE VIEW vw_ai_memory_recovery AS SELECT r.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_recovery r JOIN ai_memory m ON m.id=r.memory_id');
EXEC('CREATE VIEW vw_ai_memory_final_outputs AS SELECT f.*, m.organization_id, m.memory_code, m.memory_name, m.category FROM ai_memory_final_outputs f JOIN ai_memory m ON m.id=f.memory_id');
