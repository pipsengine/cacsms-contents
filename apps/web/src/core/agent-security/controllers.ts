import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentSecurityService } from './services'
import type { SecurityQuery } from './repositories'

function queryFromUrl(request: NextRequest): SecurityQuery { const p = request.nextUrl.searchParams; return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, trust: p.get('trust') ?? undefined } }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent Security mutations are disabled in build mode. Assessments, investigations, rotations, access reviews, containment, emergency controls, reports, and exports run through governed agent-security queue jobs with audit logging.' }) }
export const agentSecurityController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentSecurityService.dashboard(queryFromUrl(request)), 'Agent Security Center loaded from database.') },
  async summary() { return apiDatabase(await agentSecurityService.summary(), 'Agent security summary loaded.') },
  async status() { return apiDatabase((await agentSecurityService.dashboard()).engineStatus, 'Agent security status loaded.') },
  async identities(request: NextRequest) { return apiDatabase(await agentSecurityService.identities(queryFromUrl(request)), 'Agent security identities loaded.') },
  async domains() { return apiDatabase(await agentSecurityService.domains(), 'Agent security domains loaded.') },
  async events() { return apiDatabase(await agentSecurityService.events(), 'Security events loaded.') },
  async incidents() { return apiDatabase(await agentSecurityService.incidents(), 'Security incidents loaded.') },
  async secrets() { return apiDatabase(await agentSecurityService.secrets(), 'Security secrets loaded.') },
  async permissions() { return apiDatabase(await agentSecurityService.permissions(), 'Security permissions loaded.') },
  async vulnerabilities() { return apiDatabase(await agentSecurityService.vulnerabilities(), 'Security vulnerabilities loaded.') },
  async risks() { return apiDatabase(await agentSecurityService.risks(), 'Security risks loaded.') },
  async controls() { return apiDatabase(await agentSecurityService.controls(), 'Security controls loaded.') },
  async analytics() { return apiDatabase(await agentSecurityService.dashboard(), 'Agent security analytics loaded.') },
  async finalOutput() { return apiDatabase(await agentSecurityService.finalOutput(), 'Final-output security traceability loaded.') },
  async stream() { return apiDatabase(agentSecurityService.streamDescriptor(), 'Agent security stream descriptor loaded.') },
  disabled,
}
