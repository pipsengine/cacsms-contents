import { getConnectionPool, sql } from '@cacsms/database'

export type MemoryQuery = { q?: string; category?: string; status?: string; scope?: string; classification?: string; finalOutput?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for memory management.')
  return String(row.id)
}

function whereFor(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: MemoryQuery) {
  const where = ['organization_id=@org']
  if (query.q) { request.input('q', sql.NVarChar, `%${query.q}%`); where.push('(memory_code LIKE @q OR memory_name LIKE @q OR category LIKE @q OR owner LIKE @q OR agent_name LIKE @q)') }
  ;[
    ['category', 'category'],
    ['status', 'status'],
    ['scope', 'scope_type'],
    ['classification', 'classification'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof MemoryQuery]
    if (value && value !== 'All') { request.input(key, sql.NVarChar, value); where.push(`${column}=@${key}`) }
  })
  if (query.finalOutput === 'Linked') where.push('final_output_linked=1')
  if (query.finalOutput === 'Unlinked') where.push('final_output_linked=0')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

async function byMemory(tableName: string, id: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${tableName} WHERE memory_id=@id ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const memoryManagementRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_ai_memory_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: MemoryQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = whereFor(request, query)
    const result = await request.query(`SELECT * FROM vw_ai_memory WHERE ${where} ORDER BY CASE WHEN status IN ('Stale','Reindexing','Optimizing') THEN 0 ELSE 1 END, health_percent ASC, last_access_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_ai_memory WHERE id=@id')
    return camel(result.recordset[0] ?? {})
  },
  collections: () => byOrgView('ai_memory_collections', 'health_percent ASC, memory_category'),
  embeddings: () => byOrgView('vw_ai_memory_embeddings', 'health_percent ASC, memory_code'),
  vectors: () => byOrgView('vw_ai_memory_vectors', 'performance_ms DESC'),
  graph: () => byOrgView('vw_ai_memory_graph', 'confidence_percent ASC'),
  retrieval: () => byOrgView('vw_ai_memory_retrieval', 'success_rate ASC'),
  security: () => byOrgView('vw_ai_memory_security', 'risk_score DESC'),
  metrics: () => byOrgView('vw_ai_memory_metrics', 'usage_count DESC'),
  recovery: () => byOrgView('vw_ai_memory_recovery', 'recovery_state DESC, last_recovery_at DESC'),
  finalOutput: () => byOrgView('vw_ai_memory_final_outputs', 'readiness ASC'),
  versionsFor: (id: string) => byMemory('ai_memory_versions', id),
  sourcesFor: (id: string) => byMemory('ai_memory_sources', id),
  syncFor: (id: string) => byMemory('ai_memory_sync', id, 'last_sync_at DESC'),
  retentionFor: (id: string) => byMemory('ai_memory_retention', id),
  relationshipsFor: (id: string) => byMemory('ai_memory_relationships', id),
  chunksFor: (id: string) => byMemory('ai_memory_chunks', id),
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' kind, category value FROM vw_ai_memory WHERE organization_id=@org GROUP BY category
      UNION ALL SELECT 'status', status FROM vw_ai_memory WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'scope', scope_type FROM vw_ai_memory WHERE organization_id=@org GROUP BY scope_type
      UNION ALL SELECT 'classification', classification FROM vw_ai_memory WHERE organization_id=@org GROUP BY classification
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const MemoryManagementRepository = memoryManagementRepository
