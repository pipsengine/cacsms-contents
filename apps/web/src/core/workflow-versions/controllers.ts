import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowVersionsService } from './services'
import type { WorkflowVersionsQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowVersionsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, versionStatus: params.get('versionStatus') ?? undefined, validationStatus: params.get('validationStatus') ?? undefined, compatibilityStatus: params.get('compatibilityStatus') ?? undefined, environment: params.get('environment') ?? undefined, rolloutStrategy: params.get('rolloutStrategy') ?? undefined, workflow: params.get('workflow') ?? undefined, owner: params.get('owner') ?? undefined, finalOutputCompatibility: params.get('finalOutputCompatibility') ?? undefined, rollbackState: params.get('rollbackState') ?? undefined }
}

async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Workflow-version mutations are disabled in autonomous build mode. Validation, simulation, release, rollout, rollback, migration, documentation, drift correction, and archive actions are executed by governed workflow-version management jobs.' }) }

export const workflowVersionsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowVersionsService.dashboard(queryFromUrl(request)), 'Workflow versions dashboard loaded.') },
  async summary() { return apiDatabase(await workflowVersionsService.summary(), 'Workflow versions summary loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.get(await idFrom(context)), 'Workflow version loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.validation(await idFrom(context)), 'Workflow version validation loaded.') },
  async compatibility(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.compatibility(await idFrom(context)), 'Workflow version compatibility loaded.') },
  async dependencies(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.dependencies(await idFrom(context)), 'Workflow version dependencies loaded.') },
  async releaseReadiness(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.releaseReadiness(await idFrom(context)), 'Workflow version release readiness loaded.') },
  async health(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.health(await idFrom(context)), 'Workflow version health loaded.') },
  async finalOutputCompatibility(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.finalOutputCompatibility(await idFrom(context)), 'Workflow version final-output compatibility loaded.') },
  async rollouts() { return apiDatabase(await workflowVersionsService.rollouts(), 'Workflow version rollouts loaded.') },
  async rollout(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.rollout(await idFrom(context)), 'Workflow version rollout loaded.') },
  async rolloutCanary(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.rolloutCanary(await idFrom(context)), 'Workflow version canary metrics loaded.') },
  async rolloutHealth(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowVersionsService.rolloutHealth(await idFrom(context)), 'Workflow version rollout health loaded.') },
  async drift() { return apiDatabase(await workflowVersionsService.drift(), 'Workflow version drift loaded.') },
  async migrations() { return apiDatabase(await workflowVersionsService.migrations(), 'Workflow version migrations loaded.') },
  async stream() { return apiDatabase(workflowVersionsService.streamDescriptor(), 'Workflow versions stream descriptor loaded.') },
  disabled,
}

export const WorkflowVersionsController = workflowVersionsController
export const WorkflowVersionValidationController = workflowVersionsController
export const WorkflowVersionCompatibilityController = workflowVersionsController
export const WorkflowVersionReleaseController = workflowVersionsController
export const WorkflowVersionRolloutController = workflowVersionsController
export const WorkflowVersionRollbackController = workflowVersionsController
export const WorkflowVersionMigrationController = workflowVersionsController
export const WorkflowVersionDriftController = workflowVersionsController
export const WorkflowVersionFinalOutputController = workflowVersionsController

