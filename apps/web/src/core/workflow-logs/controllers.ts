import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowLogsService } from './services'
import type { WorkflowLogsQuery } from './repositories'

function queryFromUrl(request: NextRequest): WorkflowLogsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, level: params.get('level') ?? undefined, eventType: params.get('eventType') ?? undefined, workflow: params.get('workflow') ?? undefined, workflowStatus: params.get('workflowStatus') ?? undefined, stage: params.get('stage') ?? undefined, queue: params.get('queue') ?? undefined, worker: params.get('worker') ?? undefined, agent: params.get('agent') ?? undefined, provider: params.get('provider') ?? undefined, model: params.get('model') ?? undefined, approvalStatus: params.get('approvalStatus') ?? undefined, recoveryStrategy: params.get('recoveryStrategy') ?? undefined, outputStatus: params.get('outputStatus') ?? undefined, publishingStatus: params.get('publishingStatus') ?? undefined, analyticsStatus: params.get('analyticsStatus') ?? undefined, learningStatus: params.get('learningStatus') ?? undefined, incidentState: params.get('incidentState') ?? undefined, organization: params.get('organization') ?? undefined, brand: params.get('brand') ?? undefined, environment: params.get('environment') ?? undefined, traceId: params.get('traceId') ?? undefined, correlationId: params.get('correlationId') ?? undefined, status: params.get('status') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function traceFrom(context: { params: Promise<{ traceId: string }> }) { return (await context.params).traceId }
async function instanceFrom(context: { params: Promise<{ instanceId: string }> }) { return (await context.params).instanceId }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual workflow-log mutations are disabled in autonomous build mode. Search, trace, retention, alert, investigation, export, and incident actions are governed by the workflow observability engine.' }) }

export const workflowLogsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await workflowLogsService.dashboard(queryFromUrl(request)), 'Workflow logs dashboard loaded.') },
  async summary() { return apiDatabase(await workflowLogsService.summary(), 'Workflow logs summary loaded.') },
  async search(request: NextRequest) { return apiDatabase(await workflowLogsService.search(queryFromUrl(request)), 'Workflow logs search loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowLogsService.get(await idFrom(context)), 'Workflow log event loaded.') },
  async context(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await workflowLogsService.context(await idFrom(context)), 'Workflow log event context loaded.') },
  async trace(_request: NextRequest, context: { params: Promise<{ traceId: string }> }) { return apiDatabase(await workflowLogsService.trace(await traceFrom(context)), 'Workflow trace loaded.') },
  async instanceTrace(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) { return apiDatabase(await workflowLogsService.instanceTrace(await instanceFrom(context)), 'Workflow instance trace loaded.') },
  async timeline(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) { return apiDatabase(await workflowLogsService.timeline(await instanceFrom(context)), 'Workflow stage timeline loaded.') },
  async recovery(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) { return apiDatabase(await workflowLogsService.recovery(await instanceFrom(context)), 'Workflow recovery history loaded.') },
  async lineage(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) { return apiDatabase(await workflowLogsService.lineage(await instanceFrom(context)), 'Workflow output lineage loaded.') },
  async errorClusters() { return apiDatabase(await workflowLogsService.errorClusters(), 'Workflow error clusters loaded.') },
  async savedViews() { return apiDatabase(await workflowLogsService.savedViews(), 'Workflow log saved views loaded.') },
  async alertRules() { return apiDatabase(await workflowLogsService.alertRules(), 'Workflow log alert rules loaded.') },
  async investigations() { return apiDatabase(await workflowLogsService.investigations(), 'Workflow log investigations loaded.') },
  async analytics() { return apiDatabase(await workflowLogsService.analytics(), 'Workflow log analytics loaded.') },
  async retention() { return apiDatabase(await workflowLogsService.retention(), 'Workflow log retention loaded.') },
  async stream() { return apiDatabase(workflowLogsService.streamDescriptor(), 'Workflow logs stream descriptor loaded.') },
  disabled,
}

export const WorkflowLogsController = workflowLogsController
export const WorkflowTraceController = workflowLogsController
export const WorkflowLineageController = workflowLogsController
export const WorkflowLogAlertController = workflowLogsController
export const WorkflowInvestigationController = workflowLogsController
export const WorkflowLogExportController = workflowLogsController
