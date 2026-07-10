export type IncidentQuery = {
  q?: string
  severity?: string
  priority?: string
  status?: string
  source?: string
  service?: string
  module?: string
  environment?: string
  team?: string
  slaStatus?: string
  customerImpact?: string
  page?: number
  pageSize?: number
}

export type IncidentRow = {
  id: string
  incidentNumber: string
  title: string
  description: string | null
  sourceType: string
  sourceReferenceId: string | null
  severity: string
  priority: string
  status: string
  environment: string
  affectedService: string | null
  affectedModule: string | null
  customerImpact: string
  impactScope: string | null
  assignedTeam: string | null
  incidentCommander: string | null
  acknowledgedAt: string | null
  investigatingAt: string | null
  mitigatedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  slaDeadline: string | null
  slaStatus: string | null
  minutesRemaining: number | null
  rootCauseStatus: string
  resolutionSummary: string | null
  detectionSignal: string | null
  escalationLevel: number
  communicationStatus: string
  relatedAlerts: number
  relatedLogs: number
  relatedWorkflows: number
  relatedJobs: number
  durationMinutes: number
  createdAt: string
  updatedAt: string
}

export type IncidentDashboardData = {
  summary: Record<string, unknown>
  kpis: Array<Record<string, unknown>>
  lifecycle: Array<Record<string, unknown>>
  queues: Array<Record<string, unknown>>
  incidents: IncidentRow[]
  services: Array<Record<string, unknown>>
  sources: Array<Record<string, unknown>>
  responders: Array<Record<string, unknown>>
  timeline: Array<Record<string, unknown>>
  savedViews: Array<Record<string, unknown>>
  filters: Record<string, string[]>
  analytics: Record<string, unknown>
  dataSource: 'database'
}
