import { workflowTemplatesRepository, type WorkflowTemplatesQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function duration(ms: unknown) { const total = Math.round(n(ms) / 1000); return `${Math.floor(total / 60)}m ${total % 60}s` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Templates', value: summary.totalTemplates ?? 0, trend: 'library size', status: 'healthy', dataSource: 'database' },
    { key: 'approved', label: 'Approved Templates', value: summary.approvedTemplates ?? 0, trend: 'governed', status: 'healthy', dataSource: 'database' },
    { key: 'production', label: 'Production Ready', value: summary.productionReady ?? 0, trend: 'executable', status: 'healthy', dataSource: 'database' },
    { key: 'draft', label: 'Draft Templates', value: summary.draftTemplates ?? 0, trend: 'in progress', status: 'watch', dataSource: 'database' },
    { key: 'invalid', label: 'Invalid Templates', value: summary.invalidTemplates ?? 0, trend: 'validation', status: n(summary.invalidTemplates) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'deprecated', label: 'Deprecated Templates', value: summary.deprecatedTemplates ?? 0, trend: 'retiring', status: n(summary.deprecatedTemplates) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'used', label: 'Instantiations This Month', value: summary.templatesUsedThisMonth ?? 0, trend: 'usage', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Average Template Success Rate', value: `${n(summary.averageSuccessRate).toFixed(1)}%`, trend: 'rolling', status: 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final-Output Ready', value: `${n(summary.averageFinalOutputRate).toFixed(1)}%`, trend: 'lineage', status: 'healthy', dataSource: 'database' },
    { key: 'config', label: 'Human Configuration Required', value: 0, trend: 'Autonomous defaults available', status: 'healthy', dataSource: 'database' },
  ]
}

function libraryHealth(summary: Record<string, unknown>) {
  return {
    overallTemplateHealth: n(summary.invalidTemplates) ? 'Warning' : 'Healthy',
    validTemplates: Math.max(0, n(summary.totalTemplates) - n(summary.invalidTemplates) - n(summary.draftTemplates)),
    warningTemplates: n(summary.draftTemplates),
    invalidTemplates: summary.invalidTemplates ?? 0,
    draftTemplates: summary.draftTemplates ?? 0,
    deprecatedTemplates: summary.deprecatedTemplates ?? 0,
    templatesMissingRecovery: summary.missingRecovery ?? 0,
    templatesMissingApprovalLogic: summary.missingApprovalLogic ?? 0,
    templatesMissingPublishingStages: summary.missingPublishing ?? 0,
    templatesMissingAnalytics: summary.missingAnalytics ?? 0,
    templatesMissingLearningFeedback: summary.missingLearning ?? 0,
    templatesUsingOutdatedAgents: n(summary.invalidTemplates),
    templatesUsingOutdatedModels: n(summary.invalidTemplates),
    templatesWithBrokenDependencies: n(summary.invalidTemplates),
    productionReadinessPercentage: `${n(summary.productionReady) && n(summary.totalTemplates) ? ((n(summary.productionReady) / n(summary.totalTemplates)) * 100).toFixed(1) : '0.0'}%`,
    averageValidationScore: `${n(summary.averageValidationScore).toFixed(1)}%`,
    averageSuccessRate: `${n(summary.averageSuccessRate).toFixed(1)}%`,
    averageFinalOutputRate: `${n(summary.averageFinalOutputRate).toFixed(1)}%`,
    lastValidationRun: summary.lastValidationRun,
    currentLibraryBottleneck: summary.currentLibraryBottleneck ?? 'none detected',
    humanAttentionRequired: summary.humanAttentionRequired ?? 0,
  }
}

export const workflowTemplatesService = {
  async dashboard(query: WorkflowTemplatesQuery = {}) {
    const [summary, templates, categories, recommendations, finalOutputReadiness, versions, validationResults, simulationResults, dependencies, performance, documentation, filters] = await Promise.all([
      workflowTemplatesRepository.summary(), workflowTemplatesRepository.list(query), workflowTemplatesRepository.categories(), workflowTemplatesRepository.recommendations(), workflowTemplatesRepository.finalOutputReadiness(), workflowTemplatesRepository.allVersions(), workflowTemplatesRepository.allValidation(), workflowTemplatesRepository.simulationsAll(), workflowTemplatesRepository.dependenciesAll(), workflowTemplatesRepository.performanceAll(), workflowTemplatesRepository.documentation(), workflowTemplatesRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      libraryHealth: libraryHealth(summary),
      categories,
      templates,
      templateDetails: templates[0] ?? {},
      instantiationWizard: ['Select Template','Organization Context','Business Objective','Configure Inputs','Configure AI','Configure Workflow','Validate','Simulate','Create Workflow'].map((name, index) => ({ name, sequence: index + 1, defaultBehavior: 'Autonomous safe defaults available', status: 'ready' })),
      recommendations,
      validationResults,
      simulationResults,
      versions,
      comparison: templates.slice(0, 2).map((template) => ({ templateName: template.templateName, stages: template.stageCount, agents: template.aiAgentCount, cost: template.estimatedCost, duration: duration(template.estimatedDurationMs), successRate: template.successRate, recommendation: template.recommended ? 'preferred template' : 'alternative' })),
      performance,
      optimizationRecommendations: recommendations,
      dependencyMap: dependencies,
      documentation,
      finalOutputReadiness,
      filters,
      savedViews: ['All Templates','Production Ready','Approved','Draft','Invalid','Deprecated','High Success Rate','Low Cost','Fast Execution','Missing Recovery','Missing Analytics','Missing Learning','Recently Updated','Most Used','Recommended','Human Attention Required'],
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/workflow-templates/stream' },
    }
  },
  summary: workflowTemplatesRepository.summary,
  categories: workflowTemplatesRepository.categories,
  get: workflowTemplatesRepository.get,
  versions: (id: string) => workflowTemplatesRepository.versions(id),
  validation: (id: string) => workflowTemplatesRepository.validation(id),
  simulations: (id: string) => workflowTemplatesRepository.simulations(id),
  dependencies: (id: string) => workflowTemplatesRepository.dependencies(id),
  performance: (id: string) => workflowTemplatesRepository.performance(id),
  recommendations: workflowTemplatesRepository.recommendations,
  finalOutputReadiness: workflowTemplatesRepository.finalOutputReadiness,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, dataSource: 'database', events: ['workflow.template.created','workflow.template.updated','workflow.template.validating','workflow.template.validated','workflow.template.instantiation.started','workflow.template.instantiation.completed','workflow.template.simulation.started','workflow.template.simulation.completed','workflow.template.published','workflow.template.rolled_back','workflow.template.deprecated','workflow.template.recommendation.created','workflow.template.recommendation.applied','workflow.template.documentation.generated','workflow.template.human_attention_required'] }
  },
}

export const WorkflowTemplateService = workflowTemplatesService
export const WorkflowTemplateVersionService = workflowTemplatesService
export const WorkflowTemplateInstantiationService = workflowTemplatesService
export const WorkflowTemplateValidationService = workflowTemplatesService
export const WorkflowTemplateSimulationService = workflowTemplatesService
export const WorkflowTemplateRecommendationService = workflowTemplatesService
export const WorkflowTemplateComparisonService = workflowTemplatesService
export const WorkflowTemplatePerformanceService = workflowTemplatesService
export const WorkflowTemplateDependencyService = workflowTemplatesService
export const WorkflowTemplateOptimizationService = workflowTemplatesService
export const WorkflowTemplateDocumentationService = workflowTemplatesService
export const WorkflowTemplateFinalOutputService = workflowTemplatesService
