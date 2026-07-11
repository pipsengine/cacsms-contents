import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { recoveryPoliciesService } from './services'
import type { RecoveryPoliciesQuery } from './repositories'

function queryFromUrl(request: NextRequest): RecoveryPoliciesQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, category: params.get('category') ?? undefined, status: params.get('status') ?? undefined, failureScope: params.get('failureScope') ?? undefined, primaryStrategy: params.get('primaryStrategy') ?? undefined, fallbackStrategy: params.get('fallbackStrategy') ?? undefined, owner: params.get('owner') ?? undefined, environment: params.get('environment') ?? undefined, finalOutputProtection: params.get('finalOutputProtection') ?? undefined, humanEscalation: params.get('humanEscalation') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Recovery-policy mutations are disabled in autonomous build mode. Creation, validation, simulation, publication, rollback, conflict resolution, documentation, and emergency controls run through governed recovery-policy-management jobs.' }) }

export const recoveryPoliciesController = {
  async dashboard(request: NextRequest) { return apiDatabase(await recoveryPoliciesService.dashboard(queryFromUrl(request)), 'Recovery policies dashboard loaded.') },
  async summary() { return apiDatabase(await recoveryPoliciesService.summary(), 'Recovery policies summary loaded.') },
  async categories() { return apiDatabase(await recoveryPoliciesService.categories(), 'Recovery policy categories loaded.') },
  async list(request: NextRequest) { return apiDatabase(await recoveryPoliciesService.list(queryFromUrl(request)), 'Recovery policies loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.get(await idFrom(context)), 'Recovery policy loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.versions(await idFrom(context)), 'Recovery policy versions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.validation(await idFrom(context)), 'Recovery policy validation loaded.') },
  async simulations(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.simulations(await idFrom(context)), 'Recovery policy simulations loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.executions(await idFrom(context)), 'Recovery policy executions loaded.') },
  async decisionTrace(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await recoveryPoliciesService.decisionTrace(await idFrom(context)), 'Recovery policy decision trace loaded.') },
  async conflicts() { return apiDatabase(await recoveryPoliciesService.conflicts(), 'Recovery policy conflicts loaded.') },
  async coverage() { return apiDatabase(await recoveryPoliciesService.coverage(), 'Recovery policy coverage loaded.') },
  async performance() { return apiDatabase(await recoveryPoliciesService.performance(), 'Recovery policy performance loaded.') },
  async recommendations() { return apiDatabase(await recoveryPoliciesService.recommendations(), 'Recovery policy recommendations loaded.') },
  async finalOutputProtection() { return apiDatabase(await recoveryPoliciesService.finalOutputProtection(), 'Recovery policy final-output protection loaded.') },
  async stream() { return apiDatabase(recoveryPoliciesService.streamDescriptor(), 'Recovery policies stream descriptor loaded.') },
  disabled,
}

export const RecoveryPoliciesController = recoveryPoliciesController
export const RecoveryPolicyValidationController = recoveryPoliciesController
export const RecoveryPolicySimulationController = recoveryPoliciesController
export const RecoveryPolicyExecutionController = recoveryPoliciesController
export const RecoveryPolicyConflictController = recoveryPoliciesController
export const RecoveryPolicyRecommendationController = recoveryPoliciesController
export const RecoveryPolicyGovernanceController = recoveryPoliciesController

