import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowTemplatesService } from './services'
import type { WorkflowTemplatesQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowTemplatesQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, category: params.get('category') ?? undefined, status: params.get('status') ?? undefined, validationStatus: params.get('validationStatus') ?? undefined, complexity: params.get('complexity') ?? undefined, recoveryEnabled: params.get('recoveryEnabled') ?? undefined, approvalConfigured: params.get('approvalConfigured') ?? undefined, publishingConfigured: params.get('publishingConfigured') ?? undefined, analyticsConfigured: params.get('analyticsConfigured') ?? undefined, learningConfigured: params.get('learningConfigured') ?? undefined, organizationScope: params.get('organizationScope') ?? undefined, owner: params.get('owner') ?? undefined, recommended: params.get('recommended') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Workflow-template mutations are disabled in autonomous build mode. Template validation, simulation, instantiation, publication, rollback, deprecation, archive, comparison, documentation, and recommendation application are executed by governed template workflows.' }) }

export const workflowTemplatesController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowTemplatesService.dashboard(queryFromUrl(request)), 'Workflow templates dashboard loaded.') },
  async summary() { return apiDatabase(await workflowTemplatesService.summary(), 'Workflow templates summary loaded.') },
  async categories() { return apiDatabase(await workflowTemplatesService.categories(), 'Workflow template categories loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.get(await idFrom(context)), 'Workflow template loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.versions(await idFrom(context)), 'Workflow template versions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.validation(await idFrom(context)), 'Workflow template validation loaded.') },
  async simulations(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.simulations(await idFrom(context)), 'Workflow template simulations loaded.') },
  async dependencies(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.dependencies(await idFrom(context)), 'Workflow template dependencies loaded.') },
  async performance(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowTemplatesService.performance(await idFrom(context)), 'Workflow template performance loaded.') },
  async recommendations() { return apiDatabase(await workflowTemplatesService.recommendations(), 'Workflow template recommendations loaded.') },
  async finalOutputReadiness() { return apiDatabase(await workflowTemplatesService.finalOutputReadiness(), 'Workflow template final-output readiness loaded.') },
  async stream() { return apiDatabase(workflowTemplatesService.streamDescriptor(), 'Workflow templates stream descriptor loaded.') },
  disabled,
}

export const WorkflowTemplatesController = workflowTemplatesController
export const WorkflowTemplateInstantiationController = workflowTemplatesController
export const WorkflowTemplateValidationController = workflowTemplatesController
export const WorkflowTemplateSimulationController = workflowTemplatesController
export const WorkflowTemplateRecommendationController = workflowTemplatesController
export const WorkflowTemplateComparisonController = workflowTemplatesController
