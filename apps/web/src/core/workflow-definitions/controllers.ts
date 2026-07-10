import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowDefinitionsService } from './services'
import type { WorkflowDefinitionsQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowDefinitionsQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    status: params.get('status') ?? undefined,
    validationStatus: params.get('validationStatus') ?? undefined,
    category: params.get('category') ?? undefined,
    workflowType: params.get('workflowType') ?? undefined,
    owner: params.get('owner') ?? undefined,
    environment: params.get('environment') ?? undefined,
    recoveryPolicy: params.get('recoveryPolicy') ?? undefined,
    finalOutput: params.get('finalOutput') ?? undefined,
  }
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-definition mutations are disabled in autonomous mode. Definitions are managed by the database-backed workflow architecture until editing is explicitly enabled.' })
}

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return id
}

export const workflowDefinitionsController = {
  async dashboard(request: NextRequest) {
    return apiDatabase(await workflowDefinitionsService.dashboard(queryFromUrl(request)), 'Workflow definitions dashboard loaded.')
  },
  async summary() { return apiDatabase(await workflowDefinitionsService.summary(), 'Workflow definitions summary loaded.') },
  async categories() { return apiDatabase(await workflowDefinitionsService.categories(), 'Workflow definition categories loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.get(await idFrom(context)), 'Workflow definition loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.versions(await idFrom(context)), 'Workflow definition versions loaded.') },
  async health(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.health(await idFrom(context)), 'Workflow definition health loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.validation(await idFrom(context)), 'Workflow definition validation loaded.') },
  async dependencies(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.dependencies(await idFrom(context)), 'Workflow definition dependencies loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.executions(await idFrom(context)), 'Workflow definition executions loaded.') },
  async documentation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowDefinitionsService.documentation(await idFrom(context)), 'Workflow definition documentation loaded.') },
  async recommendations() { return apiDatabase(await workflowDefinitionsService.recommendations(), 'Workflow definition recommendations loaded.') },
  async stream() { return apiDatabase(workflowDefinitionsService.streamDescriptor(), 'Workflow definitions stream descriptor loaded.') },
  disabled,
}
