import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentAnalyticsService } from './services'
import type { AgentAnalyticsQuery } from './repositories'

function queryFromUrl(request: NextRequest): AgentAnalyticsQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, domain: p.get('domain') ?? undefined, status: p.get('status') ?? undefined, trend: p.get('trend') ?? undefined }
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent Analytics mutations are disabled in build mode. Refresh, anomaly detection, forecasts, comparisons, reports, scheduled reports, alert rules, exports, KPI recalculation, metric rebuilds, recommendations, and emergency controls run through governed agent-analytics jobs.' })
}

export const agentAnalyticsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentAnalyticsService.dashboard(queryFromUrl(request)), 'Agent analytics dashboard loaded.') },
  async summary() { return apiDatabase(await agentAnalyticsService.summary(), 'Agent analytics summary loaded.') },
  async status() { return apiDatabase(await agentAnalyticsService.status(), 'Agent analytics status loaded.') },
  async coverage() { return apiDatabase(await agentAnalyticsService.coverage(), 'Agent analytics coverage loaded.') },
  async agents(request: NextRequest) { return apiDatabase(await agentAnalyticsService.agents(queryFromUrl(request)), 'Agent performance analytics loaded.') },
  async dimensions() { return apiDatabase(await agentAnalyticsService.dimensions(), 'Agent analytics dimensions loaded.') },
  async panels() { return apiDatabase(await agentAnalyticsService.panels(), 'Agent analytics panels loaded.') },
  async businessImpact() { return apiDatabase(await agentAnalyticsService.businessImpact(), 'Business impact analytics loaded.') },
  async finalOutput() { return apiDatabase(await agentAnalyticsService.finalOutput(), 'Final output traceability loaded.') },
  async anomalies() { return apiDatabase(await agentAnalyticsService.anomalies(), 'Analytics anomalies loaded.') },
  async forecasts() { return apiDatabase(await agentAnalyticsService.forecasts(), 'Analytics forecasts loaded.') },
  async recommendations() { return apiDatabase(await agentAnalyticsService.recommendations(), 'Analytics recommendations loaded.') },
  async stream() { return apiDatabase(agentAnalyticsService.streamDescriptor(), 'Agent analytics stream descriptor loaded.') },
  disabled,
}

export const AgentAnalyticsController = agentAnalyticsController
