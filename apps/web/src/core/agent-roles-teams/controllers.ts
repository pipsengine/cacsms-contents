import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentRolesTeamsService } from './services'
import type { AgentRolesTeamsQuery } from './repositories'

function queryFromUrl(request: NextRequest): AgentRolesTeamsQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, category: params.get('category') ?? undefined, roleType: params.get('roleType') ?? undefined, scope: params.get('scope') ?? undefined, status: params.get('status') ?? undefined, primaryAgent: params.get('primaryAgent') ?? undefined, supervisorRole: params.get('supervisorRole') ?? undefined, failoverEnabled: params.get('failoverEnabled') ?? undefined, workloadRange: params.get('workloadRange') ?? undefined, finalOutputResponsibility: params.get('finalOutputResponsibility') ?? undefined, organization: params.get('organization') ?? undefined, environment: params.get('environment') ?? undefined, owner: params.get('owner') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent role and team mutations are disabled in autonomous build mode. Creation, validation, simulation, workload balancing, handoff recovery, consensus resolution, failover, and governance changes run through governed agent-roles-teams jobs.' }) }

export const agentRolesTeamsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentRolesTeamsService.dashboard(queryFromUrl(request)), 'Agent roles and teams dashboard loaded.') },
  async summary() { return apiDatabase(await agentRolesTeamsService.summary(), 'Agent roles and teams summary loaded.') },
  async roles(request: NextRequest) { return apiDatabase(await agentRolesTeamsService.roles(queryFromUrl(request)), 'Agent roles loaded.') },
  async teams() { return apiDatabase(await agentRolesTeamsService.teams(), 'Agent teams loaded.') },
  async categories() { return apiDatabase(await agentRolesTeamsService.categories(), 'Agent role categories loaded.') },
  async lifecycle() { return apiDatabase(await agentRolesTeamsService.lifecycle(), 'Agent team lifecycle loaded.') },
  async health() { return apiDatabase(await agentRolesTeamsService.health(), 'Agent team orchestration health loaded.') },
  async members() { return apiDatabase(await agentRolesTeamsService.members(), 'Agent team members loaded.') },
  async delegations() { return apiDatabase(await agentRolesTeamsService.delegations(), 'Agent team delegations loaded.') },
  async handoffs() { return apiDatabase(await agentRolesTeamsService.handoffs(), 'Agent team handoffs loaded.') },
  async consensus() { return apiDatabase(await agentRolesTeamsService.consensus(), 'Agent team consensus rules loaded.') },
  async recommendations() { return apiDatabase(await agentRolesTeamsService.recommendations(), 'Agent team recommendations loaded.') },
  async finalOutput() { return apiDatabase(await agentRolesTeamsService.finalOutput(), 'Agent team final-output ownership loaded.') },
  async getRole(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentRolesTeamsService.getRole(await idFrom(context)), 'Agent role detail loaded.') },
  async getTeam(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentRolesTeamsService.getTeam(await idFrom(context)), 'Agent team detail loaded.') },
  async stream() { return apiDatabase(agentRolesTeamsService.streamDescriptor(), 'Agent roles and teams stream descriptor loaded.') },
  disabled,
}

export const AgentRolesTeamsController = agentRolesTeamsController
