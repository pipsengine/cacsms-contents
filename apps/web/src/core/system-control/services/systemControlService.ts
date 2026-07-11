import { workflowRuntimeRepository } from '@/core/workflow/repositories/workflowRuntimeRepository'
import { workflowExecutionService } from '@/core/workflow/services/workflowExecutionService'
import type { WorkflowSnapshot } from '@/core/workflow/types/runtime'

const defaultRequestedBy = 'dashboard'
let controlQueue = Promise.resolve()

export const systemControlService = {
  async start(requestedBy = defaultRequestedBy) {
    return runSystemControl(() => runStart(requestedBy))
  },

  async stop(requestedBy = defaultRequestedBy) {
    return runSystemControl(() => runStop(requestedBy))
  },

  async pause(instanceId: string) {
    return workflowExecutionService.transition(instanceId, 'paused', 'paused')
  },

  async resume(instanceId: string) {
    return workflowExecutionService.transition(instanceId, 'running', 'resumed')
  },

  async status() {
    const instances = await workflowExecutionService.listInstances()
    const active = instances.find((instance) => instance.workflowCode.startsWith('SYSTEM_') && isActiveStatus(instance.status))
    if (active) void workflowExecutionService.run(active.id)
    let state = await workflowRuntimeRepository.getSystemRuntimeState()
    if (state && !active && ['starting', 'stopping'].includes(String(state.status ?? '').toLowerCase())) {
      state = await reconcileTerminalSystemState(state)
    }
    return { ...state, activeInstance: active ?? null }
  },
}

async function runSystemControl(action: () => Promise<WorkflowSnapshot>) {
  const current = controlQueue.then(action, action)
  controlQueue = current.then(() => undefined, () => undefined)
  return current
}

async function runStart(requestedBy: string) {
  const state = await systemControlService.status()
  const activeStartup = await activeSystemSnapshot('SYSTEM_STARTUP')
  if (activeStartup) return activeStartup
  if (String(state?.status ?? '').toLowerCase() === 'operational' && !state.activeInstance) {
    const latest = await latestSystemSnapshot('SYSTEM_STARTUP')
    if (latest) return latest
  }
  await settleActiveSystemWorkflows('SYSTEM_STARTUP')
  return workflowExecutionService.createAndStart({ workflowCode: 'SYSTEM_STARTUP', requestedBy })
}

async function runStop(requestedBy: string) {
  const state = await systemControlService.status()
  const activeShutdown = await activeSystemSnapshot('SYSTEM_SHUTDOWN')
  if (activeShutdown) return activeShutdown
  if (String(state?.status ?? '').toLowerCase() === 'stopped' && !state.activeInstance) {
    const latest = await latestSystemSnapshot('SYSTEM_SHUTDOWN')
    if (latest) return latest
  }
  await settleActiveSystemWorkflows('SYSTEM_SHUTDOWN')
  return workflowExecutionService.createAndStart({ workflowCode: 'SYSTEM_SHUTDOWN', requestedBy })
}

function isActiveStatus(status: string) {
  return ['queued', 'starting', 'running', 'paused', 'stopping'].includes(status)
}

async function activeSystemSnapshot(workflowCode: 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN') {
  const instances = await workflowExecutionService.listInstances()
  const active = instances.find((instance) => instance.workflowCode === workflowCode && isActiveStatus(instance.status))
  if (!active) return null
  void workflowExecutionService.run(active.id)
  return workflowExecutionService.getSnapshot(active.id)
}

async function reconcileTerminalSystemState(state: Record<string, unknown>) {
  const stateStatus = String(state.status ?? '').toLowerCase()
  const startupId = state.startup_workflow_instance_id ?? state.startupWorkflowInstanceId
  const shutdownId = state.shutdown_workflow_instance_id ?? state.shutdownWorkflowInstanceId
  const instanceId = stateStatus === 'starting' ? startupId : shutdownId
  if (!instanceId) return state

  try {
    const instance = await workflowRuntimeRepository.getInstance(String(instanceId))
    if (isActiveStatus(instance.status)) return state

    const completedStartup = instance.workflowCode === 'SYSTEM_STARTUP' && instance.status === 'completed'
    const completedShutdown = instance.workflowCode === 'SYSTEM_SHUTDOWN' && instance.status === 'completed'
    const nextStatus = completedStartup ? 'operational' : completedShutdown ? 'stopped' : 'failed'
    const nextPercent = nextStatus === 'operational' ? 100 : 0

    return workflowRuntimeRepository.updateSystemRuntimeState({
      organizationId: instance.organizationId,
      status: nextStatus,
      startupWorkflowInstanceId: instance.workflowCode === 'SYSTEM_STARTUP' ? instance.id : null,
      shutdownWorkflowInstanceId: instance.workflowCode === 'SYSTEM_SHUTDOWN' ? instance.id : null,
      readinessPercent: nextPercent,
      healthPercent: nextPercent,
      currentStage: nextStatus === 'failed' ? 'System control failed' : instance.currentStage,
      requestedBy: instance.initiatedBy ?? 'dashboard',
    })
  } catch {
    return state
  }
}

async function settleActiveSystemWorkflows(exceptWorkflowCode: 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN') {
  const instances = await workflowExecutionService.listInstances()
  const active = instances.filter(
    (instance) =>
      instance.workflowCode.startsWith('SYSTEM_') &&
      instance.workflowCode !== exceptWorkflowCode &&
      isActiveStatus(instance.status)
  )
  await Promise.allSettled(active.map((instance) => workflowExecutionService.transition(instance.id, 'cancelled', 'superseded_by_system_control')))
}

async function latestSystemSnapshot(workflowCode: 'SYSTEM_STARTUP' | 'SYSTEM_SHUTDOWN') {
  const instances = await workflowExecutionService.listInstances()
  const latest = instances.find((instance) => instance.workflowCode === workflowCode)
  return latest ? workflowExecutionService.getSnapshot(latest.id) : null
}
