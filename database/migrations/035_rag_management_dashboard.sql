IF OBJECT_ID('dbo.vw_rag_dashboard_summary','V') IS NOT NULL DROP VIEW dbo.vw_rag_dashboard_summary;
IF OBJECT_ID('dbo.vw_rag_pipelines','V') IS NOT NULL DROP VIEW dbo.vw_rag_pipelines;
IF OBJECT_ID('dbo.vw_rag_pipeline_health','V') IS NOT NULL DROP VIEW dbo.vw_rag_pipeline_health;
IF OBJECT_ID('dbo.vw_active_rag_retrievals','V') IS NOT NULL DROP VIEW dbo.vw_active_rag_retrievals;
IF OBJECT_ID('dbo.vw_rag_retrievers','V') IS NOT NULL DROP VIEW dbo.vw_rag_retrievers;
IF OBJECT_ID('dbo.vw_rag_embedding_configuration','V') IS NOT NULL DROP VIEW dbo.vw_rag_embedding_configuration;
IF OBJECT_ID('dbo.vw_rag_vector_collections','V') IS NOT NULL DROP VIEW dbo.vw_rag_vector_collections;
IF OBJECT_ID('dbo.vw_rag_rerankers','V') IS NOT NULL DROP VIEW dbo.vw_rag_rerankers;
IF OBJECT_ID('dbo.vw_rag_query_intelligence','V') IS NOT NULL DROP VIEW dbo.vw_rag_query_intelligence;
IF OBJECT_ID('dbo.vw_rag_context_assembly','V') IS NOT NULL DROP VIEW dbo.vw_rag_context_assembly;
IF OBJECT_ID('dbo.vw_rag_grounding','V') IS NOT NULL DROP VIEW dbo.vw_rag_grounding;
IF OBJECT_ID('dbo.vw_rag_citations','V') IS NOT NULL DROP VIEW dbo.vw_rag_citations;
IF OBJECT_ID('dbo.vw_rag_retrieval_evaluations','V') IS NOT NULL DROP VIEW dbo.vw_rag_retrieval_evaluations;
IF OBJECT_ID('dbo.vw_rag_retrieval_failures','V') IS NOT NULL DROP VIEW dbo.vw_rag_retrieval_failures;
IF OBJECT_ID('dbo.vw_rag_retrieval_recoveries','V') IS NOT NULL DROP VIEW dbo.vw_rag_retrieval_recoveries;
IF OBJECT_ID('dbo.vw_rag_performance','V') IS NOT NULL DROP VIEW dbo.vw_rag_performance;
IF OBJECT_ID('dbo.vw_rag_recommendations','V') IS NOT NULL DROP VIEW dbo.vw_rag_recommendations;
IF OBJECT_ID('dbo.vw_rag_final_output_traceability','V') IS NOT NULL DROP VIEW dbo.vw_rag_final_output_traceability;

IF OBJECT_ID('dbo.rag_final_output_traceability','U') IS NOT NULL DROP TABLE dbo.rag_final_output_traceability;
IF OBJECT_ID('dbo.rag_recommendations','U') IS NOT NULL DROP TABLE dbo.rag_recommendations;
IF OBJECT_ID('dbo.rag_performance','U') IS NOT NULL DROP TABLE dbo.rag_performance;
IF OBJECT_ID('dbo.rag_recoveries','U') IS NOT NULL DROP TABLE dbo.rag_recoveries;
IF OBJECT_ID('dbo.rag_failures','U') IS NOT NULL DROP TABLE dbo.rag_failures;
IF OBJECT_ID('dbo.rag_evaluations','U') IS NOT NULL DROP TABLE dbo.rag_evaluations;
IF OBJECT_ID('dbo.rag_citations','U') IS NOT NULL DROP TABLE dbo.rag_citations;
IF OBJECT_ID('dbo.rag_grounding_results','U') IS NOT NULL DROP TABLE dbo.rag_grounding_results;
IF OBJECT_ID('dbo.rag_contexts','U') IS NOT NULL DROP TABLE dbo.rag_contexts;
IF OBJECT_ID('dbo.rag_query_intelligence','U') IS NOT NULL DROP TABLE dbo.rag_query_intelligence;
IF OBJECT_ID('dbo.rag_retrieval_requests','U') IS NOT NULL DROP TABLE dbo.rag_retrieval_requests;
IF OBJECT_ID('dbo.rag_pipelines','U') IS NOT NULL DROP TABLE dbo.rag_pipelines;
IF OBJECT_ID('dbo.rag_rerankers','U') IS NOT NULL DROP TABLE dbo.rag_rerankers;
IF OBJECT_ID('dbo.rag_vector_collections','U') IS NOT NULL DROP TABLE dbo.rag_vector_collections;
IF OBJECT_ID('dbo.rag_embedding_models','U') IS NOT NULL DROP TABLE dbo.rag_embedding_models;
IF OBJECT_ID('dbo.rag_retrievers','U') IS NOT NULL DROP TABLE dbo.rag_retrievers;
IF OBJECT_ID('dbo.rag_pipeline_categories','U') IS NOT NULL DROP TABLE dbo.rag_pipeline_categories;

