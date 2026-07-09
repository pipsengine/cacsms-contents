import {
  apiStatusRepository,
  backgroundJobsRepository,
  implementationStatusRepository,
  serviceHealthRepository,
  workflowStatusRepository,
} from '@cacsms/database'
import { apiStatusMockData } from '@/data/apiStatusMockData'
import { backgroundJobsMockData } from '@/data/backgroundJobsMockData'
import { serviceHealthMockData } from '@/data/serviceHealthMockData'
import { logger } from '@/shared/logging/logger'

export const monitoringService = {
  async getWorkflowStatusDashboard() {
    try {
      return { source: 'database' as const, data: { workflows: await workflowStatusRepository.getWorkflowStatusDashboard() } }
    } catch (error) {
      logger.warn(error, 'Workflow status fallback active')
      return { source: 'mock' as const, data: { summary: 'Workflow status fallback data.', workflows: [] } }
    }
  },

  async getImplementationStatusDashboard() {
    try {
      return { source: 'database' as const, data: { matrix: await implementationStatusRepository.getImplementationStatusDashboard() } }
    } catch (error) {
      logger.warn(error, 'Implementation status fallback active')
      return { source: 'mock' as const, data: { summary: 'Implementation status fallback data.', items: [] } }
    }
  },

  async getServiceHealthDashboard() {
    try {
      const services = await serviceHealthRepository.getServiceHealthDashboard()
      return {
        source: 'database' as const,
        data: {
          ...serviceHealthMockData,
          services: services.map((service: Record<string, unknown>) => ({
            id: String(service.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: String(service.name),
            icon: 'api',
            status: toServiceStatus(service.status),
            health: Number(service.health_percent ?? 0),
            latency: service.latency_ms ? `${service.latency_ms}ms` : 'n/a',
            uptime: '99.90%',
            lastChecked: service.last_checked_at ? 'database' : 'n/a',
            category: 'Database',
          })),
        },
      }
    } catch (error) {
      logger.warn(error, 'Service health fallback active')
      return { source: 'mock' as const, data: serviceHealthMockData }
    }
  },

  async getApiStatusDashboard() {
    try {
      const endpoints = await apiStatusRepository.getApiStatusDashboard()
      return {
        source: 'database' as const,
        data: {
          ...apiStatusMockData,
          endpoints: endpoints.map((endpoint: Record<string, unknown>) => ({
            group: String(endpoint.api_group),
            endpoint: `${endpoint.http_method} ${endpoint.endpoint}`,
            method: endpoint.http_method,
            status: toApiStatus(endpoint.status),
            health: Number(endpoint.health_percent ?? 0),
            avgLatency: endpoint.avg_latency_ms ? `${endpoint.avg_latency_ms}ms` : 'n/a',
            p95Latency: endpoint.avg_latency_ms ? `${Number(endpoint.avg_latency_ms) * 2}ms` : 'n/a',
            errorRate: `${endpoint.error_rate ?? 0}%`,
            requestsToday: 'database',
            authRequired: 'Yes',
            rateLimit: 'configured',
            lastFailure: '-',
            ownerModule: String(endpoint.api_group),
          })),
        },
      }
    } catch (error) {
      logger.warn(error, 'API status fallback active')
      return { source: 'mock' as const, data: apiStatusMockData }
    }
  },

  async getBackgroundJobsDashboard() {
    try {
      const jobs = await backgroundJobsRepository.getBackgroundJobsDashboard()
      return {
        source: 'database' as const,
        data: {
          ...backgroundJobsMockData,
          jobs: jobs.map((job: Record<string, unknown>, index: number) => ({
            id: `DB-JOB-${index + 1}`,
            name: String(job.name),
            module: 'Database',
            queue: String(job.queue_name ?? 'Default Queue'),
            priority: toPriority(job.priority),
            status: toJobStatus(job.status),
            worker: 'Database Worker',
            progress: Number(job.progress_percent ?? 0),
            executionTime: 'database',
            started: job.started_at ? 'database' : '-',
            eta: '-',
            retries: 0,
            owner: 'Database',
          })),
        },
      }
    } catch (error) {
      logger.warn(error, 'Background jobs fallback active')
      return { source: 'mock' as const, data: backgroundJobsMockData }
    }
  },
}

function toServiceStatus(status: unknown) {
  const value = String(status ?? 'operational')
  if (value === 'degraded') return 'Degraded'
  if (value === 'failed') return 'Failed'
  if (value === 'stopped') return 'Stopped'
  if (value === 'starting') return 'Starting'
  return 'Operational'
}

function toApiStatus(status: unknown) {
  const value = String(status ?? 'operational')
  if (value === 'degraded') return 'Degraded'
  if (value === 'failed') return 'Failed'
  return 'Operational'
}

function toJobStatus(status: unknown) {
  const value = String(status ?? 'queued')
  if (value === 'completed') return 'Completed'
  if (value === 'running') return 'Running'
  if (value === 'failed') return 'Failed'
  if (value === 'retrying') return 'Retrying'
  if (value === 'cancelled') return 'Cancelled'
  if (value === 'pending') return 'Pending'
  return 'Queued'
}

function toPriority(priority: unknown) {
  const value = String(priority ?? 'medium')
  if (value === 'critical') return 'Critical'
  if (value === 'high') return 'High'
  if (value === 'low') return 'Low'
  return 'Medium'
}
