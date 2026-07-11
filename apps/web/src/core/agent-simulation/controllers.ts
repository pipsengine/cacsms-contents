import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentSimulationService } from './services'
import type { SimulationQuery } from './repositories'

function queryFromUrl(request: NextRequest): SimulationQuery { const p = request.nextUrl.searchParams; return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, ready: p.get('ready') ?? undefined } }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent Simulation Studio mutations are disabled in build mode. Create, run, replay, forecast, chaos, compare, and export actions run through governed simulation queue jobs with audit logging.' }) }
export const agentSimulationController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentSimulationService.dashboard(queryFromUrl(request)), 'Agent Simulation Studio loaded from database.') },
  async summary() { return apiDatabase(await agentSimulationService.summary(), 'Simulation summary loaded.') },
  async scenarios() { return apiDatabase(await agentSimulationService.scenarios(), 'Simulation scenarios loaded.') },
  async results() { return apiDatabase(await agentSimulationService.results(), 'Simulation results loaded.') },
  async stream() { return apiDatabase(agentSimulationService.streamDescriptor(), 'Simulation stream descriptor loaded.') },
  disabled,
}
