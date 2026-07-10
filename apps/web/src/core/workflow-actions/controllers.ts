import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowActionsService } from './services'
import type { WorkflowActionsQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowActionsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, status: params.get('status') ?? undefined, category: params.get('category') ?? undefined, actionType: params.get('actionType') ?? undefined, environment: params.get('environment') ?? undefined, queue: params.get('queue') ?? undefined, workerPool: params.get('workerPool') ?? undefined, permission: params.get('permission') ?? undefined, owner: params.get('owner') ?? undefined, organization: params.get('organization') ?? undefined, retryEnabled: params.get('retryEnabled') ?? undefined, recoveryEnabled: params.get('recoveryEnabled') ?? undefined, idempotent: params.get('idempotent') ?? undefined }
}

async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-action mutations are disabled in autonomous build mode. Actions are executed by the database-backed workflow engine after the global Start control enables automation.' })
}

export const workflowActionsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowActionsService.dashboard(queryFromUrl(request)), 'Workflow actions dashboard loaded.') },
  async summary() { return apiDatabase(await workflowActionsService.summary(), 'Workflow action summary loaded.') },
  async categories() { return apiDatabase(await workflowActionsService.categories(), 'Workflow action categories loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.get(await idFrom(context)), 'Workflow action loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.versions(await idFrom(context)), 'Workflow action versions loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.executions(await idFrom(context)), 'Workflow action executions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.validation(await idFrom(context)), 'Workflow action validation loaded.') },
  async tests(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.tests(await idFrom(context)), 'Workflow action tests loaded.') },
  async trace(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowActionsService.trace(await idFrom(context)), 'Workflow action trace loaded.') },
  async recoveries() { return apiDatabase(await workflowActionsService.recoveries(), 'Workflow action recoveries loaded.') },
  async circuitBreakers() { return apiDatabase(await workflowActionsService.circuitBreakers(), 'Workflow action circuit breakers loaded.') },
  async performance() { return apiDatabase(await workflowActionsService.performance(), 'Workflow action performance loaded.') },
  async recommendations() { return apiDatabase(await workflowActionsService.recommendations(), 'Workflow action recommendations loaded.') },
  async finalOutputLinkage() { return apiDatabase(await workflowActionsService.finalOutputLinkage(), 'Workflow action final-output linkage loaded.') },
  async stream() { return apiDatabase(workflowActionsService.streamDescriptor(), 'Workflow action stream descriptor loaded.') },
  disabled,
}

export const WorkflowActionsController = workflowActionsController
export const ActionExecutionController = workflowActionsController
export const ActionRecoveryController = workflowActionsController
export const ActionRecommendationController = workflowActionsController
