export type UptimeMonitorStatus = 'Operational' | 'Degraded' | 'Partial Outage' | 'Major Outage' | 'Maintenance' | 'Paused' | 'Unknown'

export type UptimeMonitor = {
  id: string
  name: string
  description?: string | null
  monitorType: string
  category: string
  endpoint: string
  method?: string | null
  region: string
  status: UptimeMonitorStatus
  uptime24h: number
  uptime7d: number
  uptime30d: number
  responseTimeMs: number
  lastOutage?: string | null
  downtimeMinutes: number
  checkFrequencySeconds: number
  timeoutSeconds: number
  retryCount: number
  slaTarget: number
  owner?: string | null
  alertPolicy?: string | null
  lastChecked?: string | null
  isEnabled: boolean
}

export type AvailabilityBlock = {
  id: string
  monitorId: string
  status: UptimeMonitorStatus
  startedAt: string
  endedAt?: string | null
  responseTimeMs?: number | null
  incidentReference?: string | null
  errorMessage?: string | null
}

export type UptimeSummary = {
  overallUptime: number
  operationalMonitors: number
  healthyMonitors: number
  degradedMonitors: number
  offlineMonitors: number
  averageResponseTimeMs: number
  slaCompliance: number
  compliantServices: number
  totalServices: number
  incidentsThisMonth: number
  resolvedIncidents: number
  totalDowntimeMinutes: number
  lastChecked?: string | null
}

export type UptimeIncident = {
  id: string
  incidentKey: string
  service: string
  severity: string
  status: string
  startedAt: string
  resolvedAt?: string | null
  durationMinutes: number
  rootCause?: string | null
  userImpact?: string | null
  slaImpact?: string | null
  assignedTeam?: string | null
  postmortemStatus?: string | null
}

export type SlaRow = {
  monitorId: string
  service: string
  slaTarget: number
  actualUptime: number
  allowedDowntimeMinutes: number
  actualDowntimeMinutes: number
  remainingAllowanceMinutes: number
  breachStatus: string
  currentRisk: string
}

export type MaintenanceWindow = {
  id: string
  title: string
  servicesAffected: string[]
  startTime: string
  endTime: string
  durationMinutes: number
  expectedImpact?: string | null
  owner?: string | null
  approvalStatus: string
  notificationStatus: string
  currentState: string
}

export type RegionalMetric = {
  region: string
  availability: number
  averageLatencyMs: number
  failedChecks: number
  degradedServices: number
  lastIncident?: string | null
  healthStatus: string
}

export type UptimeDashboardData = {
  summary: UptimeSummary
  monitors: UptimeMonitor[]
  availabilityHistory: AvailabilityBlock[]
  incidents: UptimeIncident[]
  sla: SlaRow[]
  maintenanceWindows: MaintenanceWindow[]
  regionalMetrics: RegionalMetric[]
  alerts: string[]
  atRiskServices: string[]
  recommendations: string[]
  recentChanges: string[]
  dataSource: 'database'
}
