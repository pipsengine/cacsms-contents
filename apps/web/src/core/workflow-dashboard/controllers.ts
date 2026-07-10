import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowDashboardService } from './services'
import type { WorkflowDashboardQuery } from './types'

function queryFromUrl(request: NextRequest): WorkflowDashboardQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    status: params.get('status') ?? undefined,
    workflowType: params.get('workflowType') ?? undefined,
    priority: params.get('priority') ?? undefined,
    recoveryState: params.get('recoveryState') ?? undefined,
  }
}

async function disabled() {
  return apiResponse({
    data: null,
    status: 'error',
    httpStatus: 405,
    message: 'Manual workflow dashboard actions are disabled in autonomous mode. Use the landing page Start/Stop control for operator-level control.',
  })
}

export const workflowDashboardController = {
  async dashboard(request: NextRequest) {
    return apiDatabase(await workflowDashboardService.dashboard(queryFromUrl(request)), 'Workflow dashboard loaded.')
  },
  async summary() {
    return apiDatabase(await workflowDashboardService.summary(), 'Workflow dashboard summary loaded.')
  },
  async pipeline() {
    return apiDatabase(await workflowDashboardService.pipeline(), 'Workflow dashboard pipeline loaded.')
  },
  async categories() {
    return apiDatabase(await workflowDashboardService.categories(), 'Workflow categories loaded.')
  },
  async recoveries() {
    return apiDatabase(await workflowDashboardService.recoveries(), 'Workflow recoveries loaded.')
  },
  async queues() {
    return apiDatabase(await workflowDashboardService.queues(), 'Workflow queues loaded.')
  },
  async definitionHealth() {
    return apiDatabase(await workflowDashboardService.definitionHealth(), 'Workflow definition health loaded.')
  },
  async decisions() {
    return apiDatabase(await workflowDashboardService.decisions(), 'Workflow autonomous decisions loaded.')
  },
  async outputReadiness() {
    return apiDatabase(await workflowDashboardService.outputReadiness(), 'Workflow final output readiness loaded.')
  },
  async stream() {
    return apiDatabase(workflowDashboardService.streamDescriptor(), 'Workflow dashboard stream descriptor loaded.')
  },
  disabled,
}
