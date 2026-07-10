export type WorkflowDashboardQuery = {
  q?: string
  status?: string
  workflowType?: string
  priority?: string
  recoveryState?: string
}

export type WorkflowDashboardData = {
  summary: Record<string, unknown>
  engineStatus: Record<string, unknown>
  pipeline: Array<Record<string, unknown>>
  categories: Array<Record<string, unknown>>
  activeInstances: Array<Record<string, unknown>>
  recoveries: Array<Record<string, unknown>>
  queueHealth: Array<Record<string, unknown>>
  definitionHealth: Array<Record<string, unknown>>
  autonomousDecisions: Array<Record<string, unknown>>
  analytics: Record<string, unknown>
  finalOutputReadiness: Record<string, unknown>
  filters: Record<string, string[]>
  dataSource: 'database'
}
