import { modelProviderRepository, type ModelProviderQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }
function seconds(value: unknown) { return `${n(value).toFixed(1)} sec` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'providers', label: 'Configured Providers', value: summary.configuredProviders ?? 0, trend: 'registered runtime providers', period: 'live', status: 'healthy', tooltip: 'Providers configured in SQL registry', dataSource: 'database' },
    { key: 'models', label: 'Available Models', value: summary.availableModels ?? 0, trend: 'discoverable models', period: 'live', status: 'healthy', tooltip: 'Models available to router', dataSource: 'database' },
    { key: 'routes', label: 'Healthy Routes', value: pct(summary.healthyRoutes), trend: 'provider/model route health', period: 'today', status: 'healthy', tooltip: 'Routes passing health, policy, and compatibility checks', dataSource: 'database' },
    { key: 'activeRoutes', label: 'Active Model Routes', value: summary.activeModelRoutes ?? 0, trend: 'published routes', period: 'today', status: 'healthy', tooltip: 'Routes actively serving workloads', dataSource: 'database' },
    { key: 'degraded', label: 'Degraded Providers', value: summary.degradedProviders ?? 0, trend: 'degraded provider count', period: 'now', status: n(summary.degradedProviders) ? 'warning' : 'healthy', tooltip: 'Providers in degraded state', dataSource: 'database' },
    { key: 'rateLimited', label: 'Rate-Limited Models', value: summary.rateLimitedModels ?? 0, trend: 'rate-limit pressure', period: 'now', status: n(summary.rateLimitedModels) ? 'warning' : 'healthy', tooltip: 'Models under rate limit', dataSource: 'database' },
    { key: 'quota', label: 'Quota Risk', value: summary.quotaRisk ?? 0, trend: 'quota warnings', period: 'today', status: n(summary.quotaRisk) ? 'warning' : 'healthy', tooltip: 'Routes approaching quota ceilings', dataSource: 'database' },
    { key: 'latency', label: 'Average AI Latency', value: seconds(summary.averageAiLatencySeconds), trend: 'request latency', period: 'today', status: 'healthy', tooltip: 'Average runtime latency', dataSource: 'database' },
    { key: 'spend', label: 'AI Spend Today', value: money(summary.aiSpendToday), trend: 'runtime spend', period: 'today', status: 'healthy', tooltip: 'AI provider spend today', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', period: 'now', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', tooltip: 'Human intervention after fallbacks exhausted', dataSource: 'database' },
    { key: 'failovers', label: 'Automatic Failovers Today', value: summary.automaticFailoversToday ?? 0, trend: 'quality-preserving failovers', period: 'today', status: 'healthy', tooltip: 'Automatic failovers executed', dataSource: 'database' },
    { key: 'saved', label: 'Cost Saved by Routing', value: money(summary.costSavedByRouting), trend: 'routing optimization', period: 'today', status: 'healthy', tooltip: 'Estimated savings from routing optimizer', dataSource: 'database' },
  ]
}

