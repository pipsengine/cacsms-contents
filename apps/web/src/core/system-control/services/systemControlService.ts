import { workflowRuntimeRepository } from '@/core/workflow/repositories/workflowRuntimeRepository'
import { workflowExecutionService } from '@/core/workflow/services/workflowExecutionService'

const defaultRequestedBy = 'dashboard'

export const systemControlService = {
  async start(requestedBy = defaultRequestedBy) {
    const snapshot = await workflowExecutionService.createAndStart({ workflowCode: 'SYSTEM_STARTUP', requestedBy })
    await workflowRuntimeRepository.updateSystemRuntimeState({
      organizationId: snapshot.instance.organizationId,
      status: 'starting',
      startupWorkflowInstanceId: snapshot.instance.id,
      requestedBy,
      currentStage: snapshot.instance.currentStage,
      startedAt: new Date().toISOString(),
    })
    return snapshot
  },

  async stop(requestedBy = defaultRequestedBy) {
    const snapshot = await workflowExecutionService.createAndStart({ workflowCode: 'SYSTEM_SHUTDOWN', requestedBy })
    await workflowRuntimeRepository.updateSystemRuntimeState({
      organizationId: snapshot.instance.organizationId,
      status: 'stopping',
      shutdownWorkflowInstanceId: snapshot.instance.id,
      requestedBy,
      currentStage: snapshot.instance.currentStage,
    })
    return snapshot
  },

  async pause(instanceId: string) {
    return workflowExecutionService.transition(instanceId, 'paused', 'paused')
  },

  async resume(instanceId: string) {
    return workflowExecutionService.transition(instanceId, 'running', 'resumed')
  },

  async status() {
    const instances = await workflowExecutionService.listInstances()
    const active = instances.find((instance) => instance.workflowCode.startsWith('SYSTEM_') && ['queued', 'running', 'paused', 'stopping'].includes(instance.status))
    const state = await workflowRuntimeRepository.getSystemRuntimeState()
    return { ...state, activeInstance: active ?? null }
  },
}
