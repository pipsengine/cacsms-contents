import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { activeWorkflowService } from './services'
import type { ActiveWorkflowsQuery } from './repositories'

function queryFromUrl(request: NextRequest): ActiveWorkflowsQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    workflowType: params.get('workflowType') ?? undefined,
    status: params.get('status') ?? undefined,
    currentStage: params.get('currentStage') ?? undefined,
    priority: params.get('priority') ?? undefined,
    slaStatus: params.get('slaStatus') ?? undefined,
    queue: params.get('queue') ?? undefined,
    worker: params.get('worker') ?? undefined,
    approvalState: params.get('approvalState') ?? undefined,
    recoveryState: params.get('recoveryState') ?? undefined,
    organization: params.get('organization') ?? undefined,
    brand: params.get('brand') ?? undefined,
    finalOutput: params.get('finalOutput') ?? undefined,
  }
}

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return id
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Emergency workflow controls are disabled from routine pages. Autonomous recovery handles active workflows unless elevated emergency operations are explicitly enabled.' })
}

export const activeWorkflowsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await activeWorkflowService.dashboard(queryFromUrl(request)), 'Active workflows dashboard loaded.') },
  async summary() { return apiDatabase(await activeWorkflowService.summary(), 'Active workflow summary loaded.') },
  async pipeline() { return apiDatabase(await activeWorkflowService.pipeline(), 'Active workflow pipeline loaded.') },
  async bottlenecks() { return apiDatabase(await activeWorkflowService.bottlenecks(), 'Active workflow bottlenecks loaded.') },
  async risks() { return apiDatabase(await activeWorkflowService.risks(), 'Active workflow SLA risks loaded.') },
  async decisions() { return apiDatabase(await activeWorkflowService.decisions(), 'Active workflow autonomous decisions loaded.') },
  async stream() { return apiDatabase(activeWorkflowService.streamDescriptor(), 'Active workflow stream descriptor loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.get(await idFrom(context)), 'Active workflow details loaded.') },
  async stages(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.stages(await idFrom(context)), 'Active workflow stages loaded.') },
  async agents(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.agents(await idFrom(context)), 'Active workflow agents loaded.') },
  async jobs(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.jobs(await idFrom(context)), 'Active workflow jobs loaded.') },
  async recovery(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.recovery(await idFrom(context)), 'Active workflow recovery loaded.') },
  async outputReadiness(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.outputReadiness(await idFrom(context)), 'Active workflow output readiness loaded.') },
  async map(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeWorkflowService.map(await idFrom(context)), 'Active workflow execution map loaded.') },
  disabled,
}

export const ActiveWorkflowsController = activeWorkflowsController
