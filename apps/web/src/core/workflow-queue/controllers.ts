import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowQueueService } from './services'
import type { WorkflowQueueQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowQueueQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, queue: params.get('queue') ?? undefined, status: params.get('status') ?? undefined, workflow: params.get('workflow') ?? undefined, priority: params.get('priority') ?? undefined, effectivePriority: params.get('effectivePriority') ?? undefined, slaStatus: params.get('slaStatus') ?? undefined, workerType: params.get('workerType') ?? undefined, assignedWorker: params.get('assignedWorker') ?? undefined, recoveryState: params.get('recoveryState') ?? undefined, organization: params.get('organization') ?? undefined, brand: params.get('brand') ?? undefined, finalOutputImpact: params.get('finalOutputImpact') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-queue mutations are disabled in autonomous build mode. Queue operations are handled by the queue control engine unless emergency governance is enabled.' }) }

export const workflowQueueController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowQueueService.dashboard(queryFromUrl(request)), 'Workflow queue dashboard loaded.') },
  async summary() { return apiDatabase(await workflowQueueService.summary(), 'Workflow queue summary loaded.') },
  async queues() { return apiDatabase(await workflowQueueService.queues(), 'Workflow queues loaded.') },
  async items(request: NextRequest) { return apiDatabase(await workflowQueueService.items(queryFromUrl(request)), 'Workflow queue items loaded.') },
  async getItem(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowQueueService.getItem(await idFrom(context)), 'Workflow queue item loaded.') },
  async timeline(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowQueueService.timeline(await idFrom(context)), 'Workflow queue item timeline loaded.') },
  async priorityTrace(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowQueueService.priorityTrace(await idFrom(context)), 'Workflow queue priority trace loaded.') },
  async recovery(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowQueueService.recovery(await idFrom(context)), 'Workflow queue recovery loaded.') },
  async congestion() { return apiDatabase(await workflowQueueService.congestion(), 'Workflow queue congestion loaded.') },
  async capacity() { return apiDatabase(await workflowQueueService.capacity(), 'Workflow queue capacity loaded.') },
  async stuckItems() { return apiDatabase(await workflowQueueService.stuckItems(), 'Workflow queue stuck items loaded.') },
  async deadLetters() { return apiDatabase(await workflowQueueService.deadLetters(), 'Workflow queue dead letters loaded.') },
  async slaRisk() { return apiDatabase(await workflowQueueService.slaRisk(), 'Workflow queue SLA risk loaded.') },
  async dependencies(request: NextRequest) { return apiDatabase((await workflowQueueService.dashboard(queryFromUrl(request))).dependencyMap, 'Workflow queue dependency map loaded.') },
  async performance() { return apiDatabase(await workflowQueueService.performance(), 'Workflow queue performance loaded.') },
  async decisions() { return apiDatabase(await workflowQueueService.decisions(), 'Workflow queue autonomous decisions loaded.') },
  async finalOutputImpact() { return apiDatabase(await workflowQueueService.finalOutputImpact(), 'Workflow queue final-output impact loaded.') },
  async stream() { return apiDatabase(workflowQueueService.streamDescriptor(), 'Workflow queue stream descriptor loaded.') },
  disabled,
}

export const WorkflowQueueController = workflowQueueController
export const QueueDispatchController = workflowQueueController
export const QueueRecoveryController = workflowQueueController
export const QueueDeadLetterController = workflowQueueController
export const QueueCapacityController = workflowQueueController
export const QueueAnalyticsController = workflowQueueController
export const QueueEmergencyControlController = workflowQueueController
