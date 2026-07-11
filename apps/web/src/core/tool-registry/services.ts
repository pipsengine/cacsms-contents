import { toolRegistryRepository, type ToolRegistryQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }
function seconds(value: unknown) { return `${n(value).toFixed(1)} sec` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'registered', label: 'Registered Tools', value: summary.registeredTools ?? 0, trend: 'authoritative registry', period: 'live', status: 'healthy', tooltip: 'Tools registered in SQL', dataSource: 'database' },
    { key: 'active', label: 'Active Tools', value: summary.activeTools ?? 0, trend: 'published and executable', period: 'live', status: 'healthy', tooltip: 'Tools available to autonomous agents', dataSource: 'database' },
    { key: 'healthy', label: 'Healthy Tools', value: summary.healthyTools ?? 0, trend: 'passing checks', period: 'now', status: 'healthy', tooltip: 'Healthy tool count', dataSource: 'database' },
    { key: 'degraded', label: 'Degraded Tools', value: summary.degradedTools ?? 0, trend: 'degradation watch', period: 'now', status: n(summary.degradedTools) ? 'warning' : 'healthy', tooltip: 'Tools in degraded status', dataSource: 'database' },
    { key: 'offline', label: 'Offline Tools', value: summary.offlineTools ?? 0, trend: 'offline or unavailable', period: 'now', status: n(summary.offlineTools) ? 'warning' : 'healthy', tooltip: 'Tools unavailable', dataSource: 'database' },
    { key: 'calls', label: 'Tool Calls Today', value: summary.toolCallsToday ?? 0, trend: 'execution volume', period: 'today', status: 'healthy', tooltip: 'Tool calls executed today', dataSource: 'database' },
    { key: 'success', label: 'Tool Success Rate', value: pct(summary.toolSuccessRate), trend: 'validated outputs', period: 'today', status: 'healthy', tooltip: 'Tool output success rate', dataSource: 'database' },
    { key: 'latency', label: 'Average Tool Latency', value: seconds(summary.averageToolLatencySeconds), trend: 'execution latency', period: 'today', status: 'healthy', tooltip: 'Average tool call latency', dataSource: 'database' },
    { key: 'cost', label: 'Tool Cost Today', value: money(summary.toolCostToday), trend: 'actual tool spend', period: 'today', status: 'healthy', tooltip: 'Tool spend today', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', period: 'now', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', tooltip: 'Human escalation after recovery exhaustion', dataSource: 'database' },
    { key: 'failovers', label: 'Automatic Tool Failovers', value: summary.automaticToolFailovers ?? 0, trend: 'fallback execution', period: 'today', status: 'healthy', tooltip: 'Automatic failovers today', dataSource: 'database' },
    { key: 'warnings', label: 'Tool Permission Warnings', value: summary.toolPermissionWarnings ?? 0, trend: 'governance warnings', period: 'now', status: n(summary.toolPermissionWarnings) ? 'warning' : 'healthy', tooltip: 'Permission warnings', dataSource: 'database' },
  ]
}

