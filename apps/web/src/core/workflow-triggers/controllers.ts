import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowTriggersService } from './services'
import type { WorkflowTriggersQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowTriggersQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, triggerType: params.get('triggerType') ?? undefined, category: params.get('category') ?? undefined, status: params.get('status') ?? undefined, source: params.get('source') ?? undefined, workflow: params.get('workflow') ?? undefined, environment: params.get('environment') ?? undefined, organization: params.get('organization') ?? undefined, owner: params.get('owner') ?? undefined, priority: params.get('priority') ?? undefined, deduplication: params.get('deduplication') ?? undefined, failureState: params.get('failureState') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-trigger mutations are disabled in autonomous build mode. Trigger operations are observed from the database-backed trigger engine until governed editing is explicitly enabled.' }) }

export const workflowTriggersController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowTriggersService.dashboard(queryFromUrl(request)), 'Workflow triggers dashboard loaded.') },
  async summary() { return apiDatabase(await workflowTriggersService.summary(), 'Workflow trigger summary loaded.') },
  async types() { return apiDatabase(await workflowTriggersService.types(), 'Workflow trigger types loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTriggersService.get(await idFrom(context)), 'Workflow trigger loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTriggersService.versions(await idFrom(context)), 'Workflow trigger versions loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTriggersService.executions(await idFrom(context)), 'Workflow trigger executions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTriggersService.validation(await idFrom(context)), 'Workflow trigger validation loaded.') },
  async tests(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTriggersService.tests(await idFrom(context)), 'Workflow trigger tests loaded.') },
  async events() { return apiDatabase(await workflowTriggersService.events(), 'Workflow trigger events loaded.') },
  async deadLetters() { return apiDatabase(await workflowTriggersService.deadLetters(), 'Workflow trigger dead letters loaded.') },
  async conflicts() { return apiDatabase(await workflowTriggersService.conflicts(), 'Workflow trigger conflicts loaded.') },
  async performance() { return apiDatabase(await workflowTriggersService.performance(), 'Workflow trigger performance loaded.') },
  async recommendations() { return apiDatabase(await workflowTriggersService.recommendations(), 'Workflow trigger recommendations loaded.') },
  async finalOutputLinkage() { return apiDatabase(await workflowTriggersService.finalOutputLinkage(), 'Workflow trigger final-output linkage loaded.') },
  async stream() { return apiDatabase(workflowTriggersService.streamDescriptor(), 'Workflow trigger stream descriptor loaded.') },
  disabled,
}

export const WorkflowTriggersController = workflowTriggersController
export const TriggerExecutionController = workflowTriggersController
export const TriggerValidationController = workflowTriggersController
export const TriggerTestController = workflowTriggersController
export const TriggerReplayController = workflowTriggersController
export const TriggerDeadLetterController = workflowTriggersController
export const TriggerRecommendationController = workflowTriggersController
