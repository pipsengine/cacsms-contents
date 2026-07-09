import { monitoringService } from '@/services/monitoringService'
import { apiDatabase, apiFallback } from '@/shared/api/apiResponse'

function respond(result: { source: 'database' | 'mock'; data: unknown }, databaseMessage: string) {
  return result.source === 'database' ? apiDatabase(result.data, databaseMessage) : apiFallback(result.data)
}

export const systemMonitoringController = {
  async getWorkflowStatus() {
    return respond(await monitoringService.getWorkflowStatusDashboard(), 'Workflow status loaded from database.')
  },

  async getImplementationStatus() {
    return respond(await monitoringService.getImplementationStatusDashboard(), 'Implementation status loaded from database.')
  },

  async getServiceHealth() {
    return respond(await monitoringService.getServiceHealthDashboard(), 'Service health loaded from database.')
  },

  async getApiStatus() {
    return respond(await monitoringService.getApiStatusDashboard(), 'API status loaded from database.')
  },

  async getBackgroundJobs() {
    return respond(await monitoringService.getBackgroundJobsDashboard(), 'Background jobs loaded from database.')
  },
}
