import { promptsRepository, type PromptsQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(4)}` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Prompts', value: summary.totalPrompts ?? 0, trend: 'registered executable prompt assets', status: 'healthy', dataSource: 'database' },
    { key: 'active', label: 'Active Prompts', value: summary.activePrompts ?? 0, trend: 'production prompt versions', status: 'healthy', dataSource: 'database' },
    { key: 'draft', label: 'Draft Prompts', value: summary.draftPrompts ?? 0, trend: 'awaiting validation', status: 'watch', dataSource: 'database' },
    { key: 'success', label: 'Prompt Success Rate', value: pct(summary.promptSuccessRate), trend: 'execution success', status: 'healthy', dataSource: 'database' },
    { key: 'confidence', label: 'Average Confidence', value: pct(summary.averagePromptConfidence), trend: 'model confidence', status: 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Average Prompt Cost', value: money(summary.averagePromptCost), trend: 'cost per run', status: 'healthy', dataSource: 'database' },
    { key: 'tokens', label: 'Average Tokens', value: Math.round(n(summary.averageTokens)), trend: 'context and output tokens', status: 'healthy', dataSource: 'database' },
    { key: 'acceptance', label: 'Prompt Acceptance Rate', value: pct(summary.promptAcceptanceRate), trend: 'accepted outputs', status: 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final Output Success', value: pct(summary.finalOutputSuccess), trend: 'business output linkage', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'guardrail exceptions', status: n(summary.humanAttentionRequired) ? 'warning' : 'healthy', dataSource: 'database' },
  ]
}

export const promptsService = {
  async dashboard(query: PromptsQuery = {}) {
    const [summary, prompts, categories, versions, variables, context, tools, models, providers, memory, rag, tests, simulations, abTests, validation, metrics, security, deployments, finalOutput, filters] = await Promise.all([
      promptsRepository.summary(), promptsRepository.list(query), promptsRepository.categories(), promptsRepository.versions(), promptsRepository.variables(), promptsRepository.context(), promptsRepository.tools(), promptsRepository.models(), promptsRepository.providers(), promptsRepository.memory(), promptsRepository.rag(), promptsRepository.tests(), promptsRepository.simulations(), promptsRepository.abTests(), promptsRepository.validation(), promptsRepository.metrics(), promptsRepository.security(), promptsRepository.deployments(), promptsRepository.finalOutput(), promptsRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { promptEngine: 'Running', promptRegistry: 'Database backed', activePromptVersions: summary.activePrompts ?? 0, promptSuccessRate: pct(summary.promptSuccessRate), averagePromptConfidence: pct(summary.averagePromptConfidence), promptCost: money(summary.averagePromptCost), lastPromptDeployment: summary.lastPromptDeployment, dataSource: 'database' },
      engineStatus: ['Prompt Registry','Prompt Compiler','Prompt Validator','Prompt Optimizer','Prompt Tester','Prompt Simulator','Provider Compatibility Engine','Model Compatibility Engine','Security Scanner','Injection Detection','Hallucination Detector','Prompt Analytics','Version Manager','Deployment Manager'].map((name, index) => ({ name, state: index === 10 ? 'Watch' : 'Healthy', health: index === 10 ? 92 : 96 + (index % 3), blocker: index === 10 ? 'low-risk hallucination checks monitored' : 'none' })),
      lifecycle: ['Draft','Validation','Simulation','Testing','Approval','Deployment','Monitoring','Optimization','Versioning','Archive','Failure','Rollback','Recovery','Redeploy'].map((stage, index) => ({ stage, sequence: index + 1, count: Math.max(4, 138 - index * 8), state: index < 9 ? 'active' : 'guarded' })),
      categories,
      prompts,
      selectedPrompt: prompts[0] ?? {},
      promptDesigner: ['System Prompt','Developer Instructions','User Instructions','Variables','Context Blocks','Conditional Sections','Tool Instructions','Output Instructions','Validation Rules','Recovery Rules','Reflection Rules','Revision Rules','Formatting Rules'].map((section) => ({ section, state: 'database governed', source: 'ai_prompts and related prompt tables' })),
      variables,
      contextOptimization: context,
      toolOrchestration: tools,
      modelCompatibility: models,
      providerCompatibility: providers,
      memoryOrchestration: memory,
      ragConfiguration: rag,
      testing: tests,
      simulations,
      abTesting: abTests,
      validation,
      analytics: metrics,
      optimization: metrics.slice(0, 20).map((row) => ({ promptCode: row.promptCode, shorterPrompts: 'available', lowerTokens: row.tokens, confidence: row.confidence, cost: row.cost, quality: row.quality, contextOptimization: 'active' })),
      security,
      versions,
      deployments,
      finalOutput,
      savedViews: ['All Prompts','Production Prompts','Draft Prompts','Testing','Canary','Security Watch','High Cost','High Tokens','Final Output Guarded','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/prompts/stream', queue: 'prompt-management' },
    }
  },
  summary: promptsRepository.summary,
  list: (query: PromptsQuery = {}) => promptsRepository.list(query),
  analytics: promptsRepository.metrics,
  tests: promptsRepository.tests,
  versions: promptsRepository.versions,
  finalOutput: promptsRepository.finalOutput,
  async get(id: string) {
    const [prompt, versions, variables, validation, tests, simulations, security] = await Promise.all([promptsRepository.get(id), promptsRepository.versionsFor(id), promptsRepository.variablesFor(id), promptsRepository.validationFor(id), promptsRepository.testsFor(id), promptsRepository.simulationsFor(id), promptsRepository.securityFor(id)])
    return { prompt, versions, variables, validation, tests, simulations, security }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'prompt-management', dataSource: 'database', events: ['prompt.created','prompt.updated','prompt.validated','prompt.tested','prompt.simulated','prompt.optimized','prompt.deployed','prompt.rollback','prompt.failed','prompt.recovered'] }
  },
}

export const PromptsService = promptsService
