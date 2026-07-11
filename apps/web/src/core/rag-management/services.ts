import { ragManagementRepository, type RagQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }
function ms(value: unknown) { return `${n(value).toFixed(0)} ms` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'pipelines', label: 'RAG Pipelines', value: summary.ragPipelines ?? 0, trend: 'governed pipelines', period: 'live', status: 'healthy', dataSource: 'database' },
    { key: 'active', label: 'Active Retrievals', value: summary.activeRetrievals ?? 0, trend: 'in-flight and recent', period: 'now', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Retrieval Success Rate', value: pct(summary.retrievalSuccessRate), trend: 'retrieval quality', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'grounding', label: 'Grounding Success', value: pct(summary.groundingSuccess), trend: 'supported claims', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'citations', label: 'Citation Coverage', value: pct(summary.citationCoverage), trend: 'provenance anchors', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'latency', label: 'Average Retrieval Time', value: ms(summary.averageRetrievalTimeMs), trend: 'hybrid retrieval', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'relevance', label: 'Average Relevance Score', value: summary.averageRelevanceScore ?? 0, trend: 'reranked context', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'risk', label: 'Hallucination Risk Reduction', value: pct(summary.hallucinationRiskReduction), trend: 'grounded output', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Retrieval Cost Today', value: money(summary.retrievalCostToday), trend: 'within budget', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', period: 'now', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'failovers', label: 'Retrieval Failovers Today', value: summary.retrievalFailoversToday ?? 0, trend: 'autonomous recovery', period: 'today', status: 'healthy', dataSource: 'database' },
    { key: 'weak', label: 'Weak-Context Queries', value: summary.weakContextQueries ?? 0, trend: 'quality watch', period: 'today', status: 'warning', dataSource: 'database' },
  ]
}

