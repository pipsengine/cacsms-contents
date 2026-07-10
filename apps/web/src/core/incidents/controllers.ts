import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { incidentService } from './services'
import type { IncidentQuery } from './types'

function queryFromUrl(request: NextRequest): IncidentQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    severity: params.get('severity') ?? undefined,
    priority: params.get('priority') ?? undefined,
    status: params.get('status') ?? undefined,
    source: params.get('source') ?? undefined,
    service: params.get('service') ?? undefined,
    module: params.get('module') ?? undefined,
    environment: params.get('environment') ?? undefined,
    team: params.get('team') ?? undefined,
    slaStatus: params.get('slaStatus') ?? undefined,
    customerImpact: params.get('customerImpact') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : undefined,
    pageSize: params.get('pageSize') ? Number(params.get('pageSize')) : undefined,
  }
}

async function disabled() {
  return apiResponse({
    data: null,
    status: 'error',
    httpStatus: 405,
    message: 'Manual incident actions are disabled in autonomous mode. Incident detection, assignment, investigation, diagnostics, remediation, communications, resolution, and postmortems are driven by the system workflow. Use the landing page Start/Stop control to manage the autonomous system.',
  })
}

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return id
}

export const incidentController = {
  async dashboard(request: NextRequest) {
    return apiDatabase(await incidentService.dashboard(queryFromUrl(request)), 'Incident management dashboard loaded.')
  },
  async summary() {
    return apiDatabase(await incidentService.summary(), 'Incident summary loaded.')
  },
  async queues() {
    return apiDatabase(await incidentService.queues(), 'Incident queues loaded.')
  },
  async list(request: NextRequest) {
    return apiDatabase(await incidentService.list(queryFromUrl(request)), 'Incidents loaded.')
  },
  async analytics() {
    return apiDatabase(await incidentService.analytics(), 'Incident analytics loaded.')
  },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.get(await idFrom(context)), 'Incident detail loaded.')
  },
  async timeline(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.timeline(await idFrom(context)), 'Incident timeline loaded.')
  },
  async related(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.related(await idFrom(context)), 'Incident related entities loaded.')
  },
  async responders(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_responders'), 'Incident responders loaded.')
  },
  async communications(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_communications'), 'Incident communications loaded.')
  },
  async bridge(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_bridge_sessions'), 'Incident bridge loaded.')
  },
  async diagnostics(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_diagnostics'), 'Incident diagnostics loaded.')
  },
  async remediations(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_remediations'), 'Incident remediations loaded.')
  },
  async rootCause(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_root_causes'), 'Incident root cause loaded.')
  },
  async postmortem(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_postmortems'), 'Incident postmortem loaded.')
  },
  async actionItems(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await incidentService.incidentSection(await idFrom(context), 'incident_action_items'), 'Incident action items loaded.')
  },
  async stream() {
    return apiDatabase(incidentService.streamDescriptor(), 'Incident stream descriptor loaded.')
  },
  disabled,
}
