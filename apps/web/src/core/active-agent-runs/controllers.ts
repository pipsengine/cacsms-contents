import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { activeAgentRunsService } from './services'
import type { ActiveAgentRunsQuery } from './repositories'

function queryFromUrl(request: NextRequest): ActiveAgentRunsQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, agent: p.get('agent') ?? undefined, domain: p.get('domain') ?? undefined, status: p.get('status') ?? undefined, workflow: p.get('workflow') ?? undefined, stage: p.get('stage') ?? undefined, priority: p.get('priority') ?? undefined, provider: p.get('provider') ?? undefined, model: p.get('model') ?? undefined, queue: p.get('queue') ?? undefined, worker: p.get('worker') ?? undefined, recoveryState: p.get('recoveryState') ?? undefined, deadlineRisk: p.get('deadlineRisk') ?? undefined, finalOutputImpact: p.get('finalOutputImpact') ?? undefined, organization: p.get('organization') ?? undefined, brand: p.get('brand') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Active agent run mutations are disabled in autonomous build mode. Diagnostics, priority calculation, recovery, routing, rebalancing, and emergency controls run through governed ai-agent-runs jobs with elevated permission, audit, reason, impact preview, and notification.' }) }

export const activeAgentRunsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await activeAgentRunsService.dashboard(queryFromUrl(request)), 'Active agent runs dashboard loaded.') },
  async summary() { return apiDatabase(await activeAgentRunsService.summary(), 'Active agent runs summary loaded.') },
  async pipeline() { return apiDatabase(await activeAgentRunsService.pipeline(), 'Active agent run pipeline loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.get(await idFrom(context)), 'Active agent run detail loaded.') },
  async plan(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.plan(await idFrom(context)), 'Active agent run plan loaded.') },
  async context(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.context(await idFrom(context)), 'Active agent run context loaded.') },
  async prompt(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.prompt(await idFrom(context)), 'Active agent run prompt loaded.') },
  async routing(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.routing(await idFrom(context)), 'Active agent run routing loaded.') },
  async tools(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.tools(await idFrom(context)), 'Active agent run tools loaded.') },
  async output(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.output(await idFrom(context)), 'Active agent run output loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.validation(await idFrom(context)), 'Active agent run validation loaded.') },
  async recovery(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.recovery(await idFrom(context)), 'Active agent run recovery loaded.') },
  async timeline(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.timeline(await idFrom(context)), 'Active agent run timeline loaded.') },
  async map(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await activeAgentRunsService.map(await idFrom(context)), 'Active agent run map loaded.') },
  async activityStream() { return apiDatabase(await activeAgentRunsService.activityStream(), 'Active agent run activity stream loaded.') },
  async collaborations() { return apiDatabase(await activeAgentRunsService.collaborations(), 'Active agent run collaborations loaded.') },
  async providerRouting() { return apiDatabase(await activeAgentRunsService.providerRouting(), 'Active agent run provider routing loaded.') },
  async toolCalls() { return apiDatabase(await activeAgentRunsService.toolCalls(), 'Active agent run tool calls loaded.') },
  async contextHealth() { return apiDatabase(await activeAgentRunsService.contextHealth(), 'Active agent run context health loaded.') },
  async outputValidation() { return apiDatabase(await activeAgentRunsService.outputValidation(), 'Active agent run output validation loaded.') },
  async bottlenecks() { return apiDatabase(await activeAgentRunsService.bottlenecks(), 'Active agent run bottlenecks loaded.') },
  async recoveries() { return apiDatabase(await activeAgentRunsService.recoveries(), 'Active agent run recoveries loaded.') },
  async costs() { return apiDatabase(await activeAgentRunsService.costs(), 'Active agent run costs loaded.') },
  async slaRisks() { return apiDatabase(await activeAgentRunsService.slaRisks(), 'Active agent run SLA risks loaded.') },
  async autonomousDecisions() { return apiDatabase(await activeAgentRunsService.autonomousDecisions(), 'Active agent run autonomous decisions loaded.') },
  async finalOutputContribution() { return apiDatabase(await activeAgentRunsService.finalOutputContribution(), 'Active agent run final-output contribution loaded.') },
  async stream() { return apiDatabase(activeAgentRunsService.streamDescriptor(), 'Active agent run stream descriptor loaded.') },
  disabled,
}

export const ActiveAgentRunsController = activeAgentRunsController
export const AgentRunExecutionController = activeAgentRunsController
export const AgentRunRecoveryController = activeAgentRunsController
export const AgentRunRoutingController = activeAgentRunsController
export const AgentRunAnalyticsController = activeAgentRunsController
export const AgentRunEmergencyControlController = activeAgentRunsController
