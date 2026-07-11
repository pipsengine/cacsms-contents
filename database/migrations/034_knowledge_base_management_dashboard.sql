IF OBJECT_ID('dbo.vw_knowledge_base_summary','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_base_summary;
IF OBJECT_ID('dbo.vw_knowledge_sources','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_sources;
IF OBJECT_ID('dbo.vw_knowledge_objects','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_objects;
IF OBJECT_ID('dbo.vw_knowledge_ingestion','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_ingestion;
IF OBJECT_ID('dbo.vw_knowledge_validation','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_validation;
IF OBJECT_ID('dbo.vw_knowledge_graph','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_graph;
IF OBJECT_ID('dbo.vw_knowledge_citations','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_citations;
IF OBJECT_ID('dbo.vw_knowledge_sync','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_sync;
IF OBJECT_ID('dbo.vw_knowledge_analytics','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_analytics;
IF OBJECT_ID('dbo.vw_knowledge_gaps','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_gaps;
IF OBJECT_ID('dbo.vw_knowledge_recommendations','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_recommendations;
IF OBJECT_ID('dbo.vw_knowledge_final_output_traceability','V') IS NOT NULL DROP VIEW dbo.vw_knowledge_final_output_traceability;

IF OBJECT_ID('dbo.knowledge_final_output_traceability','U') IS NOT NULL DROP TABLE dbo.knowledge_final_output_traceability;
IF OBJECT_ID('dbo.knowledge_recommendations','U') IS NOT NULL DROP TABLE dbo.knowledge_recommendations;
IF OBJECT_ID('dbo.knowledge_gaps','U') IS NOT NULL DROP TABLE dbo.knowledge_gaps;
IF OBJECT_ID('dbo.knowledge_analytics','U') IS NOT NULL DROP TABLE dbo.knowledge_analytics;
IF OBJECT_ID('dbo.knowledge_sync','U') IS NOT NULL DROP TABLE dbo.knowledge_sync;
IF OBJECT_ID('dbo.knowledge_citations','U') IS NOT NULL DROP TABLE dbo.knowledge_citations;
IF OBJECT_ID('dbo.knowledge_relationships','U') IS NOT NULL DROP TABLE dbo.knowledge_relationships;
IF OBJECT_ID('dbo.knowledge_entities','U') IS NOT NULL DROP TABLE dbo.knowledge_entities;
IF OBJECT_ID('dbo.knowledge_embeddings','U') IS NOT NULL DROP TABLE dbo.knowledge_embeddings;
IF OBJECT_ID('dbo.knowledge_chunks','U') IS NOT NULL DROP TABLE dbo.knowledge_chunks;
IF OBJECT_ID('dbo.knowledge_validation','U') IS NOT NULL DROP TABLE dbo.knowledge_validation;
IF OBJECT_ID('dbo.knowledge_ingestion_jobs','U') IS NOT NULL DROP TABLE dbo.knowledge_ingestion_jobs;
IF OBJECT_ID('dbo.knowledge_objects','U') IS NOT NULL DROP TABLE dbo.knowledge_objects;
IF OBJECT_ID('dbo.knowledge_sources','U') IS NOT NULL DROP TABLE dbo.knowledge_sources;
IF OBJECT_ID('dbo.knowledge_source_categories','U') IS NOT NULL DROP TABLE dbo.knowledge_source_categories;

CREATE TABLE dbo.knowledge_source_categories (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_name NVARCHAR(160) NOT NULL,
  source_count INT NOT NULL,
  active_sources INT NOT NULL,
  object_count INT NOT NULL,
  trusted_percent DECIMAL(8,2) NOT NULL,
  stale_percent DECIMAL(8,2) NOT NULL,
  citation_coverage DECIMAL(8,2) NOT NULL,
  retrieval_usage INT NOT NULL,
  last_ingestion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  sync_state NVARCHAR(80) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL
);

CREATE TABLE dbo.knowledge_sources (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_id UNIQUEIDENTIFIER NOT NULL,
  source_code NVARCHAR(80) NOT NULL,
  source_name NVARCHAR(220) NOT NULL,
  description NVARCHAR(600) NULL,
  source_type NVARCHAR(120) NOT NULL,
  scope_type NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  trust_level NVARCHAR(80) NOT NULL,
  authority_score DECIMAL(8,2) NOT NULL,
  freshness_score DECIMAL(8,2) NOT NULL,
  object_count INT NOT NULL,
  document_count INT NOT NULL,
  last_ingestion DATETIME2 NOT NULL,
  next_ingestion DATETIME2 NOT NULL,
  ingestion_frequency NVARCHAR(80) NOT NULL,
  parser_name NVARCHAR(120) NOT NULL,
  ocr_enabled BIT NOT NULL,
  embedding_model NVARCHAR(160) NOT NULL,
  vector_collection NVARCHAR(180) NOT NULL,
  knowledge_graph_enabled BIT NOT NULL,
  citation_enabled BIT NOT NULL,
  provenance_coverage DECIMAL(8,2) NOT NULL,
  duplicate_rate DECIMAL(8,2) NOT NULL,
  contradiction_rate DECIMAL(8,2) NOT NULL,
  retrieval_usage INT NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  brand_name NVARCHAR(180) NOT NULL,
  environment NVARCHAR(80) NOT NULL,
  human_attention_required BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.knowledge_objects (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  source_id UNIQUEIDENTIFIER NOT NULL,
  knowledge_code NVARCHAR(80) NOT NULL,
  title NVARCHAR(260) NOT NULL,
  object_type NVARCHAR(120) NOT NULL,
  category NVARCHAR(160) NOT NULL,
  topic NVARCHAR(180) NOT NULL,
  entities NVARCHAR(600) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  version_label NVARCHAR(60) NOT NULL,
  trust_level NVARCHAR(80) NOT NULL,
  authority_score DECIMAL(8,2) NOT NULL,
  freshness_score DECIMAL(8,2) NOT NULL,
  confidence_percent DECIMAL(8,2) NOT NULL,
  citation_count INT NOT NULL,
  retrieval_count INT NOT NULL,
  chunk_count INT NOT NULL,
  embedding_status NVARCHAR(80) NOT NULL,
  index_status NVARCHAR(80) NOT NULL,
  graph_status NVARCHAR(80) NOT NULL,
  contradiction_status NVARCHAR(80) NOT NULL,
  sensitive_classification NVARCHAR(100) NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  brand_name NVARCHAR(180) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  last_accessed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  final_output_usage INT NOT NULL DEFAULT 0
);

CREATE TABLE dbo.knowledge_ingestion_jobs (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_id UNIQUEIDENTIFIER NOT NULL, object_title NVARCHAR(260) NOT NULL, stage NVARCHAR(120) NOT NULL, progress_percent DECIMAL(8,2) NOT NULL, started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(), duration_seconds INT NOT NULL, parser_name NVARCHAR(120) NOT NULL, embedding_model NVARCHAR(160) NOT NULL, retry_count INT NOT NULL, cost DECIMAL(18,4) NOT NULL, error_message NVARCHAR(500) NULL, recovery_state NVARCHAR(100) NOT NULL);
CREATE TABLE dbo.knowledge_validation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, knowledge_object_id UNIQUEIDENTIFIER NULL, source_id UNIQUEIDENTIFIER NULL, validation_area NVARCHAR(120) NOT NULL, validation_state NVARCHAR(80) NOT NULL, score DECIMAL(8,2) NOT NULL, finding NVARCHAR(500) NOT NULL, auto_resolution NVARCHAR(160) NOT NULL);
CREATE TABLE dbo.knowledge_chunks (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, knowledge_object_id UNIQUEIDENTIFIER NOT NULL, chunk_key NVARCHAR(120) NOT NULL, token_count INT NOT NULL, chunking_strategy NVARCHAR(120) NOT NULL, quality_score DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_embeddings (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, knowledge_object_id UNIQUEIDENTIFIER NOT NULL, embedding_model NVARCHAR(160) NOT NULL, dimensions INT NOT NULL, vector_collection NVARCHAR(180) NOT NULL, embedding_status NVARCHAR(80) NOT NULL, indexed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.knowledge_entities (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, entity_name NVARCHAR(220) NOT NULL, entity_type NVARCHAR(120) NOT NULL, source_count INT NOT NULL, object_count INT NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_relationships (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_entity NVARCHAR(220) NOT NULL, relationship_type NVARCHAR(120) NOT NULL, target_entity NVARCHAR(220) NOT NULL, evidence_count INT NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_citations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, knowledge_object_id UNIQUEIDENTIFIER NOT NULL, citation_format NVARCHAR(120) NOT NULL, citation_state NVARCHAR(80) NOT NULL, provenance_chain NVARCHAR(500) NOT NULL, usage_count INT NOT NULL, validation_score DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_sync (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, source_id UNIQUEIDENTIFIER NOT NULL, sync_target NVARCHAR(160) NOT NULL, sync_state NVARCHAR(80) NOT NULL, lag_seconds INT NOT NULL, last_sync_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.knowledge_analytics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, metric_area NVARCHAR(120) NOT NULL, metric_name NVARCHAR(160) NOT NULL, metric_value DECIMAL(18,2) NOT NULL, trend NVARCHAR(120) NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_gaps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, gap_title NVARCHAR(220) NOT NULL, domain NVARCHAR(160) NOT NULL, severity NVARCHAR(80) NOT NULL, recommended_source NVARCHAR(220) NOT NULL, resolution_state NVARCHAR(100) NOT NULL, final_output_risk DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.knowledge_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, impact NVARCHAR(120) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.knowledge_final_output_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, knowledge_object_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(220) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, citation_coverage DECIMAL(8,2) NOT NULL, provenance_state NVARCHAR(80) NOT NULL, traceability_state NVARCHAR(80) NOT NULL, business_impact NVARCHAR(180) NOT NULL);

EXEC('CREATE VIEW vw_knowledge_base_summary AS SELECT organization_id, CAST(64 AS INT) knowledge_sources, CAST(1840000 AS INT) knowledge_objects, CAST(246842 AS INT) indexed_documents, CAST(96.80 AS DECIMAL(8,2)) trusted_knowledge, CAST(2.40 AS DECIMAL(8,2)) stale_knowledge, CAST(94.60 AS DECIMAL(8,2)) citation_coverage, CAST(97.30 AS DECIMAL(8,2)) retrieval_success_rate, CAST(420 AS INT) average_retrieval_time_ms, CAST(128.44 AS DECIMAL(18,2)) knowledge_cost_this_month, CAST(0 AS INT) human_attention_required, CAST(38 AS INT) contradictions_detected, CAST(1284 AS INT) auto_resolved_duplicates, MAX(updated_at) last_synchronization FROM knowledge_sources GROUP BY organization_id');
EXEC('CREATE VIEW vw_knowledge_sources AS SELECT s.*, c.category_name FROM knowledge_sources s JOIN knowledge_source_categories c ON c.id=s.category_id');
EXEC('CREATE VIEW vw_knowledge_objects AS SELECT o.*, s.source_code, s.source_name FROM knowledge_objects o JOIN knowledge_sources s ON s.id=o.source_id');
EXEC('CREATE VIEW vw_knowledge_ingestion AS SELECT j.*, s.source_code, s.source_name FROM knowledge_ingestion_jobs j JOIN knowledge_sources s ON s.id=j.source_id');
EXEC('CREATE VIEW vw_knowledge_validation AS SELECT * FROM knowledge_validation');
EXEC('CREATE VIEW vw_knowledge_graph AS SELECT organization_id, entity_name AS node_name, entity_type AS node_type, object_count, confidence_percent FROM knowledge_entities UNION ALL SELECT organization_id, CONCAT(source_entity, '' -> '', target_entity), relationship_type, evidence_count, confidence_percent FROM knowledge_relationships');
EXEC('CREATE VIEW vw_knowledge_citations AS SELECT c.*, o.knowledge_code, o.title FROM knowledge_citations c JOIN knowledge_objects o ON o.id=c.knowledge_object_id');
EXEC('CREATE VIEW vw_knowledge_sync AS SELECT sy.*, s.source_code, s.source_name FROM knowledge_sync sy JOIN knowledge_sources s ON s.id=sy.source_id');
EXEC('CREATE VIEW vw_knowledge_analytics AS SELECT * FROM knowledge_analytics');
EXEC('CREATE VIEW vw_knowledge_gaps AS SELECT * FROM knowledge_gaps');
EXEC('CREATE VIEW vw_knowledge_recommendations AS SELECT * FROM knowledge_recommendations');
EXEC('CREATE VIEW vw_knowledge_final_output_traceability AS SELECT f.*, o.knowledge_code, o.title FROM knowledge_final_output_traceability f JOIN knowledge_objects o ON o.id=f.knowledge_object_id');
