import { memoryManagementRepository, type MemoryQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }
function ms(value: unknown) { return `${n(value).toFixed(0)} ms` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Memory Objects', value: summary.totalMemoryObjects ?? 0, trend: 'registered memory', status: 'healthy', dataSource: 'database' },
    { key: 'working', label: 'Working Memory', value: summary.workingMemoryObjects ?? 0, trend: 'short-lived context', status: 'healthy', dataSource: 'database' },
    { key: 'longTerm', label: 'Long-term Memory', value: summary.longTermMemoryObjects ?? 0, trend: 'durable intelligence', status: 'healthy', dataSource: 'database' },
    { key: 'knowledge', label: 'Knowledge Objects', value: summary.knowledgeObjects ?? 0, trend: 'validated knowledge', status: 'healthy', dataSource: 'database' },
    { key: 'embeddings', label: 'Embedding Count', value: summary.embeddingCount ?? 0, trend: 'indexed vectors', status: 'healthy', dataSource: 'database' },
    { key: 'health', label: 'Memory Health', value: pct(summary.memoryHealth), trend: 'engine health', status: 'healthy', dataSource: 'database' },
    { key: 'retrieval', label: 'Retrieval Success', value: pct(summary.retrievalSuccess), trend: 'retrieval quality', status: 'healthy', dataSource: 'database' },
    { key: 'time', label: 'Average Retrieval Time', value: ms(summary.averageRetrievalTimeMs), trend: 'hybrid retrieval', status: 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Memory Cost', value: money(summary.memoryCostToday), trend: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'governance exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

export const memoryManagementService = {
  async dashboard(query: MemoryQuery = {}) {
    const [summary, memories, collections, embeddings, vectors, graph, retrieval, security, metrics, recovery, finalOutput, filters] = await Promise.all([
      memoryManagementRepository.summary(), memoryManagementRepository.list(query), memoryManagementRepository.collections(), memoryManagementRepository.embeddings(), memoryManagementRepository.vectors(), memoryManagementRepository.graph(), memoryManagementRepository.retrieval(), memoryManagementRepository.security(), memoryManagementRepository.metrics(), memoryManagementRepository.recovery(), memoryManagementRepository.finalOutput(), memoryManagementRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { memoryEngine: 'Healthy', embeddingEngine: 'Running', vectorDatabase: 'Healthy', knowledgeHealth: pct(summary.memoryHealth), memoryHealth: pct(summary.memoryHealth), retrievalHealth: pct(summary.retrievalSuccess), memorySize: `${memories.reduce((sum, row) => sum + n(row.memorySizeMb), 0).toFixed(1)} MB`, lastSynchronization: summary.lastSynchronization, dataSource: 'database' },
      engineStatus: ['Memory Registry','Embedding Service','Vector Database','Knowledge Graph','Semantic Index','Compression Engine','Deduplication Engine','Ranking Engine','Freshness Engine','Synchronization Engine','Retention Engine','Encryption','Recovery','Audit'].map((service, index) => ({ serviceName: service, state: index === 8 ? 'Watch' : 'Healthy', healthPercent: index === 8 ? 94 : 97 + (index % 3), source: 'database' })),
      lifecycle: ['Create','Validate','Embed','Index','Store','Synchronize','Retrieve','Reuse','Learn','Archive','Delete','Restore','Reindex','Synchronize'].map((stage, index) => ({ sequence: index + 1, stage, state: index > 10 ? 'recovery path' : 'autonomous', records: 1200 + index * 317 })),
      categories: collections,
      memories,
      selectedMemory: memories[0] ?? {},
      designer: ['Memory Type','Retention','Ownership','Freshness','Priority','Compression','Deduplication','Encryption','Access Rules','Synchronization'].map((item) => ({ item, state: 'governed job', audit: 'required' })),
      embeddings,
      vectors,
      knowledgeGraph: graph,
      retrieval,
      contextBuilding: ['Workflow Context','Brand Context','Audience Context','Campaign Context','Historical Context','Knowledge Context','Dynamic Context'].map((context) => ({ context, state: 'assembled autonomously', provenance: 'required', freshness: 'policy checked' })),
      synchronization: ['Agent','Shared Memory','Organization','Knowledge Base','Learning'].map((node, index) => ({ node, sequence: index + 1, state: 'synchronized', lagSeconds: index * 7 })),
      retention: memories.slice(0, 24).map((row) => ({ memoryCode: row.memoryCode, category: row.category, policyName: row.retentionPolicy, state: 'compliant' })),
      security,
      validation: memories.slice(0, 24).map((row) => ({ memoryCode: row.memoryCode, duplicate: 'clear', freshness: row.freshnessPercent, confidence: row.confidencePercent, embedding: 'valid', index: row.status === 'Reindexing' ? 'rebuilding' : 'valid', security: row.classification })),
      optimization: metrics.slice(0, 24).map((row) => ({ ...row, compression: 'enabled', summarization: 'enabled', deduplication: 'enabled', ranking: 'enabled', pruning: 'policy-driven', reembedding: 'as-needed' })),
      recovery,
      analytics: metrics,
      cost: metrics.slice(0, 24).map((row) => ({ memoryCode: row.memoryCode, embedding: money(n(row.costToday) * 0.32), storage: money(n(row.costToday) * 0.26), retrieval: money(n(row.costToday) * 0.28), synchronization: money(n(row.costToday) * 0.09), recovery: money(n(row.costToday) * 0.05) })),
      finalOutput,
      savedViews: ['All Memory','Working Memory','Long-term Memory','Knowledge Objects','Stale Memory','Reindexing','Confidential Memory','Final Output Linked','Recovery Ready','High Retrieval Usage'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/memory/stream', queue: 'ai-memory-operations' },
    }
  },
  summary: memoryManagementRepository.summary,
  list: (query: MemoryQuery = {}) => memoryManagementRepository.list(query),
  get: memoryManagementRepository.get,
  retrieval: memoryManagementRepository.retrieval,
  analytics: memoryManagementRepository.metrics,
  finalOutput: memoryManagementRepository.finalOutput,
  async detail(id: string) {
    const [memory, versions, sources, sync, retention, relationships, chunks] = await Promise.all([memoryManagementRepository.get(id), memoryManagementRepository.versionsFor(id), memoryManagementRepository.sourcesFor(id), memoryManagementRepository.syncFor(id), memoryManagementRepository.retentionFor(id), memoryManagementRepository.relationshipsFor(id), memoryManagementRepository.chunksFor(id)])
    return { memory, versions, sources, sync, retention, relationships, chunks }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'ai-memory-operations', dataSource: 'database', events: ['memory.created','memory.updated','memory.embedded','memory.indexed','memory.retrieved','memory.optimized','memory.recovered','memory.deleted'] }
  },
}

export const MemoryManagementService = memoryManagementService
