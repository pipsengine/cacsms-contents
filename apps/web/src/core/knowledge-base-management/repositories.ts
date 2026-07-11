import { getConnectionPool, sql } from '@cacsms/database'

export type KnowledgeBaseQuery = { q?: string; category?: string; sourceType?: string; status?: string; scope?: string; trustLevel?: string; brand?: string; environment?: string; ocr?: string; graph?: string; citation?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for knowledge base management.')
  return String(row.id)
}

function sourceWhere(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: KnowledgeBaseQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(source_code LIKE @q OR source_name LIKE @q OR category_name LIKE @q OR source_type LIKE @q OR owner LIKE @q)') }
  ;[['category','category_name'],['sourceType','source_type'],['status','status'],['scope','scope_type'],['trustLevel','trust_level'],['brand','brand_name'],['environment','environment']].forEach(([key, column]) => {
    const value = query[key as keyof KnowledgeBaseQuery]
    if (value && value !== 'All') { request.input(key, sql.NVarChar, value); where.push(`${column}=@${key}`) }
  })
  if (query.ocr === 'Yes') where.push('ocr_enabled=1')
  if (query.ocr === 'No') where.push('ocr_enabled=0')
  if (query.graph === 'Yes') where.push('knowledge_graph_enabled=1')
  if (query.graph === 'No') where.push('knowledge_graph_enabled=0')
  if (query.citation === 'Yes') where.push('citation_enabled=1')
  if (query.citation === 'No') where.push('citation_enabled=0')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function bySource(viewName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${viewName} WHERE source_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byObject(viewName: string, id: string) {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${viewName} WHERE knowledge_object_id=@id`)
  return result.recordset.map(camel)
}

export const knowledgeBaseRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_knowledge_base_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async sources(query: KnowledgeBaseQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = sourceWhere(request, query)
    const result = await request.query(`SELECT * FROM vw_knowledge_sources WHERE ${where} ORDER BY CASE WHEN status IN ('Authentication Failed','Degraded','Warning','Syncing') THEN 0 ELSE 1 END, authority_score ASC, source_code`)
    return result.recordset.map(camel)
  },
  async objects(query: KnowledgeBaseQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = ['organization_id=@org']
    if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(knowledge_code LIKE @q OR title LIKE @q OR source_name LIKE @q OR category LIKE @q OR topic LIKE @q OR entities LIKE @q)') }
    if (query.category && query.category !== 'All') { request.input('category', sql.NVarChar, query.category); where.push('category=@category') }
    if (query.status && query.status !== 'All') { request.input('status', sql.NVarChar, query.status); where.push('status=@status') }
    const result = await request.query(`SELECT * FROM vw_knowledge_objects WHERE ${where.join(' AND ')} ORDER BY CASE WHEN status IN ('Contradicted','Stale','Warning') THEN 0 ELSE 1 END, freshness_score ASC, retrieval_count DESC`)
    return result.recordset.map(camel)
  },
  async source(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_knowledge_sources WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  async object(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_knowledge_objects WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  categories: () => byOrgView('knowledge_source_categories', 'health_percent ASC, category_name'),
  ingestion: () => byOrgView('vw_knowledge_ingestion', 'started_at DESC'),
  validation: () => byOrgView('vw_knowledge_validation', 'score ASC'),
  duplicates: () => byOrgView('vw_knowledge_validation', 'score ASC'),
  contradictions: () => byOrgView('vw_knowledge_validation', 'score ASC'),
  entities: () => byOrgView('knowledge_entities', 'confidence_percent ASC'),
  graph: () => byOrgView('vw_knowledge_graph', 'confidence_percent ASC'),
  embeddings: () => byOrgView('knowledge_embeddings e JOIN knowledge_objects o ON o.id=e.knowledge_object_id', 'e.indexed_at DESC'),
  indexes: () => byOrgView('knowledge_embeddings e JOIN knowledge_objects o ON o.id=e.knowledge_object_id', 'e.indexed_at DESC'),
  retrievalTests: () => byOrgView('vw_knowledge_analytics', 'metric_area, metric_name'),
  citations: () => byOrgView('vw_knowledge_citations', 'validation_score ASC'),
  sync: () => byOrgView('vw_knowledge_sync', 'last_sync_at DESC'),
  analytics: () => byOrgView('vw_knowledge_analytics', 'metric_area, metric_name'),
  gaps: () => byOrgView('vw_knowledge_gaps', 'final_output_risk DESC'),
  recommendations: () => byOrgView('vw_knowledge_recommendations', 'confidence_percent DESC'),
  finalOutput: () => byOrgView('vw_knowledge_final_output_traceability', 'citation_coverage ASC'),
  objectsForSource: (id: string) => bySource('vw_knowledge_objects', id, 'updated_at DESC'),
  healthForSource: (id: string) => bySource('vw_knowledge_ingestion', id, 'started_at DESC'),
  ingestionForSource: (id: string) => bySource('vw_knowledge_ingestion', id, 'started_at DESC'),
  versionsForObject: (id: string) => byObject('knowledge_chunks', id),
  citationsForObject: (id: string) => byObject('vw_knowledge_citations', id),
  provenanceForObject: (id: string) => byObject('vw_knowledge_citations', id),
  relationshipsForObject: async (id: string) => { void id; return byOrgView('knowledge_relationships', 'confidence_percent ASC') },
  usageForObject: (id: string) => byObject('vw_knowledge_final_output_traceability', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' kind, category_name value FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'sourceType', source_type FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY source_type
      UNION ALL SELECT 'status', status FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'scope', scope_type FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY scope_type
      UNION ALL SELECT 'trustLevel', trust_level FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY trust_level
      UNION ALL SELECT 'brand', brand_name FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY brand_name
      UNION ALL SELECT 'environment', environment FROM vw_knowledge_sources WHERE organization_id=@org GROUP BY environment
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const KnowledgeBaseRepository = knowledgeBaseRepository
