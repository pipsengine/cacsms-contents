import { auditService } from '@/audit/auditService'
import { eventBus } from '@/events/eventBus'
import { aiOrchestratorService } from '@/core/ai-orchestrator/services'
import { aiOrchestratorRepository } from '@/core/ai-orchestrator/repositories'
import { workflowQueueService } from '@/core/queue/services/workflowQueueService'
import { calculateWorkflowProgress } from '../calculators/progressCalculator'
import { workflowStream } from '../events/workflowStream'
import { workflowRuntimeRepository } from '../repositories/workflowRuntimeRepository'
import type { StartWorkflowInput, WorkflowStatus } from '../types/runtime'

const queueByWorkflow: Record<string, string> = {
  SYSTEM_STARTUP: 'system-control',
  SYSTEM_SHUTDOWN: 'system-control',
  IMPLEMENTATION_VALIDATION: 'implementation-validation',
  CONTENT_LIFECYCLE: 'workflow-execution',
}

const paused = new Set<string>()
const cancelled = new Set<string>()
const running = new Set<string>()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function publish(instanceId: string, event: string) {
  const snapshot = await workflowRuntimeRepository.getSnapshot(instanceId)
  workflowStream.publish({ event, instanceId, payload: snapshot, createdAt: new Date().toISOString() })
  await eventBus.publish(event, { instanceId, status: snapshot.instance.status, progressPercent: snapshot.instance.progressPercent }, snapshot.instance.correlationId)
  return snapshot
}

async function syncSystemRuntimeState(instanceId: string, status?: string) {
  const instance = await workflowRuntimeRepository.getInstance(instanceId)
  if (!instance.workflowCode.startsWith('SYSTEM_')) return

  await workflowRuntimeRepository.updateSystemRuntimeState({
    organizationId: instance.organizationId,
    status: status ?? (instance.workflowCode === 'SYSTEM_SHUTDOWN' ? 'stopping' : 'starting'),
    startupWorkflowInstanceId: instance.workflowCode === 'SYSTEM_STARTUP' ? instance.id : null,
    shutdownWorkflowInstanceId: instance.workflowCode === 'SYSTEM_SHUTDOWN' ? instance.id : null,
    readinessPercent: instance.workflowCode === 'SYSTEM_STARTUP' ? instance.progressPercent : 0,
    healthPercent: instance.workflowCode === 'SYSTEM_STARTUP' ? instance.progressPercent : 0,
    currentStage: instance.currentStage,
    requestedBy: instance.initiatedBy,
  })
}

