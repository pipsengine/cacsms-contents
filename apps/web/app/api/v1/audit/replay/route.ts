import { agentAuditController } from '@/core/agent-audit-decision-trace/controllers'
export const GET = agentAuditController.replay
export const POST = agentAuditController.disabled
