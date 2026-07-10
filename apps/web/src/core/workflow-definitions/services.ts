import { workflowDefinitionsRepository, type WorkflowDefinitionsQuery } from './repositories'

function pct(part: unknown, total: unknown) {
  const base = Number(total ?? 0)
  return base ? Math.round((Number(part ?? 0) / base) * 100) : 0
}

function kpis(summary: Record<string, unknown>) {
  return [
    { label: 'Total Definitions', value: summary.totalDefinitions ?? 0, note: 'Workflow catalog size', tone: 'blue' },
    { label: 'Published', value: summary.publishedVersions ?? 0, note: 'Published versions', tone: 'green' },
    { label: 'Draft', value: summary.draftVersions ?? 0, note: 'Draft versions', tone: 'amber' },
    { label: 'Invalid', value: summary.invalidDefinitions ?? 0, note: 'Validation or health invalid', tone: 'red' },
    { label: 'Deprecated', value: summary.deprecatedDefinitions ?? 0, note: 'Deprecated definitions', tone: 'violet' },
    { label: 'Disabled', value: summary.disabledCount ?? 0, note: 'Not executable', tone: 'red' },
    { label: 'Average Health', value: `${Number(summary.averageHealth ?? 0).toFixed(1)}%`, note: 'Definition health', tone: 'blue' },
    { label: 'Autonomous Recovery', value: `${pct(summary.recoveryEnabledCount, summary.totalDefinitions)}%`, note: 'Recovery enabled', tone: 'green' },
    { label: 'Final Output Ready', value: `${pct(summary.outputReadyCount, summary.totalDefinitions)}%`, note: 'Output readiness', tone: 'green' },
    { label: 'Updated This Month', value: summary.updatedThisMonth ?? 0, note: 'Current month changes', tone: 'blue' },
  ]
}

export const workflowDefinitionsService = {
  async dashboard(query: WorkflowDefinitionsQuery = {}) {
    const [summary, definitions, categories, recommendations, filters] = await Promise.all([
      workflowDefinitionsRepository.summary(),
      workflowDefinitionsRepository.list(query),
      workflowDefinitionsRepository.categories(),
      workflowDefinitionsRepository.recommendations(),
      workflowDefinitionsRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      definitions,
      categories,
      recommendations,
      filters,
      savedViews: ['All Definitions', 'Published', 'Draft', 'Invalid', 'Missing Recovery', 'Missing Final Output', 'Recently Updated', 'Production Workflows', 'System Workflows'],
      dataSource: 'database' as const,
    }
  },
  list: workflowDefinitionsRepository.list,
  summary: workflowDefinitionsRepository.summary,
  categories: workflowDefinitionsRepository.categories,
  get: workflowDefinitionsRepository.get,
  versions: (id: string) => workflowDefinitionsRepository.byIdView(id, 'vw_workflow_definition_versions'),
  health: (id: string) => workflowDefinitionsRepository.byIdView(id, 'vw_workflow_definition_readiness'),
  dependencies: (id: string) => workflowDefinitionsRepository.byIdView(id, 'vw_workflow_definition_dependencies'),
  recommendations: workflowDefinitionsRepository.recommendations,
  validation: workflowDefinitionsRepository.validation,
  executions: workflowDefinitionsRepository.executions,
  documentation: workflowDefinitionsRepository.documentation,
  streamDescriptor() {
    return { stream: 'polling-ready', events: ['workflow.definition.updated', 'workflow.definition.validated', 'workflow.definition.health.changed', 'workflow.definition.recommendation.created'], heartbeatSeconds: 10, autonomousMode: true, dataSource: 'database' }
  },
}