export const workflowExecutionService = {
  async listDefinitions() {
    return workflowRuntimeRepository.listDefinitions()
  },

  async listInstances() {
    return workflowRuntimeRepository.listInstances()
  },

  async getSnapshot(instanceId: string) {
    return workflowRuntimeRepository.getSnapshot(instanceId)
  },

  async createAndStart(input: StartWorkflowInput) {
    const definition = await workflowRuntimeRepository.getDefinitionByCode(input.workflowCode)
    const active = (await workflowRuntimeRepository.listInstances()).find(
      (instance) =>
        instance.organizationId === definition.organizationId &&
        instance.workflowCode === input.workflowCode &&
        ['queued', 'starting', 'running', 'paused', 'stopping'].includes(instance.status)
    )

    if (input.workflowCode.startsWith('SYSTEM_') && active) return workflowRuntimeRepository.getSnapshot(active.id)

    const instance = await workflowRuntimeRepository.createInstance({
      definition,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      context: input.context,
      requestedBy: input.requestedBy,
      correlationId: crypto.randomUUID(),
    })
    cancelled.delete(instance.id)
    paused.delete(instance.id)

    const queueName = queueByWorkflow[input.workflowCode] ?? 'workflow-execution'
    const job = await workflowRuntimeRepository.createQueueJob(queueName, `Execute ${input.workflowCode}`, instance.id)
    await workflowQueueService.enqueue(queueName, { instanceId: instance.id, workflowCode: input.workflowCode })
    await auditService.log('workflow start', 'workflow_instances', { workflowInstanceId: instance.id, workflowCode: input.workflowCode, requestedBy: input.requestedBy })
    await workflowRuntimeRepository.addLog(instance.id, `Queued ${input.workflowCode}`, { queueName, jobId: job.id })
    if (input.workflowCode.startsWith('SYSTEM_')) await syncSystemRuntimeState(instance.id)
    await publish(instance.id, 'workflow.instance.created')

    const runPromise = this.run(instance.id)
    void runPromise
    return workflowRuntimeRepository.getSnapshot(instance.id)
  },

  async run(instanceId: string) {
    if (running.has(instanceId)) return
    running.add(instanceId)
    try {
      let instance = await workflowRuntimeRepository.getInstance(instanceId)
      const stages = await workflowRuntimeRepository.listStages(instance.workflowDefinitionId)
      await workflowRuntimeRepository.updateInstance(instanceId, { status: 'running', progressPercent: instance.progressPercent || 0 })
      await syncSystemRuntimeState(instanceId)
      await publish(instanceId, 'workflow.started')

      for (const stage of stages) {
        instance = await workflowRuntimeRepository.getInstance(instanceId)
        if (['completed', 'failed', 'cancelled', 'stopped'].includes(instance.status)) break
        while (paused.has(instanceId)) {
          await workflowRuntimeRepository.updateInstance(instanceId, { status: 'paused' })
          await publish(instanceId, 'workflow.paused')
          await sleep(500)
        }
        if (cancelled.has(instanceId)) {
          await workflowRuntimeRepository.updateInstance(instanceId, { status: 'cancelled' })
          await publish(instanceId, 'workflow.cancelled')
          break
        }

        await workflowRuntimeRepository.updateInstance(instanceId, { status: 'running', currentStageId: stage.id, currentStage: stage.name })
        await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: 'running', progressPercent: 0 })
        await workflowRuntimeRepository.addLog(instanceId, `Stage started: ${stage.name}`, { stageCode: stage.stageCode }, 'info', stage.id)
        await publish(instanceId, 'workflow.stage.started')

        const job = await workflowRuntimeRepository.createQueueJob(queueByWorkflow[instance.workflowCode] ?? 'workflow-execution', stage.name, instanceId)
        const mappedAgents = await aiOrchestratorRepository.listMappingsForStage(stage.id)
        if (mappedAgents.length) {
          await workflowRuntimeRepository.updateQueueJob(job.id, 'running', 25)
          await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: 'running', progressPercent: 25 })
          await publish(instanceId, 'workflow.stage.progress')

          const orchestration = await aiOrchestratorService.orchestrate({
            organizationId: instance.organizationId,
            workflowInstanceId: instance.id,
            workflowStageId: stage.id,
            objective: `${stage.name} for ${instance.workflowName}`,
            context: { ...(instance.context ?? {}), autonomous: true, autoApprove: true },
            requestedBy: instance.initiatedBy ?? 'workflow-engine',
            correlationId: instance.correlationId,
          })

          if (orchestration.status === 'failed') {
            await workflowRuntimeRepository.updateQueueJob(job.id, 'failed', 25)
            await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: 'failed', progressPercent: 25, errorMessage: 'AI orchestration failed.' })
            await workflowRuntimeRepository.updateInstance(instanceId, { status: 'failed' })
            await workflowRuntimeRepository.addLog(instanceId, `AI orchestration failed for stage: ${stage.name}`, { planId: orchestration.plan.id }, 'error', stage.id)
            await publish(instanceId, 'workflow.failed')
            break
          }

          if (orchestration.status === 'approval_required') {
            await workflowRuntimeRepository.updateQueueJob(job.id, 'completed', 100)
            await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: 'completed', progressPercent: 100 })
            const steps = await workflowRuntimeRepository.listSteps(instanceId)
            const nextProgress = calculateWorkflowProgress(stages, steps)
            await workflowRuntimeRepository.updateInstance(instanceId, { status: 'running', progressPercent: nextProgress })
            await workflowRuntimeRepository.addLog(instanceId, `Autonomous approval bypassed for stage: ${stage.name}`, { planId: orchestration.plan.id }, 'info', stage.id)
            await publish(instanceId, 'workflow.stage.completed')
            continue
          }

          await workflowRuntimeRepository.updateQueueJob(job.id, 'completed', 100)
          await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: 'completed', progressPercent: 100 })
          const steps = await workflowRuntimeRepository.listSteps(instanceId)
          const nextProgress = calculateWorkflowProgress(stages, steps)
          await workflowRuntimeRepository.updateInstance(instanceId, { progressPercent: nextProgress })
          await workflowRuntimeRepository.addLog(instanceId, `AI stage completed: ${stage.name}`, { planId: orchestration.plan.id, runs: orchestration.runs.map((run) => run.id) }, 'info', stage.id)
          await publish(instanceId, 'workflow.stage.completed')
          continue
        }

        for (const progress of [25, 50, 75, 100]) {
          if (cancelled.has(instanceId)) break
          while (paused.has(instanceId)) await sleep(500)
          await sleep(220)
          await workflowRuntimeRepository.updateQueueJob(job.id, progress === 100 ? 'completed' : 'running', progress)
          await workflowRuntimeRepository.updateStep(instanceId, stage.id, { status: progress === 100 ? 'completed' : 'running', progressPercent: progress })
          const steps = await workflowRuntimeRepository.listSteps(instanceId)
          const nextProgress = calculateWorkflowProgress(stages, steps)
          await workflowRuntimeRepository.updateInstance(instanceId, { progressPercent: nextProgress })
          await syncSystemRuntimeState(instanceId)
          await publish(instanceId, progress === 100 ? 'workflow.stage.completed' : 'workflow.stage.progress')
        }

        await workflowRuntimeRepository.addLog(instanceId, `Stage completed: ${stage.name}`, { outputReference: `${stage.stageCode}:${instanceId}` }, 'info', stage.id)
      }

      instance = await workflowRuntimeRepository.getInstance(instanceId)
      if (!['cancelled', 'stopped', 'failed'].includes(instance.status)) {
        await workflowRuntimeRepository.updateInstance(instanceId, { status: 'completed', progressPercent: 100 })
        await syncSystemRuntimeState(instanceId, instance.workflowCode === 'SYSTEM_SHUTDOWN' ? 'stopped' : instance.workflowCode === 'SYSTEM_STARTUP' ? 'operational' : undefined)
        await workflowRuntimeRepository.addLog(instanceId, `${instance.workflowName} completed`, { finalOutput: `${instance.workflowCode}:${instanceId}` })
        await auditService.log('workflow completion', 'workflow_instances', { workflowInstanceId: instanceId, workflowCode: instance.workflowCode })
        await publish(instanceId, 'workflow.completed')
      }
    } catch (error) {
      await workflowRuntimeRepository.updateInstance(instanceId, { status: 'failed' })
      await syncSystemRuntimeState(instanceId, 'failed')
      await workflowRuntimeRepository.addLog(instanceId, error instanceof Error ? error.message : 'Workflow failed', {}, 'error')
      await publish(instanceId, 'workflow.failed')
    } finally {
      running.delete(instanceId)
    }
  },

  async transition(instanceId: string, status: WorkflowStatus, action: string) {
    if (status === 'paused') paused.add(instanceId)
    if (status === 'running') paused.delete(instanceId)
    if (status === 'cancelled' || status === 'stopped') cancelled.add(instanceId)
    await workflowRuntimeRepository.updateInstance(instanceId, { status })
    await auditService.log(action, 'workflow_instances', { workflowInstanceId: instanceId, newStatus: status })
    await workflowRuntimeRepository.addLog(instanceId, `Workflow ${action}`, { status })
    await publish(instanceId, `workflow.${action}`)
    if (status === 'running') void this.run(instanceId)
    return workflowRuntimeRepository.getSnapshot(instanceId)
  },

  async approve(instanceId: string, action: 'approved' | 'rejected' | 'changes_requested', comments?: string) {
    const status: WorkflowStatus = action === 'approved' ? 'running' : action === 'rejected' ? 'failed' : 'paused'
    await auditService.log(action, 'workflow_approvals', { workflowInstanceId: instanceId, comments })
    await workflowRuntimeRepository.addLog(instanceId, `Approval ${action}`, { comments })
    const snapshot = await this.transition(instanceId, status, action)
    await publish(instanceId, action === 'approved' ? 'workflow.approved' : action === 'rejected' ? 'workflow.rejected' : 'workflow.changes_requested')
    return snapshot
  },

  async retry(instanceId: string) {
    cancelled.delete(instanceId)
    paused.delete(instanceId)
    await workflowRuntimeRepository.addLog(instanceId, 'Retry requested', {})
    await this.transition(instanceId, 'running', 'retry')
    void this.run(instanceId)
    return workflowRuntimeRepository.getSnapshot(instanceId)
  },
}
