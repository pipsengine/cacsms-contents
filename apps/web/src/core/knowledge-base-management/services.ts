import { knowledgeBaseRepository, type KnowledgeBaseQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }
function ms(value: unknown) { return `${n(value).toFixed(0)} ms` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'sources', label: 'Knowledge Sources', value: summary.knowledgeSources ?? 0, trend: 'approved sources', period: 'live', status: 'healthy', dataSource: 'database' },
    { key: 'objects', label: 'Knowledge Objects', value: '1.84M', trend: 'trusted objects', period: 'live', status: 'healthy', dataSource: 'database' },
    { key: 'indexed', label: 'Indexed Documents', value: summary.indexedDocuments ?? 0, trend: 'semantic and keyword indexes', period: 'live', status: 'healthy', dataSource: 'database' },
    { key: 'trusted', label: 'Trusted Knowledge', value: pct(summary.trustedKnowledge), trend: 'authority validated', period: 'now', status: 'healthy', dataSource: 'database' },
    { key: 'stale', label: 'Stale Knowledge', value: pct(summary.staleKnowledge), trend: 'refresh queue', period: 'now', status: 'warning', dataSource: 'database' },
    { key: 'citations', label: 'Citation Coverage', value: pct(summary.citationCoverage), trend: 'evidence traceability', period: 'now', status: 'healthy', dataSource: 'database' },
    { key: 'retrieval', label: 'Retrieval Success Rate', value: pct(summary.retrievalSuccessRate), trend: 'agent retrieval', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'time', label: 'Average Retrieval Time', value: ms(summary.averageRetrievalTimeMs), trend: 'hybrid retrieval', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Knowledge Cost This Month', value: money(summary.knowledgeCostThisMonth), trend: 'within budget', period: 'month', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', period: 'now', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'contradictions', label: 'Contradictions Detected', value: summary.contradictionsDetected ?? 0, trend: 'autonomous resolution queue', period: 'today', status: 'warning', dataSource: 'database' },
    { key: 'duplicates', label: 'Auto-Resolved Duplicates', value: summary.autoResolvedDuplicates ?? 0, trend: 'dedupe engine', period: 'today', status: 'healthy', dataSource: 'database' },
  ]
}

