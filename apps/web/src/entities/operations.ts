import type { TenantScopedEntity, TimestampedEntity } from './domain'

export type OperationalStatus = 'operational' | 'degraded' | 'failed' | 'starting' | 'stopped'

export type ServiceEntity = TimestampedEntity & {
  name: string
  category: string
  status: OperationalStatus
  healthPercentage: number
  latencyMs: number
  uptimePercentage: number
  lastCheckedAt: string
}

export type ApiEndpointEntity = TimestampedEntity & {
  apiGroup: string
  endpoint: string
  method: string
  status: string
  healthPercentage: number
  averageLatencyMs: number
  errorRate: number
}

export type BackgroundJobEntity = TenantScopedEntity & {
  name: string
  queueName: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'delayed'
  attempts: number
  priority: number
}

