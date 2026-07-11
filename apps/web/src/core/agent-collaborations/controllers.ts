import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentCollaborationsService } from './services'
import type { AgentCollaborationsQuery } from './repositories'

function queryFromUrl(request: NextRequest): AgentCollaborationsQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, phase: p.get('phase') ?? undefined, supervisor: p.get('supervisor') ?? undefined, consensus: p.get('consensus') ?? undefined, finalOutput: p.get('finalOutput') ?? undefined, riskRange: p.get('riskRange') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent collaboration mutations are disabled in autonomous build mode. Creation, consensus, conflict resolution, handoff retry, recovery, simulation, and assignment run through governed agent-collaborations jobs.' }) }

export const agentCollaborationsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentCollaborationsService.dashboard(queryFromUrl(request)), 'Agent collaboration dashboard loaded.') },
  async summary() { return apiDatabase(await agentCollaborationsService.summary(), 'Agent collaboration summary loaded.') },
  async list(request: NextRequest) { return apiDatabase(await agentCollaborationsService.list(queryFromUrl(request)), 'Agent collaborations loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCollaborationsService.get(await idFrom(context)), 'Agent collaboration detail loaded.') },
  async consensus() { return apiDatabase(await agentCollaborationsService.consensus(), 'Agent collaboration consensus loaded.') },
  async conflicts() { return apiDatabase(await agentCollaborationsService.conflicts(), 'Agent collaboration conflicts loaded.') },
  async handoffs() { return apiDatabase(await agentCollaborationsService.handoffs(), 'Agent collaboration handoffs loaded.') },
  async performance() { return apiDatabase(await agentCollaborationsService.performance(), 'Agent collaboration performance loaded.') },
  async finalOutput() { return apiDatabase(await agentCollaborationsService.finalOutput(), 'Agent collaboration final-output loaded.') },
  async stream() { return apiDatabase(agentCollaborationsService.streamDescriptor(), 'Agent collaboration stream descriptor loaded.') },
  disabled,
}

export const AgentCollaborationsController = agentCollaborationsController