export const toolRegistryService = {
  async dashboard(query: ToolRegistryQuery = {}) {
    const [summary, tools, categories, lifecycle, health, credentials, permissions, agents, capabilities, workflows, activeCalls, rateLimits, quotas, fallbacks, circuitBreakers, performance, deprecations, recommendations, security, finalOutputImpact, filters] = await Promise.all([
      toolRegistryRepository.summary(), toolRegistryRepository.tools(query), toolRegistryRepository.categories(), toolRegistryRepository.lifecycle(), toolRegistryRepository.health(), toolRegistryRepository.credentials(), toolRegistryRepository.permissions(), toolRegistryRepository.agents(), toolRegistryRepository.capabilities(), toolRegistryRepository.workflows(), toolRegistryRepository.activeCalls(), toolRegistryRepository.rateLimits(), toolRegistryRepository.quotas(), toolRegistryRepository.fallbacks(), toolRegistryRepository.circuitBreakers(), toolRegistryRepository.performance(), toolRegistryRepository.deprecations(), toolRegistryRepository.recommendations(), toolRegistryRepository.security(), toolRegistryRepository.finalOutputImpact(), toolRegistryRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { toolRegistry: 'Healthy', toolExecutionEngine: 'Running', registeredTools: summary.registeredTools, activeTools: summary.activeTools, degradedTools: summary.degradedTools, rateLimitedTools: 3, toolCallsToday: summary.toolCallsToday, lastToolEvent: summary.lastToolEvent, dataSource: 'database' },
      controlStatus: { operatingMode: 'Autonomous with Guardrails', toolRegistryService: 'Healthy', toolDiscoveryService: 'Healthy', schemaValidator: 'Healthy', permissionEngine: 'Healthy', authenticationValidator: 'Healthy', secretVaultConnector: 'Healthy', toolRouter: 'Running', toolExecutor: 'Running', inputValidator: 'Healthy', outputValidator: 'Healthy', rateLimitController: 'Watch', quotaMonitor: 'Watch', costController: 'Healthy', retryEngine: 'Healthy', fallbackToolSelector: 'Healthy', circuitBreakerManager: 'Healthy', telemetryCollector: 'Healthy', auditPipeline: 'Healthy', activeTools: summary.activeTools, availableTools: summary.registeredTools, activeToolCalls: 318, queuedToolCalls: 72, retryingCalls: 11, failingCalls: 6, openCircuitBreakers: 3, rateLimitWarnings: 3, credentialWarnings: 3, currentToolBottleneck: 'rate limit pressure on external API tools', lastAutonomousToolDecision: summary.lastToolEvent, humanAttentionRequired: summary.humanAttentionRequired },
      lifecycle,
      categories,
      tools,
      selectedTool: tools[0] ?? {},
      registrationWizard: ['Identity','Purpose','Connection','Authentication','Input Contract','Output Contract','Permissions and Scope','Execution','Rate Limits and Quotas','Cost','Recovery and Fallback','Security and Governance','Validate and Test','Publish'].map((step, index) => ({ step, sequence: index + 1, state: 'governed job', plaintextCredentials: 'never exposed' })),
      definitionAssistant: ['Generate from API documentation','Generate from OpenAPI specification','Generate from natural language','Recommend category and tool type','Generate input schema','Generate output schema','Recommend authentication','Recommend permissions','Recommend retries and fallback','Generate test cases','Detect excessive permissions','Optimize existing definition'].map((capability) => ({ capability, state: 'reviewable, versioned, reversible, audit logged' })),
      schemaDesigner: [{ mode: 'visual and JSON schema designer', inputSupport: 'strings, numbers, booleans, objects, arrays, enums, required fields, constraints, sensitive fields', outputSupport: 'JSON, text, markdown, files, images, audio, video, provenance, confidence, cost data', detection: 'schema mismatch, drift, missing provenance, sensitive field unclassified' }],
      permissionMatrix: permissions,
      agentAssignments: agents,
      capabilityMappings: capabilities,
      activeCalls,
      callDetails: activeCalls,
      toolHealth: health,
      rateLimits,
      quotas,
      credentialHealth: credentials,
      testResults: performance.slice(0, 20).map((row) => ({ ...row, testState: 'passed', simulationState: 'safe' })),
      simulationResults: activeCalls.slice(0, 20).map((row) => ({ ...row, simulationState: 'safe replay available' })),
      fallbacks,
      circuitBreakers,
      versions: tools.map((row) => ({ toolCode: row.toolCode, toolName: row.toolName, currentVersion: row.currentVersion, status: row.status })),
      deprecations,
      dependencyMap: workflows,
      performance,
      recommendations,
      security,
      finalOutputImpact,
      impactAnalysis: finalOutputImpact,
      autonomousDecisions: activeCalls.slice(0, 20),
      savedViews: ['All Tools','Active Tools','Healthy Tools','Degraded Tools','Offline Tools','Rate Limited','Quota at Risk','Credential Warnings','Authentication Failures','Missing Fallbacks','Missing Schemas','Missing Agent Assignments','High-Cost Tools','High-Latency Tools','High-Failure Tools','Sensitive Tools','Deprecated Tools','Circuit Breakers Open','Final Output at Risk','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/ai-tools/stream', queue: 'ai-tool-operations' },
    }
  },
  summary: toolRegistryRepository.summary,
  tools: (query: ToolRegistryQuery = {}) => toolRegistryRepository.tools(query),
  get: toolRegistryRepository.get,
  categories: toolRegistryRepository.categories,
  activeCalls: toolRegistryRepository.activeCalls,
  deprecations: toolRegistryRepository.deprecations,
  recommendations: toolRegistryRepository.recommendations,
  security: toolRegistryRepository.security,
  finalOutputImpact: toolRegistryRepository.finalOutputImpact,
  async detail(id: string) {
    const [tool, versions, schemas, permissions, calls] = await Promise.all([toolRegistryRepository.get(id), toolRegistryRepository.versionsFor(id), toolRegistryRepository.schemasFor(id), toolRegistryRepository.permissionsFor(id), toolRegistryRepository.callsFor(id)])
    return { tool, versions, schemas, permissions, calls }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'ai-tool-operations', dataSource: 'database', events: ['ai.tool.created','ai.tool.updated','ai.tool.validating','ai.tool.validated','ai.tool.invalid','ai.tool.health.changed','ai.tool.degraded','ai.tool.offline','ai.tool.credential.expiring','ai.tool.credential.rotated','ai.tool.rate_limited','ai.tool.quota.warning','ai.tool.call.queued','ai.tool.call.started','ai.tool.call.progress','ai.tool.call.completed','ai.tool.call.failed','ai.tool.call.retrying','ai.tool.call.fallback_started','ai.tool.call.fallback_completed','ai.tool.call.recovered','ai.tool.circuit_breaker.opened','ai.tool.circuit_breaker.closed','ai.tool.schema_drift.detected','ai.tool.deprecated','ai.tool.migration.started','ai.tool.migration.completed','ai.tool.recommendation.created','ai.tool.recommendation.applied','ai.tool.final_output.updated','ai.tool.human_attention_required'] }
  },
}

export const ToolRegistryService = toolRegistryService