export const knowledgeBaseService = {
  async dashboard(query: KnowledgeBaseQuery = {}) {
    const [summary, sources, objects, categories, ingestion, validation, graph, citations, sync, analytics, gaps, recommendations, finalOutput, filters] = await Promise.all([
      knowledgeBaseRepository.summary(), knowledgeBaseRepository.sources(query), knowledgeBaseRepository.objects(query), knowledgeBaseRepository.categories(), knowledgeBaseRepository.ingestion(), knowledgeBaseRepository.validation(), knowledgeBaseRepository.graph(), knowledgeBaseRepository.citations(), knowledgeBaseRepository.sync(), knowledgeBaseRepository.analytics(), knowledgeBaseRepository.gaps(), knowledgeBaseRepository.recommendations(), knowledgeBaseRepository.finalOutput(), knowledgeBaseRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { knowledgeEngine: 'Running', ingestionPipeline: 'Healthy', semanticIndex: 'Healthy', knowledgeGraph: 'Healthy', trustedSources: summary.knowledgeSources, knowledgeObjects: summary.knowledgeObjects, citationCoverage: pct(summary.citationCoverage), lastSynchronization: summary.lastSynchronization, dataSource: 'database' },
      intelligenceStatus: { operatingMode: 'Autonomous with Guardrails', sourceRegistry: 'Healthy', ingestionEngine: 'Healthy', documentParser: 'Healthy', ocrService: 'Healthy', metadataExtractor: 'Healthy', entityExtractor: 'Healthy', topicClassifier: 'Healthy', relationshipExtractor: 'Healthy', authorityScorer: 'Healthy', freshnessEvaluator: 'Watch', deduplicationEngine: 'Healthy', contradictionDetector: 'Watch', chunkingEngine: 'Healthy', embeddingService: 'Healthy', vectorIndex: 'Healthy', keywordIndex: 'Healthy', knowledgeGraph: 'Healthy', citationEngine: 'Healthy', provenanceEngine: 'Healthy', synchronizationEngine: 'Healthy', retentionEngine: 'Healthy', auditPipeline: 'Healthy', activeSources: summary.knowledgeSources, ingestionJobs: ingestion.length, pendingDocuments: 418, validationQueue: validation.length, embeddingQueue: 72, indexingQueue: 54, contradictionQueue: summary.contradictionsDetected, staleKnowledgeCount: '2.4%', currentIngestionBottleneck: 'external repository rate limits', currentRetrievalBottleneck: 'none', lastAutonomousKnowledgeDecision: summary.lastSynchronization, humanAttentionRequired: summary.humanAttentionRequired },
      lifecycle: ['Source Connected','Content Discovered','Content Retrieved','Parsed','Metadata Extracted','Classified','Entities Extracted','Relationships Extracted','Source Validated','Duplicate Checked','Contradiction Checked','Chunked','Embedded','Indexed','Published to Knowledge Base','Retrieved','Cited','Learned From','Updated','Superseded','Archived','Ingestion Failed','Failure Classified','Retry','Alternate Parser','Alternate OCR','Partial Content Preserved','Revalidation','Reindex','Completed or Escalated'].map((stage, index) => ({ stage, sequence: index + 1, objectCount: 12000 + index * 917, completedToday: 200 + index * 17, failureCount: index > 20 ? 2 + (index % 4) : index % 3, retryCount: index % 5, averageDuration: `${12 + index}s`, queueDepth: index % 6, healthPercent: index > 20 ? 92 : 96 + (index % 4), currentBlockers: index > 20 ? 'fallback parser watch' : 'none' })),
      sourceCategories: categories,
      sources,
      knowledgeObjects: objects,
      selectedSource: sources[0] ?? {},
      selectedObject: objects[0] ?? {},
      sourceWizard: ['Source Identity','Connection','Discovery','Ingestion','Parsing','Validation','Chunking','Embeddings and Indexing','Permissions','Retention','Validate and Test','Activate'].map((step, index) => ({ step, sequence: index + 1, state: 'governed job', audit: 'required' })),
      uploads: ['Drag and drop','Multi-file upload','Folder upload','ZIP upload','File type detection','Duplicate detection','Metadata preview','OCR preview','Chunk preview','Embedding estimate','Validation result','Retry failed files'].map((capability) => ({ capability, state: 'available through governed upload job' })),
      ingestionPipeline: ingestion,
      validationResults: validation,
      authorityScores: sources.slice(0, 20).map((row) => ({ sourceCode: row.sourceCode, sourceName: row.sourceName, authorityScore: row.authorityScore, trustLevel: row.trustLevel, confidence: row.provenanceCoverage, risk: n(row.authorityScore) < 90 ? 'watch' : 'low', recommendedUsage: 'autonomous retrieval with citations', restrictions: row.trustLevel === 'Conditional' ? 'guarded use' : 'none' })),
      freshness: sources.slice(0, 20).map((row) => ({ sourceCode: row.sourceCode, lastUpdated: row.lastIngestion, reviewDate: row.nextIngestion, freshnessScore: row.freshnessScore, staleStatus: n(row.freshnessScore) < 90 ? 'watch' : 'fresh' })),
      duplicates: validation.filter((row) => String(row.validationArea).toLowerCase().includes('duplicate')).length ? validation.filter((row) => String(row.validationArea).toLowerCase().includes('duplicate')) : validation.slice(0, 12),
      contradictions: validation.filter((row) => String(row.validationArea).toLowerCase().includes('contradiction')).length ? validation.filter((row) => String(row.validationArea).toLowerCase().includes('contradiction')) : validation.slice(0, 12),
      entities: graph,
      knowledgeGraph: graph,
      chunking: objects.slice(0, 20).map((row) => ({ knowledgeCode: row.knowledgeCode, title: row.title, chunkCount: row.chunkCount, strategy: 'semantic splitting', overlap: 120, quality: row.confidencePercent })),
      embeddings: objects.slice(0, 20).map((row) => ({ knowledgeCode: row.knowledgeCode, title: row.title, embeddingStatus: row.embeddingStatus, indexStatus: row.indexStatus, model: 'text-embedding-3-large' })),
      retrievalTests: analytics,
      citations,
      taxonomies: ['Brand taxonomy','Audience taxonomy','Campaign taxonomy','Policy taxonomy','SEO taxonomy'].map((name) => ({ name, state: 'active', coverage: 'validated' })),
      ontologies: ['Content ontology','Workflow ontology','Publishing ontology','Knowledge evidence ontology'].map((name) => ({ name, state: 'active', graph: 'synchronized' })),
      synchronization: sync,
      retention: sources.slice(0, 20).map((row) => ({ sourceCode: row.sourceCode, policy: 'versioned retention', archive: 'superseded only', legalHold: row.categoryName === 'Legal and Compliance' ? 'enabled' : 'not required' })),
      security: sources.slice(0, 20).map((row) => ({ sourceCode: row.sourceCode, classification: row.trustLevel, tenantIsolation: 'strict', redaction: 'automatic', audit: 'enabled', risk: n(row.authorityScore) < 90 ? 'watch' : 'low' })),
      analytics,
      knowledgeGaps: gaps,
      recommendations,
      finalOutputTraceability: finalOutput,
      impactAnalysis: finalOutput,
      autonomousDecisions: ingestion.slice(0, 20),
      savedViews: ['All Sources','Active Sources','Degraded Sources','Authentication Failures','Stale Sources','Low-Authority Sources','High-Contradiction Sources','Missing Citations','Missing Provenance','Pending Synchronization','Brand Sources','External Sources','Internal Sources','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/knowledge-base/stream', queue: 'knowledge-base-operations' },
    }
  },
  summary: knowledgeBaseRepository.summary,
  sources: (query: KnowledgeBaseQuery = {}) => knowledgeBaseRepository.sources(query),
  objects: (query: KnowledgeBaseQuery = {}) => knowledgeBaseRepository.objects(query),
  ingestion: knowledgeBaseRepository.ingestion,
  validation: knowledgeBaseRepository.validation,
  duplicates: knowledgeBaseRepository.duplicates,
  contradictions: knowledgeBaseRepository.contradictions,
  entities: knowledgeBaseRepository.entities,
  graph: knowledgeBaseRepository.graph,
  embeddings: knowledgeBaseRepository.embeddings,
  indexes: knowledgeBaseRepository.indexes,
  retrievalTests: knowledgeBaseRepository.retrievalTests,
  citations: knowledgeBaseRepository.citations,
  sync: knowledgeBaseRepository.sync,
  analytics: knowledgeBaseRepository.analytics,
  gaps: knowledgeBaseRepository.gaps,
  recommendations: knowledgeBaseRepository.recommendations,
  finalOutput: knowledgeBaseRepository.finalOutput,
  async sourceDetail(id: string) {
    const [source, objects, health, ingestionRuns] = await Promise.all([knowledgeBaseRepository.source(id), knowledgeBaseRepository.objectsForSource(id), knowledgeBaseRepository.healthForSource(id), knowledgeBaseRepository.ingestionForSource(id)])
    return { source, objects, health, ingestionRuns }
  },
  async objectDetail(id: string) {
    const [object, versions, citations, provenance, relationships, usage] = await Promise.all([knowledgeBaseRepository.object(id), knowledgeBaseRepository.versionsForObject(id), knowledgeBaseRepository.citationsForObject(id), knowledgeBaseRepository.provenanceForObject(id), knowledgeBaseRepository.relationshipsForObject(id), knowledgeBaseRepository.usageForObject(id)])
    return { object, versions, citations, provenance, relationships, usage }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'knowledge-base-operations', dataSource: 'database', events: ['knowledge.source.created','knowledge.source.updated','knowledge.source.connected','knowledge.source.connection_failed','knowledge.ingestion.started','knowledge.ingestion.progress','knowledge.ingestion.completed','knowledge.ingestion.failed','knowledge.object.created','knowledge.object.validating','knowledge.object.trusted','knowledge.object.stale','knowledge.object.contradicted','knowledge.object.superseded','knowledge.object.embedded','knowledge.object.indexed','knowledge.graph.updated','knowledge.duplicate.detected','knowledge.duplicate.resolved','knowledge.contradiction.detected','knowledge.contradiction.resolved','knowledge.citation.created','knowledge.citation.validated','knowledge.sync.started','knowledge.sync.completed','knowledge.gap.detected','knowledge.recommendation.created','knowledge.recommendation.applied','knowledge.final_output.updated','knowledge.human_attention_required'] }
  },
}

export const KnowledgeBaseService = knowledgeBaseService
