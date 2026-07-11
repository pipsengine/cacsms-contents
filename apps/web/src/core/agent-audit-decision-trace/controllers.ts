import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentAuditService } from './services'
import type { AuditQuery } from './repositories'
function queryFromUrl(request: NextRequest): AuditQuery { const p = request.nextUrl.searchParams; return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, risk: p.get('risk') ?? undefined } }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent Audit & Decision Trace mutations are disabled in build mode. Replay, investigations, evidence export, reports, and emergency controls run through governed audit-decision-trace jobs.' }) }
export const agentAuditController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentAuditService.dashboard(queryFromUrl(request)), 'Audit decision trace dashboard loaded.') },
  async summary() { return apiDatabase(await agentAuditService.summary(), 'Audit summary loaded.') },
  async decisions(request: NextRequest) { return apiDatabase(await agentAuditService.decisions(queryFromUrl(request)), 'Decisions loaded.') },
  async timeline() { return apiDatabase(await agentAuditService.auditLogs(), 'Audit timeline loaded.') },
  async replay() { return apiDatabase(await agentAuditService.replay(), 'Decision replay loaded.') },
  async forensics() { return apiDatabase(await agentAuditService.forensics(), 'Forensics loaded.') },
  async compliance() { return apiDatabase(await agentAuditService.compliance(), 'Compliance loaded.') },
  async finalOutput() { return apiDatabase(await agentAuditService.finalOutput(), 'Final output audit trace loaded.') },
  async stream() { return apiDatabase(agentAuditService.streamDescriptor(), 'Audit stream descriptor loaded.') },
  disabled,
}