export const modelProviderService = {
  async dashboard(query: ModelProviderQuery = {}) {
    const [summary, providers, models, categories, lifecycle, providerHealth, credentials, quotas, costs, modelHealth, compatibility, benchmarks, deprecations, routes, policies, decisions, failovers, circuitBreakers, recommendations, finalOutputImpact, costAnalytics, qualityAnalytics, latencyAnalytics, filters] = await Promise.all([
      modelProviderRepository.summary(), modelProviderRepository.providers(query), modelProviderRepository.models(query), modelProviderRepository.categories(), modelProviderRepository.lifecycle(), modelProviderRepository.providerHealth(), modelProviderRepository.providerCredentials(), modelProviderRepository.providerQuotas(), modelProviderRepository.providerCosts(), modelProviderRepository.modelHealth(), modelProviderRepository.modelCompatibility(), modelProviderRepository.benchmarks(), modelProviderRepository.deprecations(), modelProviderRepository.routes(), modelProviderRepository.policies(), modelProviderRepository.decisions(), modelProviderRepository.failovers(), modelProviderRepository.circuitBreakers(), modelProviderRepository.recommendations(), modelProviderRepository.finalOutputImpact(), modelProviderRepository.costAnalytics(), modelProviderRepository.qualityAnalytics(), modelProviderRepository.latencyAnalytics(), modelProviderRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { modelRouter: 'Running', providerRegistry: 'Healthy', activeProviders: summary.configuredProviders, availableModels: summary.availableModels, degradedRoutes: summary.degradedProviders, quotaRisk: summary.quotaRisk, aiSpendToday: money(summary.aiSpendToday), lastRoutingDecision: summary.lastRoutingDecision, dataSource: 'database' },
      runtimeStatus: { operatingMode: 'Autonomous with Guardrails', providerRegistryState: 'Healthy', modelRegistryState: 'Healthy', credentialValidatorState: 'Healthy', endpointHealthMonitor: 'Healthy', modelRouterState: 'Running', compatibilityEngine: 'Healthy', costOptimizerState: 'Healthy', latencyOptimizerState: 'Healthy', qualityOptimizerState: 'Healthy', quotaMonitorState: n(summary.quotaRisk) ? 'Watch' : 'Healthy', rateLimitMonitorState: n(summary.rateLimitedModels) ? 'Watch' : 'Healthy', failoverControllerState: 'Healthy', benchmarkEngineState: 'Healthy', deprecationMonitorState: 'Watch', dataResidencyValidatorState: 'Healthy', auditPipelineState: 'Healthy', activeProviders: summary.configuredProviders, availableModels: summary.availableModels, activeRequests: 284, requestsPerMinute: 618, currentFailovers: summary.automaticFailoversToday, rateLimitedRoutes: summary.rateLimitedModels, credentialWarnings: 1, quotaWarnings: summary.quotaRisk, currentProviderBottleneck: 'quota pressure on aggregator route', currentModelBottleneck: 'rate limited text models', lastAutonomousRoutingDecision: summary.lastRoutingDecision, humanAttentionRequired: summary.humanAttentionRequired },
      lifecycle,
      providerCategories: categories,
      providers,
      models,
      selectedProvider: providers[0] ?? {},
      selectedModel: models[0] ?? {},
      providerDetails: providers[0] ?? {},
      modelDetails: models[0] ?? {},
      providerWizard: ['Identity','Connection','Credential Configuration','Provider Capabilities','Quotas and Rate Limits','Cost','Reliability','Security and Governance','Discover Models','Validate and Activate'].map((step, index) => ({ step, sequence: index + 1, state: 'governed job', plaintextSecrets: 'never exposed' })),
      modelWizard: ['Identity','Capabilities','Limits','Pricing','Compatibility','Routing','Validation','Benchmark','Governance','Register'].map((step, index) => ({ step, sequence: index + 1, state: 'governed job' })),
      routingPolicies: policies,
      routingDecisionTrace: decisions,
      providerHealth,
      modelHealth,
      quotas,
      credentialHealth: credentials,
      providerCosts: costs,
      benchmarks,
      modelCompatibility: compatibility,
      comparisons: benchmarks.slice(0, 20).map((row) => ({ ...row, comparison: 'quality, cost, latency, reliability weighted' })),
      costAnalytics,
      qualityAnalytics,
      latencyAnalytics,
      failovers,
      circuitBreakers,
      deprecations,
      dependencyMap: routes.slice(0, 30).map((row) => ({ modelCode: row.modelCode, providerName: row.providerName, agents: row.assignedAgents, capabilities: row.assignedCapabilities, routes: row.activeRoutes, finalOutput: row.finalOutputState })),
      recommendations,
      securityResidency: providers.map((row) => ({ providerCode: row.providerCode, providerName: row.providerName, dataResidency: row.dataResidency, credentialStatus: row.credentialStatus, authenticationType: row.authenticationType, scope: row.organizationScope })),
      finalOutputImpact,
      impactAnalysis: finalOutputImpact,
      autonomousDecisions: decisions.slice(0, 20),
      savedViews: ['All Providers','Healthy Providers','Degraded Providers','Offline Providers','Rate Limited','Quota at Risk','Credential Warnings','Authentication Failures','High-Cost Providers','High-Latency Providers','Local Providers','Production Providers','Experimental Providers','Human Attention Required','Preferred Models','Fallback Models','Deprecated Models','High-Quality Models','Low-Cost Models','Low-Latency Models','Tool-Capable Models','Multimodal Models','Final Output at Risk'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/ai-model-routing/stream', queue: 'ai-model-provider-operations' },
    }
  },
  summary: modelProviderRepository.summary,
  providers: (query: ModelProviderQuery = {}) => modelProviderRepository.providers(query),
  models: (query: ModelProviderQuery = {}) => modelProviderRepository.models(query),
  provider: modelProviderRepository.provider,
  model: modelProviderRepository.model,
  policies: modelProviderRepository.policies,
  decisions: modelProviderRepository.decisions,
  failovers: modelProviderRepository.failovers,
  circuitBreakers: modelProviderRepository.circuitBreakers,
  recommendations: modelProviderRepository.recommendations,
  finalOutputImpact: modelProviderRepository.finalOutputImpact,
  deprecations: modelProviderRepository.deprecations,
  benchmarks: modelProviderRepository.benchmarks,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'ai-model-provider-operations', dataSource: 'database', events: ['ai.provider.created','ai.provider.updated','ai.provider.connection.validated','ai.provider.health.changed','ai.provider.degraded','ai.provider.offline','ai.provider.credential.expiring','ai.provider.credential.rotated','ai.provider.quota.warning','ai.provider.rate_limited','ai.model.registered','ai.model.updated','ai.model.health.changed','ai.model.benchmark.completed','ai.model.deprecated','ai.model.migration.started','ai.model.migration.completed','ai.model.routing.started','ai.model.routing.completed','ai.model.route.changed','ai.model.failover.started','ai.model.failover.completed','ai.model.circuit_breaker.opened','ai.model.circuit_breaker.closed','ai.model.recommendation.created','ai.model.recommendation.applied','ai.model.final_output.updated','ai.model.human_attention_required'] }
  },
}

export const ModelProviderService = modelProviderService
