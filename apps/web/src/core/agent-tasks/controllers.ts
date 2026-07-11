import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentTasksService } from './services'
import type { AgentTasksQuery } from './repositories'

function queryFromUrl(request: NextRequest): AgentTasksQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, workflow: p.get('workflow') ?? undefined, stage: p.get('stage') ?? undefined, agent: p.get('agent') ?? undefined, role: p.get('role') ?? undefined, priority: p.get('priority') ?? undefined, status: p.get('status') ?? undefined, queue: p.get('queue') ?? undefined, provider: p.get('provider') ?? undefined, model: p.get('model') ?? undefined, recovery: p.get('recovery') ?? undefined, output: p.get('output') ?? undefined, riskRange: p.get('riskRange') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent task mutations are disabled in autonomous build mode. Creation, planning, assignment, validation, retry, recovery, optimization, and emergency changes run through governed agent-tasks jobs.' }) }

export const agentTasksController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentTasksService.dashboard(queryFromUrl(request)), 'Agent tasks dashboard loaded.') },
  async summary() { return apiDatabase(await agentTasksService.summary(), 'Agent tasks summary loaded.') },
  async tasks(request: NextRequest) { return apiDatabase(await agentTasksService.tasks(queryFromUrl(request)), 'Agent tasks loaded.') },
  async categories() { return apiDatabase(await agentTasksService.categories(), 'Agent task categories loaded.') },
  async lifecycle() { return apiDatabase(await agentTasksService.lifecycle(), 'Agent task lifecycle loaded.') },
  async health() { return apiDatabase(await agentTasksService.health(), 'Agent task health loaded.') },
  async dependencies() { return apiDatabase(await agentTasksService.dependencies(), 'Agent task dependencies loaded.') },
  async priority() { return apiDatabase(await agentTasksService.priority(), 'Agent task priorities loaded.') },
  async validation() { return apiDatabase(await agentTasksService.validation(), 'Agent task validation loaded.') },
  async recovery() { return apiDatabase(await agentTasksService.recovery(), 'Agent task recovery loaded.') },
  async recommendations() { return apiDatabase(await agentTasksService.recommendations(), 'Agent task recommendations loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentTasksService.get(await idFrom(context)), 'Agent task detail loaded.') },
  async stream() { return apiDatabase(agentTasksService.streamDescriptor(), 'Agent tasks stream descriptor loaded.') },
  disabled,
}

export const AgentTasksController = agentTasksController
