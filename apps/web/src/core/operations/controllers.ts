import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { operationsService } from './services'

function disabled(action: string) {
  return apiResponse({
    data: { action, autonomousMode: true },
    status: 'error',
    httpStatus: 405,
    message: 'Manual operations-center mutations are disabled in autonomous mode. Use the global Start/Stop control; recovery, queue, worker, agent, publishing, security, and governance actions are executed by database-backed autonomous workflows.',
  })
}

export const operationsController = {
  async dashboard() {
    return apiDatabase(await operationsService.dashboard(), 'Agent Operations Center loaded.')
  },

  async live() {
    return apiDatabase(operationsService.streamDescriptor(), 'Operations live stream descriptor loaded.')
  },

  async health() {
    return apiDatabase(await operationsService.health(), 'Operations health loaded.')
  },

  async workers() {
    return apiDatabase(await operationsService.workers(), 'Operations workers loaded.')
  },

  async queues() {
    return apiDatabase(await operationsService.queues(), 'Operations queues loaded.')
  },

  async events() {
    return apiDatabase(await operationsService.events(), 'Operations events loaded.')
  },

  async pause() {
    return disabled('pause')
  },

  async resume() {
    return disabled('resume')
  },

  async restart() {
    return disabled('restart')
  },

  async emergencyStop() {
    return disabled('emergency-stop')
  },

  async recover() {
    return disabled('recover')
  },
}
