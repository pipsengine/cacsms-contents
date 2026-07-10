import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowAnalyticsService } from './services'
import type { WorkflowAnalyticsQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowAnalyticsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, category: params.get('category') ?? undefined, workflow: params.get('workflow') ?? undefined, owner: params.get('owner') ?? undefined, slaStatus: params.get('slaStatus') ?? undefined, healthRange: params.get('healthRange') ?? undefined, finalOutputRange: params.get('finalOutputRange') ?? undefined, dateRange: params.get('dateRange') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Workflow analytics mutations are disabled in autonomous build mode. Optimization scans, recommendation application, comparisons, reports, exports, audit events, and notifications are executed by governed workflow-analytics jobs.' }) }

export const workflowAnalyticsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowAnalyticsService.dashboard(queryFromUrl(request)), 'Workflow analytics dashboard loaded.') },
  async summary() { return apiDatabase(await workflowAnalyticsService.summary(), 'Workflow analytics summary loaded.') },
  async performance(request: NextRequest) { return apiDatabase(await workflowAnalyticsService.performance(queryFromUrl(request)), 'Workflow performance analytics loaded.') },
  async categories() { return apiDatabase(await workflowAnalyticsService.categories(), 'Workflow category analytics loaded.') },
  async workflows(request: NextRequest) { return apiDatabase(await workflowAnalyticsService.workflows(queryFromUrl(request)), 'Workflow analytics rows loaded.') },
  async workflow(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowAnalyticsService.workflow(await idFrom(context)), 'Workflow analytics detail loaded.') },
  async bottlenecks() { return apiDatabase(await workflowAnalyticsService.bottlenecks(), 'Workflow bottlenecks loaded.') },
  async duration() { return apiDatabase(await workflowAnalyticsService.duration(), 'Workflow duration analytics loaded.') },
  async reliability() { return apiDatabase(await workflowAnalyticsService.reliability(), 'Workflow reliability analytics loaded.') },
  async cost() { return apiDatabase(await workflowAnalyticsService.cost(), 'Workflow cost analytics loaded.') },
  async autonomy() { return apiDatabase(await workflowAnalyticsService.autonomy(), 'Workflow autonomy analytics loaded.') },
  async sla() { return apiDatabase(await workflowAnalyticsService.sla(), 'Workflow SLA analytics loaded.') },
  async finalOutput() { return apiDatabase(await workflowAnalyticsService.finalOutput(), 'Workflow final-output analytics loaded.') },
  async agents() { return apiDatabase(await workflowAnalyticsService.agents(), 'Workflow agent analytics loaded.') },
  async approvals() { return apiDatabase(await workflowAnalyticsService.approvals(), 'Workflow approval analytics loaded.') },
  async queues() { return apiDatabase(await workflowAnalyticsService.queues(), 'Workflow queue analytics loaded.') },
  async workers() { return apiDatabase(await workflowAnalyticsService.workers(), 'Workflow worker analytics loaded.') },
  async recovery() { return apiDatabase(await workflowAnalyticsService.recovery(), 'Workflow recovery analytics loaded.') },
  async predictions() { return apiDatabase(await workflowAnalyticsService.predictions(), 'Workflow predictions loaded.') },
  async recommendations() { return apiDatabase(await workflowAnalyticsService.recommendations(), 'Workflow optimization recommendations loaded.') },
  async businessImpact() { return apiDatabase(await workflowAnalyticsService.businessImpact(), 'Workflow business impact loaded.') },
  async stream() { return apiDatabase(workflowAnalyticsService.streamDescriptor(), 'Workflow analytics stream descriptor loaded.') },
  disabled,
}

export const WorkflowAnalyticsController = workflowAnalyticsController
export const WorkflowPerformanceController = workflowAnalyticsController
export const WorkflowPredictionController = workflowAnalyticsController
export const WorkflowOptimizationController = workflowAnalyticsController
export const WorkflowComparisonController = workflowAnalyticsController
export const WorkflowBusinessImpactController = workflowAnalyticsController