CREATE TABLE dbo.rag_pipeline_categories (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_name NVARCHAR(180) NOT NULL,
  pipeline_count INT NOT NULL,
  active_pipelines INT NOT NULL,
  active_retrievals INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  average_relevance DECIMAL(8,2) NOT NULL,
  average_authority DECIMAL(8,2) NOT NULL,
  average_freshness DECIMAL(8,2) NOT NULL,
  grounding_success DECIMAL(8,2) NOT NULL,
  citation_coverage DECIMAL(8,2) NOT NULL,
  average_latency_ms INT NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  final_output_contribution DECIMAL(8,2) NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL
);

CREATE TABLE dbo.rag_retrievers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, retriever_code NVARCHAR(80) NOT NULL, retriever_name NVARCHAR(180) NOT NULL, retriever_type NVARCHAR(80) NOT NULL, status NVARCHAR(80) NOT NULL, health_percent DECIMAL(8,2) NOT NULL, average_latency_ms INT NOT NULL, success_rate DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_embedding_models (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, model_name NVARCHAR(180) NOT NULL, dimensions INT NOT NULL, version_label NVARCHAR(80) NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_vector_collections (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, collection_name NVARCHAR(180) NOT NULL, vector_store NVARCHAR(160) NOT NULL, vector_count INT NOT NULL, index_type NVARCHAR(80) NOT NULL, health_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_rerankers (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, reranker_name NVARCHAR(180) NOT NULL, model_type NVARCHAR(100) NOT NULL, status NVARCHAR(80) NOT NULL, health_percent DECIMAL(8,2) NOT NULL);

CREATE TABLE dbo.rag_pipelines (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  category_id UNIQUEIDENTIFIER NOT NULL,
  pipeline_code NVARCHAR(80) NOT NULL,
  pipeline_name NVARCHAR(220) NOT NULL,
  description NVARCHAR(600) NULL,
  scope_type NVARCHAR(80) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  current_version NVARCHAR(60) NOT NULL,
  published_version NVARCHAR(60) NOT NULL,
  retrieval_mode NVARCHAR(80) NOT NULL,
  primary_retriever NVARCHAR(180) NOT NULL,
  fallback_retriever NVARCHAR(180) NOT NULL,
  embedding_model NVARCHAR(180) NOT NULL,
  vector_collection NVARCHAR(180) NOT NULL,
  keyword_index NVARCHAR(180) NOT NULL,
  graph_source NVARCHAR(180) NOT NULL,
  sql_source NVARCHAR(180) NOT NULL,
  reranker NVARCHAR(180) NOT NULL,
  top_k INT NOT NULL,
  relevance_threshold DECIMAL(8,2) NOT NULL,
  authority_threshold DECIMAL(8,2) NOT NULL,
  freshness_threshold DECIMAL(8,2) NOT NULL,
  citation_required BIT NOT NULL,
  grounding_required BIT NOT NULL,
  assigned_agents INT NOT NULL,
  workflow_usage INT NOT NULL,
  retrievals_today INT NOT NULL,
  success_rate DECIMAL(8,2) NOT NULL,
  average_relevance DECIMAL(8,2) NOT NULL,
  average_latency_ms INT NOT NULL,
  average_cost DECIMAL(18,4) NOT NULL,
  failover_count INT NOT NULL,
  final_output_linked BIT NOT NULL,
  health_percent DECIMAL(8,2) NOT NULL,
  owner NVARCHAR(180) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  environment NVARCHAR(80) NOT NULL,
  human_attention_required BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.rag_retrieval_requests (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  pipeline_id UNIQUEIDENTIFIER NOT NULL,
  retrieval_code NVARCHAR(80) NOT NULL,
  original_query NVARCHAR(1000) NOT NULL,
  rewritten_query NVARCHAR(1000) NOT NULL,
  agent_name NVARCHAR(180) NOT NULL,
  agent_run_code NVARCHAR(120) NOT NULL,
  workflow_name NVARCHAR(220) NOT NULL,
  workflow_stage NVARCHAR(180) NOT NULL,
  status NVARCHAR(80) NOT NULL,
  detected_intent NVARCHAR(160) NOT NULL,
  retrieval_mode NVARCHAR(80) NOT NULL,
  sources NVARCHAR(500) NOT NULL,
  retriever_count INT NOT NULL,
  candidate_count INT NOT NULL,
  selected_count INT NOT NULL,
  relevance_score DECIMAL(8,2) NOT NULL,
  authority_score DECIMAL(8,2) NOT NULL,
  freshness_score DECIMAL(8,2) NOT NULL,
  grounding_score DECIMAL(8,2) NOT NULL,
  citation_count INT NOT NULL,
  context_tokens INT NOT NULL,
  latency_ms INT NOT NULL,
  actual_cost DECIMAL(18,4) NOT NULL,
  retry_count INT NOT NULL,
  failover_state NVARCHAR(100) NOT NULL,
  final_output_impact NVARCHAR(160) NOT NULL,
  organization_name NVARCHAR(180) NOT NULL,
  brand_name NVARCHAR(180) NOT NULL,
  started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  completed_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.rag_query_intelligence (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, retrieval_id UNIQUEIDENTIFIER NOT NULL, detected_intent NVARCHAR(160) NOT NULL, classified_domain NVARCHAR(160) NOT NULL, expanded_terms NVARCHAR(500) NOT NULL, decomposed_subqueries INT NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_contexts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, retrieval_id UNIQUEIDENTIFIER NOT NULL, selected_chunks INT NOT NULL, duplicate_chunks_removed INT NOT NULL, contradictions_found INT NOT NULL, compression_applied BIT NOT NULL, context_tokens INT NOT NULL, evidence_preservation DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_grounding_results (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, retrieval_id UNIQUEIDENTIFIER NOT NULL, claims_evaluated INT NOT NULL, claims_supported INT NOT NULL, unsupported_claims INT NOT NULL, grounding_score DECIMAL(8,2) NOT NULL, hallucination_risk DECIMAL(8,2) NOT NULL, validation_state NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.rag_citations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, retrieval_id UNIQUEIDENTIFIER NOT NULL, citation_count INT NOT NULL, citation_validity DECIMAL(8,2) NOT NULL, provenance_chain NVARCHAR(500) NOT NULL, source_locations NVARCHAR(500) NOT NULL);
CREATE TABLE dbo.rag_evaluations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pipeline_id UNIQUEIDENTIFIER NOT NULL, evaluation_name NVARCHAR(180) NOT NULL, evaluation_score DECIMAL(8,2) NOT NULL, grounding_score DECIMAL(8,2) NOT NULL, citation_score DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.rag_failures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pipeline_id UNIQUEIDENTIFIER NOT NULL, failure_type NVARCHAR(120) NOT NULL, failure_state NVARCHAR(80) NOT NULL, severity NVARCHAR(80) NOT NULL, detected_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.rag_recoveries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, retrieval_id UNIQUEIDENTIFIER NULL, pipeline_id UNIQUEIDENTIFIER NOT NULL, recovery_action NVARCHAR(160) NOT NULL, recovery_state NVARCHAR(80) NOT NULL, failover_used BIT NOT NULL, completed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
CREATE TABLE dbo.rag_performance (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pipeline_id UNIQUEIDENTIFIER NOT NULL, retrieval_count INT NOT NULL, success_rate DECIMAL(8,2) NOT NULL, failure_rate DECIMAL(8,2) NOT NULL, average_relevance DECIMAL(8,2) NOT NULL, grounding_success DECIMAL(8,2) NOT NULL, citation_coverage DECIMAL(8,2) NOT NULL, p95_latency_ms INT NOT NULL, output_acceptance DECIMAL(8,2) NOT NULL);
CREATE TABLE dbo.rag_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pipeline_id UNIQUEIDENTIFIER NULL, recommendation_type NVARCHAR(120) NOT NULL, title NVARCHAR(220) NOT NULL, impact NVARCHAR(120) NOT NULL, confidence_percent DECIMAL(8,2) NOT NULL, status NVARCHAR(80) NOT NULL);
CREATE TABLE dbo.rag_final_output_traceability (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, pipeline_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(220) NOT NULL, workflow_name NVARCHAR(220) NOT NULL, grounding_score DECIMAL(8,2) NOT NULL, citation_coverage DECIMAL(8,2) NOT NULL, traceability_state NVARCHAR(80) NOT NULL, business_impact NVARCHAR(180) NOT NULL);

EXEC('CREATE VIEW vw_rag_dashboard_summary AS SELECT organization_id, CAST(42 AS INT) rag_pipelines, CAST(386 AS INT) active_retrievals, CAST(97.20 AS DECIMAL(8,2)) retrieval_success_rate, CAST(95.80 AS DECIMAL(8,2)) grounding_success, CAST(94.60 AS DECIMAL(8,2)) citation_coverage, CAST(412 AS INT) average_retrieval_time_ms, CAST(0.89 AS DECIMAL(8,2)) average_relevance_score, CAST(38.40 AS DECIMAL(8,2)) hallucination_risk_reduction, CAST(42.68 AS DECIMAL(18,2)) retrieval_cost_today, CAST(0 AS INT) human_attention_required, CAST(24 AS INT) retrieval_failovers_today, CAST(18 AS INT) weak_context_queries, MAX(updated_at) last_retrieval_decision FROM rag_pipelines GROUP BY organization_id');
EXEC('CREATE VIEW vw_rag_pipelines AS SELECT p.*, c.category_name FROM rag_pipelines p JOIN rag_pipeline_categories c ON c.id=p.category_id');
EXEC('CREATE VIEW vw_rag_pipeline_health AS SELECT * FROM vw_rag_pipelines');
EXEC('CREATE VIEW vw_active_rag_retrievals AS SELECT r.*, p.pipeline_code, p.pipeline_name FROM rag_retrieval_requests r JOIN rag_pipelines p ON p.id=r.pipeline_id');
EXEC('CREATE VIEW vw_rag_retrievers AS SELECT * FROM rag_retrievers');
EXEC('CREATE VIEW vw_rag_embedding_configuration AS SELECT * FROM rag_embedding_models');
EXEC('CREATE VIEW vw_rag_vector_collections AS SELECT * FROM rag_vector_collections');
EXEC('CREATE VIEW vw_rag_rerankers AS SELECT * FROM rag_rerankers');
EXEC('CREATE VIEW vw_rag_query_intelligence AS SELECT q.*, r.organization_id, r.retrieval_code, r.original_query FROM rag_query_intelligence q JOIN rag_retrieval_requests r ON r.id=q.retrieval_id');
EXEC('CREATE VIEW vw_rag_context_assembly AS SELECT c.*, r.organization_id, r.retrieval_code FROM rag_contexts c JOIN rag_retrieval_requests r ON r.id=c.retrieval_id');
EXEC('CREATE VIEW vw_rag_grounding AS SELECT g.*, r.organization_id, r.retrieval_code FROM rag_grounding_results g JOIN rag_retrieval_requests r ON r.id=g.retrieval_id');
EXEC('CREATE VIEW vw_rag_citations AS SELECT c.*, r.organization_id, r.retrieval_code FROM rag_citations c JOIN rag_retrieval_requests r ON r.id=c.retrieval_id');
EXEC('CREATE VIEW vw_rag_retrieval_evaluations AS SELECT e.*, p.pipeline_code, p.pipeline_name FROM rag_evaluations e JOIN rag_pipelines p ON p.id=e.pipeline_id');
EXEC('CREATE VIEW vw_rag_retrieval_failures AS SELECT f.*, p.pipeline_code, p.pipeline_name FROM rag_failures f JOIN rag_pipelines p ON p.id=f.pipeline_id');
EXEC('CREATE VIEW vw_rag_retrieval_recoveries AS SELECT r.*, p.pipeline_code, p.pipeline_name FROM rag_recoveries r JOIN rag_pipelines p ON p.id=r.pipeline_id');
EXEC('CREATE VIEW vw_rag_performance AS SELECT pf.*, p.pipeline_code, p.pipeline_name FROM rag_performance pf JOIN rag_pipelines p ON p.id=pf.pipeline_id');
EXEC('CREATE VIEW vw_rag_recommendations AS SELECT rec.*, p.pipeline_code, p.pipeline_name FROM rag_recommendations rec LEFT JOIN rag_pipelines p ON p.id=rec.pipeline_id');
EXEC('CREATE VIEW vw_rag_final_output_traceability AS SELECT f.*, p.pipeline_code, p.pipeline_name FROM rag_final_output_traceability f JOIN rag_pipelines p ON p.id=f.pipeline_id');
