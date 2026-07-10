export type LogLevel = 'Trace' | 'Debug' | 'Information' | 'Notice' | 'Warning' | 'Error' | 'Critical' | 'Fatal'

export type LogEntry = {
  id: string
  timestamp: string
  level: LogLevel | string
  sourceType: string
  sourceName: string
  serviceName: string
  moduleName: string | null
  environment: string
  message: string
  errorCode: string | null
  exceptionType: string | null
  stackTrace: string | null
  requestId: string | null
  traceId: string | null
  spanId: string | null
  correlationId: string | null
  workflowInstanceId: string | null
  workflowStageId: string | null
  agentRunId: string | null
  jobId: string | null
  userId: string | null
  endpoint: string | null
  httpMethod: string | null
  statusCode: number | null
  durationMs: number | null
  region: string | null
  host: string | null
  ipAddress: string | null
  metadata: Record<string, unknown> | null
  sensitiveHidden: boolean
}

export type LogQuery = {
  q?: string
  level?: string
  sourceType?: string
  service?: string
  module?: string
  environment?: string
  traceId?: string
  correlationId?: string
  requestId?: string
  page?: number
  pageSize?: number
}

export type LogDashboardData = {
  summary: Record<string, unknown>
  volumeTrend: Array<Record<string, unknown>>
  logEntries: LogEntry[]
  logSources: Array<Record<string, unknown>>
  sourceHealth: Array<Record<string, unknown>>
  errorClusters: Array<Record<string, unknown>>
  savedViews: Array<Record<string, unknown>>
  alertRules: Array<Record<string, unknown>>
  investigations: Array<Record<string, unknown>>
  retentionPolicies: Array<Record<string, unknown>>
  recentQueries: string[]
  traceTimeline: Array<Record<string, unknown>>
  filters: Record<string, string[]>
  dataSource: 'database'
}