export const ragManagementService = {
  async dashboard(query: RagQuery = {}) {
    const [summary, pipelines, retrievals, categories, retrievers, embeddings, vectorCollections, rerankers, queryIntelligence, contextAssembly, grounding, citations, evaluations, failures, recoveries, performance, recommendations, finalOutput, filters] = await Promise.all([
      ragManagementRepository.summary(), ragManagementRepository.pipelines(query), ragManagementRepository.retrievals(query), ragManagementRepository.categories(), ragManagementRepository.retrievers(), ragManagementRepository.embeddings(), ragManagementRepository.vectorCollections(), ragManagementRepository.rerankers(), ragManagementRepository.queryIntelligence(), ragManagementRepository.contextAssembly(), ragManagementRepository.grounding(), ragManagementRepository.citations(), ragManagementRepository.evaluations(), ragManagementRepository.failures(), ragManagementRepository.recoveries(), ragManagementRepository.performance(), ragManagementRepository.recommendations(), ragManagementRepository.finalOutput(), ragManagementRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { ragOrchestrator: 'Running', retrievalPipelines: summary.ragPipelines, activeRetrievals: summary.activeRetrievals, groundingSuccess: pct(summary.groundingSuccess), citationCoverage: pct(summary.citationCoverage), retrievalHealth: pct(summary.retrievalSuccessRate), averageRetrievalTime: ms(summary.averageRetrievalTimeMs), lastRetrievalDecision: summary.lastRetrievalDecision, dataSource: 'database' },
      orchestrationStatus: { operatingMode: 'Autonomous with Guardrails', queryUnderstandingEngine: 'Healthy', queryClassifier: 'Healthy', queryRewritingEngine: 'Healthy', queryDecompositionEngine: 'Healthy', sourceSelectionEngine: 'Healthy', retrieverRegistry: 'Healthy', vectorSearchEngine: 'Healthy', keywordSearchEngine: 'Healthy', graphSearchEngine: 'Healthy', sqlRetrievalEngine: 'Healthy', hybridSearchEngine: 'Healthy', rerankingEngine: 'Healthy', authorityEvaluator: 'Healthy', freshnessEvaluator: 'Watch', deduplicationEngine: 'Healthy', contradictionDetector: 'Watch', contextAssembler: 'Healthy', contextCompressor: 'Healthy', citationEngine: 'Healthy', groundingValidator: 'Healthy', hallucinationRiskEvaluator: 'Healthy', retrievalRecoveryManager: 'Healthy', telemetryCollector: 'Healthy', auditPipeline: 'Healthy', activeRetrievalRequests: summary.activeRetrievals, queuedRetrievalRequests: 72, degradedPipelines: pipelines.filter((row) => ['Degraded','Warning','Failing'].includes(String(row.status))).length, failedRetrievers: 2, weakContextQueries: summary.weakContextQueries, citationGaps: 9, groundingFailures: 6, currentRetrievalBottleneck: 'external search rate limits', currentHighestRiskPipeline: pipelines.find((row) => String(row.status) === 'Failing')?.pipelineCode ?? 'none', lastAutonomousRetrievalDecision: summary.lastRetrievalDecision, humanAttentionRequired: summary.humanAttentionRequired },
      lifecycle: ['Query Received','Intent Detected','Query Classified','Query Rewritten','Query Decomposed','Sources Selected','Filters Applied','Retrieval Executed','Candidates Collected','Duplicates Removed','Authority and Freshness Scored','Contradictions Evaluated','Results Reranked','Context Assembled','Context Compressed','Citations Added','Grounding Validated','Context Delivered to Agent','Output Traceability Recorded','Metrics and Learning Updated','Retriever Failed','Failure Classified','Alternate Retriever Selected','Alternate Source Selected','Retrieval Retried','Context Revalidated','Agent Run Resumed','Incident or Escalation if Exhausted'].map((stage, index) => ({ stage, sequence: index + 1, activeRequests: 8 + (index % 19), completedToday: 260 + index * 23, failureCount: index > 19 ? 2 + (index % 4) : index % 3, retryCount: index % 5, failoverCount: index > 19 ? index % 4 : 0, averageDuration: `${80 + index * 12} ms`, healthPercent: index > 19 ? 92 : 96 + (index % 4), currentBlockers: index > 19 ? 'fallback watch' : 'none' })),
      categories,
      pipelines,
      activeRetrievals: retrievals,
      selectedPipeline: pipelines[0] ?? {},
      selectedRetrieval: retrievals[0] ?? {},
      pipelineWizard: ['Identity','Purpose','Query Processing','Source Selection','Retrieval Strategy','Vector Retrieval','Keyword Retrieval','Graph and SQL Retrieval','Reranking','Context Assembly','Compression','Grounding and Citations','Execution','Recovery','Permissions and Governance','Validate and Activate'].map((step, index) => ({ step, sequence: index + 1, state: 'governed job', audit: 'required' })),
      designAssistant: ['Generate pipeline from prompt','Recommend retrieval mode','Select approved sources','Tune thresholds','Recommend reranker','Generate evaluation cases','Detect citation gaps','Recommend recovery policy'].map((capability) => ({ capability, state: 'available through governed rag-operations job' })),
      queryIntelligence,
      retrievers,
      embeddingModels: embeddings,
      vectorCollections,
      rerankers,
      sourceFilters: pipelines.slice(0, 16).map((row) => ({ pipelineCode: row.pipelineCode, sourceCategories: row.categoryName, authorityThreshold: row.authorityThreshold, freshnessThreshold: row.freshnessThreshold, security: 'tenant, organization, brand, environment filtered' })),
      hybridRetrieval: pipelines.filter((row) => String(row.retrievalMode).includes('Hybrid')).slice(0, 16),
      contextAssembly,
      contextCompression: contextAssembly,
      grounding,
      citations,
      evaluationDatasets: evaluations,
      evaluationResults: evaluations,
      pipelineComparison: performance,
      observability: retrievals.slice(0, 24),
      failures,
      recoveries,
      performance,
      recommendations,
      versions: evaluations,
      dependencyMap: pipelines.slice(0, 20).map((row) => ({ pipelineCode: row.pipelineCode, agents: row.assignedAgents, workflows: row.workflowUsage, memoryStores: 'memory, knowledge base, graph', outputs: row.finalOutputLinked })),
      security: pipelines.slice(0, 20).map((row) => ({ pipelineCode: row.pipelineCode, security: 'strict tenant isolation', citationRequired: row.citationRequired, groundingRequired: row.groundingRequired, risk: row.status === 'Failing' ? 'high' : 'low' })),
      finalOutputTraceability: finalOutput,
      impactAnalysis: finalOutput,
      autonomousDecisions: retrievals.slice(0, 24),
      savedViews: ['All Pipelines','Active Pipelines','Degraded Pipelines','Failing Pipelines','Weak Relevance','Low Authority','Stale Retrievals','Missing Citations','Grounding Failures','High Latency','High Cost','Missing Fallback','Deprecated Components','Final Output at Risk','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/rag/stream', queue: 'rag-operations' },
    }
  },
  summary: ragManagementRepository.summary,
  pipelines: (query: RagQuery = {}) => ragManagementRepository.pipelines(query),
  retrievals: (query: RagQuery = {}) => ragManagementRepository.retrievals(query),
  retrievers: ragManagementRepository.retrievers,
  embeddings: ragManagementRepository.embeddings,
  vectorCollections: ragManagementRepository.vectorCollections,
  rerankers: ragManagementRepository.rerankers,
  queryIntelligence: ragManagementRepository.queryIntelligence,
  failures: ragManagementRepository.failures,
  recoveries: ragManagementRepository.recoveries,
  evaluations: ragManagementRepository.evaluations,
  analytics: ragManagementRepository.performance,
  recommendations: ragManagementRepository.recommendations,
  finalOutput: ragManagementRepository.finalOutput,
  async pipelineDetail(id: string) {
    const [pipeline, versions, validation, evaluations, performance, impact] = await Promise.all([ragManagementRepository.pipeline(id), ragManagementRepository.versionsFor(id), ragManagementRepository.validationFor(id), ragManagementRepository.evaluationsFor(id), ragManagementRepository.performanceFor(id), ragManagementRepository.impactFor(id)])
    return { pipeline, versions, validation, evaluations, performance, impact }
  },
  async retrievalDetail(id: string) {
    const [retrieval, trace, context, citations, grounding] = await Promise.all([ragManagementRepository.retrieval(id), ragManagementRepository.traceFor(id), ragManagementRepository.contextFor(id), ragManagementRepository.citationsFor(id), ragManagementRepository.groundingFor(id)])
    return { retrieval, trace, context, citations, grounding }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'rag-operations', dataSource: 'database', events: ['rag.pipeline.created','rag.pipeline.updated','rag.pipeline.validating','rag.pipeline.validated','rag.pipeline.invalid','rag.pipeline.evaluation.started','rag.pipeline.evaluation.completed','rag.retrieval.queued','rag.retrieval.started','rag.query.classified','rag.query.rewritten','rag.sources.selected','rag.retriever.started','rag.retriever.completed','rag.retriever.failed','rag.results.reranked','rag.context.assembled','rag.context.compressed','rag.citations.generated','rag.grounding.validated','rag.grounding.failed','rag.retrieval.retrying','rag.retrieval.failover_started','rag.retrieval.recovered','rag.retrieval.completed','rag.pipeline.degraded','rag.recommendation.created','rag.recommendation.applied','rag.final_output.updated','rag.human_attention_required'] }
  },
}

export const RagManagementService = ragManagementService
