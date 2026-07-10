import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { failedWorkflowsService } from './services'
import type { FailedWorkflowsQuery } from './repositories'

function queryFromUrl(request: NextRequest): FailedWorkflowsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, status: params.get('status') ?? undefined, category: params.get('category') ?? undefined, severity: params.get('severity') ?? undefined, workflow: params.get('workflow') ?? undefined, failedStage: params.get('failedStage') ?? undefined, recoveryPolicy: params.get('recoveryPolicy') ?? undefined, checkpoint: params.get('checkpoint') ?? undefined, outputPreserved: params.get('outputPreserved') ?? undefined, worker: params.get('worker') ?? undefined, queue: params.get('queue') ?? undefined, provider: params.get('provider') ?? undefined, model: params.get('model') ?? undefined, slaStatus: params.get('slaStatus') ?? undefined, publishingImpact: params.get('publishingImpact') ?? undefined, finalOutputImpact: params.get('finalOutputImpact') ?? undefined, incident: params.get('incident') ?? undefined, organization: params.get('organization') ?? undefined, brand: params.get('brand') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual failed-workflow mutations are disabled in autonomous build mode. Recovery is executed by the failure recovery engine unless emergency governance is enabled.' }) }

export const failedWorkflowsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await failedWorkflowsService.dashboard(queryFromUrl(request)), 'Failed workflows dashboard loaded.') },
  async summary() { return apiDatabase(await failedWorkflowsService.summary(), 'Failed workflows summary loaded.') },
  async categories() { return apiDatabase(await failedWorkflowsService.categories(), 'Failure categories loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.get(await idFrom(context)), 'Failed workflow loaded.') },
  async diagnosis(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.diagnosis(await idFrom(context)), 'Failure diagnosis loaded.') },
  async rootCause(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.rootCause(await idFrom(context)), 'Failure root cause loaded.') },
  async recovery(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.recovery(await idFrom(context)), 'Failure recovery loaded.') },
  async checkpoints(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.checkpoints(await idFrom(context)), 'Failure checkpoints loaded.') },
  async outputs(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.outputs(await idFrom(context)), 'Failure outputs loaded.') },
  async timeline(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await failedWorkflowsService.timeline(await idFrom(context)), 'Failure timeline loaded.') },
  async repeatedPatterns() { return apiDatabase(await failedWorkflowsService.repeatedPatterns(), 'Repeated failure patterns loaded.') },
  async recoveryPolicies() { return apiDatabase(await failedWorkflowsService.recoveryPolicies(), 'Recovery policies loaded.') },
  async recoveries() { return apiDatabase(await failedWorkflowsService.recoveries(), 'Recoveries loaded.') },
  async incidents() { return apiDatabase(await failedWorkflowsService.incidents(), 'Failure incidents loaded.') },
  async analytics() { return apiDatabase(await failedWorkflowsService.analytics(), 'Failure analytics loaded.') },
  async finalOutputProtection() { return apiDatabase(await failedWorkflowsService.finalOutputProtection(), 'Final output protection loaded.') },
  async stream() { return apiDatabase(failedWorkflowsService.streamDescriptor(), 'Failed workflows stream descriptor loaded.') },
  disabled,
}

export const FailedWorkflowsController = failedWorkflowsController
export const FailureDiagnosisController = failedWorkflowsController
export const RecoveryController = failedWorkflowsController
export const CheckpointRecoveryController = failedWorkflowsController
export const CompensationController = failedWorkflowsController
export const FailureAnalyticsController = failedWorkflowsController
export const RecoveryEmergencyControlController = failedWorkflowsController
