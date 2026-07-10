import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowSchedulesService } from './services'
import type { WorkflowSchedulesQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowSchedulesQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, status: params.get('status') ?? undefined, scheduleType: params.get('scheduleType') ?? undefined, frequency: params.get('frequency') ?? undefined, workflow: params.get('workflow') ?? undefined, queue: params.get('queue') ?? undefined, workerPool: params.get('workerPool') ?? undefined, timezone: params.get('timezone') ?? undefined, priority: params.get('priority') ?? undefined, owner: params.get('owner') ?? undefined, organization: params.get('organization') ?? undefined, brand: params.get('brand') ?? undefined, environment: params.get('environment') ?? undefined, autoOptimization: params.get('autoOptimization') ?? undefined, missedRunPolicy: params.get('missedRunPolicy') ?? undefined, capacityRisk: params.get('capacityRisk') ?? undefined, lastResult: params.get('lastResult') ?? undefined }
}

async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-schedule mutations are disabled in autonomous build mode. Schedules are maintained by the scheduler engine; emergency changes require governed controls.' })
}

export const workflowSchedulesController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowSchedulesService.dashboard(queryFromUrl(request)), 'Workflow schedules dashboard loaded.') },
  async summary() { return apiDatabase(await workflowSchedulesService.summary(), 'Workflow schedules summary loaded.') },
  async types() { return apiDatabase(await workflowSchedulesService.types(), 'Workflow schedule types loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowSchedulesService.get(await idFrom(context)), 'Workflow schedule loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowSchedulesService.versions(await idFrom(context)), 'Workflow schedule versions loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowSchedulesService.executions(await idFrom(context)), 'Workflow schedule executions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowSchedulesService.validation(await idFrom(context)), 'Workflow schedule validation loaded.') },
  async calendar() { return apiDatabase(await workflowSchedulesService.calendar(), 'Workflow schedule calendar loaded.') },
  async conflicts() { return apiDatabase(await workflowSchedulesService.conflicts(), 'Workflow schedule conflicts loaded.') },
  async capacityForecast() { return apiDatabase(await workflowSchedulesService.capacityForecast(), 'Workflow schedule capacity forecast loaded.') },
  async missedRuns() { return apiDatabase(await workflowSchedulesService.missedRuns(), 'Workflow schedule missed runs loaded.') },
  async performance() { return apiDatabase(await workflowSchedulesService.performance(), 'Workflow schedule performance loaded.') },
  async recommendations() { return apiDatabase(await workflowSchedulesService.recommendations(), 'Workflow schedule recommendations loaded.') },
  async finalOutputReadiness() { return apiDatabase(await workflowSchedulesService.finalOutputReadiness(), 'Workflow schedule final-output readiness loaded.') },
  async stream() { return apiDatabase(workflowSchedulesService.streamDescriptor(), 'Workflow schedule stream descriptor loaded.') },
  disabled,
}

export const ScheduledWorkflowsController = workflowSchedulesController
export const ScheduleExecutionController = workflowSchedulesController
export const ScheduleValidationController = workflowSchedulesController
export const ScheduleConflictController = workflowSchedulesController
export const ScheduleForecastController = workflowSchedulesController
export const ScheduleRecommendationController = workflowSchedulesController
