import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentGovernanceService } from './services'
import type { GovernanceQuery } from './repositories'

function queryFromUrl(request: NextRequest): GovernanceQuery { const p = request.nextUrl.searchParams; return { q: p.get('q') ?? undefined, domain: p.get('domain') ?? undefined, status: p.get('status') ?? undefined, risk: p.get('risk') ?? undefined } }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent Governance mutations are disabled in build mode. Create, approve, emergency, report, policy simulation, validation, and export actions run through governed agent-governance queue jobs with audit logging.' }) }
export const agentGovernanceController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentGovernanceService.dashboard(queryFromUrl(request)), 'Agent Governance Center loaded from database.') },
  async summary() { return apiDatabase(await agentGovernanceService.summary(), 'Governance summary loaded.') },
  async status() { return apiDatabase((await agentGovernanceService.dashboard()).engineStatus, 'Governance status loaded.') },
  async policies(request: NextRequest) { return apiDatabase(await agentGovernanceService.policies(queryFromUrl(request)), 'Governance policies loaded.') },
  async domains() { return apiDatabase(await agentGovernanceService.domains(), 'Governance domains loaded.') },
  async approvals() { return apiDatabase(await agentGovernanceService.approvals(), 'Governance approvals loaded.') },
  async exceptions() { return apiDatabase(await agentGovernanceService.exceptions(), 'Governance exceptions loaded.') },
  async violations() { return apiDatabase(await agentGovernanceService.violations(), 'Governance violations loaded.') },
  async conflicts() { return apiDatabase(await agentGovernanceService.conflicts(), 'Governance conflicts loaded.') },
  async risks() { return apiDatabase(await agentGovernanceService.risks(), 'Governance risks loaded.') },
  async controls() { return apiDatabase(await agentGovernanceService.controls(), 'Governance controls loaded.') },
  async regulatory() { return apiDatabase(await agentGovernanceService.regulatoryMappings(), 'Regulatory mappings loaded.') },
  async useCases() { return apiDatabase(await agentGovernanceService.useCases(), 'AI use-case governance loaded.') },
  async coverage() { return apiDatabase(await agentGovernanceService.coverage(), 'Governance coverage loaded.') },
  async analytics() { return apiDatabase(await agentGovernanceService.dashboard(), 'Governance analytics loaded.') },
  async recommendations() { return apiDatabase(await agentGovernanceService.recommendations(), 'Governance recommendations loaded.') },
  async finalOutput() { return apiDatabase(await agentGovernanceService.finalOutput(), 'Final-output governance traceability loaded.') },
  async decisions() { return apiDatabase(await agentGovernanceService.decisions(), 'Governance decisions loaded.') },
  async stream() { return apiDatabase(agentGovernanceService.streamDescriptor(), 'Governance stream descriptor loaded.') },
  disabled,
}
