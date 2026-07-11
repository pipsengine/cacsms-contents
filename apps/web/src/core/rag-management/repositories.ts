import { getConnectionPool, sql } from '@cacsms/database'

export type RagQuery = { q?: string; category?: string; scope?: string; status?: string; retrievalMode?: string; retriever?: string; embeddingModel?: string; vectorCollection?: string; reranker?: string; citation?: string; grounding?: string; environment?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for RAG management.')
  return String(row.id)
}

function whereFor(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: RagQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(pipeline_code LIKE @q OR pipeline_name LIKE @q OR category_name LIKE @q OR retrieval_mode LIKE @q OR owner LIKE @q)') }
  ;[['category','category_name'],['scope','scope_type'],['status','status'],['retrievalMode','retrieval_mode'],['retriever','primary_retriever'],['embeddingModel','embedding_model'],['vectorCollection','vector_collection'],['reranker','reranker'],['environment','environment']].forEach(([key, column]) => {
    const value = query[key as keyof RagQuery]
    if (value && value !== 'All') { request.input(key, sql.NVarChar, value); where.push(`${column}=@${key}`) }
  })
  if (query.citation === 'Yes') where.push('citation_required=1')
  if (query.citation === 'No') where.push('citation_required=0')
  if (query.grounding === 'Yes') where.push('grounding_required=1')
  if (query.grounding === 'No') where.push('grounding_required=0')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byPipeline(viewName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${viewName} WHERE pipeline_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byRetrieval(viewName: string, id: string) {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${viewName} WHERE retrieval_id=@id`)
  return result.recordset.map(camel)
}

export const ragManagementRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_rag_dashboard_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async pipelines(query: RagQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = whereFor(request, query)
    const result = await request.query(`SELECT * FROM vw_rag_pipelines WHERE ${where} ORDER BY CASE WHEN status IN ('Failing','Degraded','Warning') THEN 0 ELSE 1 END, health_percent ASC, retrievals_today DESC`)
    return result.recordset.map(camel)
  },
  async retrievals(query: RagQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(retrieval_code LIKE @q OR original_query LIKE @q OR rewritten_query LIKE @q OR agent_name LIKE @q OR workflow_name LIKE @q OR pipeline_name LIKE @q)') }
    const result = await request.query(`SELECT * FROM vw_active_rag_retrievals WHERE ${where.join(' AND ')} ORDER BY CASE WHEN status IN ('Failed','Failing Over','Retrying','Degraded','Blocked') THEN 0 ELSE 1 END, started_at DESC`)
    return result.recordset.map(camel)
  },
  async pipeline(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_rag_pipelines WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  async retrieval(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_active_rag_retrievals WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('rag_pipeline_categories', 'health_percent ASC, category_name'),
  retrievers: () => byOrgView('vw_rag_retrievers', 'health_percent ASC'),
  embeddings: () => byOrgView('vw_rag_embedding_configuration', 'health_percent ASC'),
  vectorCollections: () => byOrgView('vw_rag_vector_collections', 'health_percent ASC'),
  rerankers: () => byOrgView('vw_rag_rerankers', 'health_percent ASC'),
  queryIntelligence: () => byOrgView('vw_rag_query_intelligence', 'confidence_percent ASC'),
  contextAssembly: () => byOrgView('vw_rag_context_assembly', 'evidence_preservation ASC'),
  grounding: () => byOrgView('vw_rag_grounding', 'grounding_score ASC'),
  citations: () => byOrgView('vw_rag_citations', 'citation_validity ASC'),
  evaluations: () => byOrgView('vw_rag_retrieval_evaluations', 'evaluation_score ASC'),
  failures: () => byOrgView('vw_rag_retrieval_failures', 'detected_at DESC'),
  recoveries: () => byOrgView('vw_rag_retrieval_recoveries', 'completed_at DESC'),
  performance: () => byOrgView('vw_rag_performance', 'success_rate ASC'),
  recommendations: () => byOrgView('vw_rag_recommendations', 'confidence_percent DESC'),
  finalOutput: () => byOrgView('vw_rag_final_output_traceability', 'grounding_score ASC'),
  versionsFor: (id: string) => byPipeline('vw_rag_retrieval_evaluations', id),
  validationFor: (id: string) => byPipeline('vw_rag_retrieval_evaluations', id),
  evaluationsFor: (id: string) => byPipeline('vw_rag_retrieval_evaluations', id),
  performanceFor: (id: string) => byPipeline('vw_rag_performance', id),
  impactFor: (id: string) => byPipeline('vw_rag_final_output_traceability', id),
  traceFor: (id: string) => byRetrieval('vw_rag_query_intelligence', id),
  contextFor: (id: string) => byRetrieval('vw_rag_context_assembly', id),
  citationsFor: (id: string) => byRetrieval('vw_rag_citations', id),
  groundingFor: (id: string) => byRetrieval('vw_rag_grounding', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' kind, category_name value FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'scope', scope_type FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY scope_type
      UNION ALL SELECT 'status', status FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'retrievalMode', retrieval_mode FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY retrieval_mode
      UNION ALL SELECT 'retriever', primary_retriever FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY primary_retriever
      UNION ALL SELECT 'embeddingModel', embedding_model FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY embedding_model
      UNION ALL SELECT 'vectorCollection', vector_collection FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY vector_collection
      UNION ALL SELECT 'reranker', reranker FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY reranker
      UNION ALL SELECT 'environment', environment FROM vw_rag_pipelines WHERE organization_id=@org GROUP BY environment
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const RagManagementRepository = ragManagementRepository
