import {
  apiStatusRepository,
  backgroundJobsRepository,
  implementationStatusRepository,
  serviceHealthRepository,
  workflowStatusRepository,
} from '@cacsms/database'

export const monitoringService = {
  async getWorkflowStatusDashboard() {
    return { source: 'database' as const, data: { workflows: await workflowStatusRepository.getWorkflowStatusDashboard() } }
  },

  async getImplementationStatusDashboard() {
    return { source: 'database' as const, data: { matrix: await implementationStatusRepository.getImplementationStatusDashboard() } }
  },

  async getServiceHealthDashboard() {
    const services = await serviceHealthRepository.getServiceHealthDashboard()
    return {
      source: 'database' as const,
      data: {
        services: services.map((service: Record<string, unknown>) => ({
          id: String(service.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: String(service.name),
          icon: 'api',
          status: toServiceStatus(service.status),
          health: Number(service.health_percent ?? 0),
          latency: service.latency_ms ? `${service.latency_ms}ms` : 'n/a',
          uptime: null,
          lastChecked: service.last_checked_at ? String(service.last_checked_at) : null,
          category: 'Database',
        })),
      },
    }
  },

  async getApiStatusDashboard() {
    const endpoints = await apiStatusRepository.getApiStatusDashboard()
    return {
      source: 'database' as const,
      data: {
        endpoints: endpoints.map((endpoint: Record<string, unknown>) => ({
          group: String(endpoint.api_group),
          endpoint: `${endpoint.http_method} ${endpoint.endpoint}`,
          method: endpoint.http_method,
          status: toApiStatus(endpoint.status),
          health: Number(endpoint.health_percent ?? 0),
          avgLatency: endpoint.avg_latency_ms ? `${endpoint.avg_latency_ms}ms` : 'n/a',
          p95Latency: null,
          errorRate: `${endpoint.error_rate ?? 0}%`,
          requestsToday: null,
          authRequired: null,
          rateLimit: null,
          lastFailure: null,
          ownerModule: String(endpoint.api_group),
        })),
      },
    }
  },

  async getBackgroundJobsDashboard() {
    const jobs = await backgroundJobsRepository.getBackgroundJobsDashboard()
    return {
      source: 'database' as const,
      data: {
        jobs: jobs.map((job: Record<string, unknown>) => ({
          id: String(job.id ?? job.name),
          name: String(job.name),
          module: null,
          queue: String(job.queue_name ?? 'Default Queue'),
          priority: toPriority(job.priority),
          status: toJobStatus(job.status),
          worker: null,
          progress: Number(job.progress_percent ?? 0),
          executionTime: null,
          started: job.started_at ? String(job.started_at) : null,
          eta: null,
          retries: null,
          owner: null,
        })),
      },
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
