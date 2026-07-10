import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { logsService } from './services'
import type { LogQuery } from './types'

function queryFromUrl(request: NextRequest): LogQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    level: params.get('level') ?? undefined,
    sourceType: params.get('sourceType') ?? undefined,
    service: params.get('service') ?? undefined,
    module: params.get('module') ?? undefined,
    environment: params.get('environment') ?? undefined,
    traceId: params.get('traceId') ?? undefined,
    correlationId: params.get('correlationId') ?? undefined,
    requestId: params.get('requestId') ?? undefined,
    page: params.get('page') ? Number(params.get('page')) : undefined,
    pageSize: params.get('pageSize') ? Number(params.get('pageSize')) : undefined,
  }
}

async function body(request: NextRequest) {
  try {
    return (await request.json()) as LogQuery
  } catch {
    return {}
  }
}

function disabled(message: string) {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message })
}

export const logsController = {
  async dashboard(request: NextRequest) {
    return apiDatabase(await logsService.dashboard(queryFromUrl(request)), 'Logs dashboard loaded.')
  },
  async summary() {
    return apiDatabase(await logsService.summary(), 'Logs summary loaded.')
  },
  async search(request: NextRequest) {
    return apiDatabase(await logsService.search(queryFromUrl(request)), 'Logs search loaded.')
  },
  async query(request: NextRequest) {
    return apiDatabase(await logsService.search(await body(request)), 'Logs query loaded.')
  },
  async getLog(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await logsService.getLog(id), 'Log entry loaded.')
  },
  async context(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await logsService.context(id), 'Log context loaded.')
  },
  async trace(_request: NextRequest, context: { params: Promise<{ traceId: string }> }) {
    const { traceId } = await context.params
    return apiDatabase(await logsService.trace(traceId), 'Trace loaded.')
  },
  async correlation(_request: NextRequest, context: { params: Promise<{ correlationId: string }> }) {
    const { correlationId } = await context.params
    return apiDatabase(await logsService.correlation(correlationId), 'Correlation loaded.')
  },
  async errorClusters() {
    return apiDatabase(await logsService.errorClusters(), 'Error clusters loaded.')
  },
  async sources() {
    return apiDatabase(await logsService.sources(), 'Log sources loaded.')
  },
  async sourceHealth() {
    return apiDatabase(await logsService.sourceHealth(), 'Log source health loaded.')
  },
  async savedViews() {
    return apiDatabase(await logsService.savedViews(), 'Log saved views loaded.')
  },
  async alertRules() {
    return apiDatabase(await logsService.alertRules(), 'Log alert rules loaded.')
  },
  async investigations() {
    return apiDatabase(await logsService.investigations(), 'Log investigations loaded.')
  },
  async retention() {
    return apiDatabase(await logsService.retention(), 'Log retention loaded.')
  },
  async stream() {
    return apiDatabase(logsService.streamDescriptor(), 'Logs stream descriptor loaded.')
  },
  async createDisabled() {
    return disabled('Manual log management actions are disabled in autonomous mode. Logs are ingested, correlated, retained, and displayed automatically.')
  },
}
