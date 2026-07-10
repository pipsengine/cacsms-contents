import type { NextRequest } from 'next/server'
import { aiOrchestratorController } from '@/core/ai-orchestrator/controllers'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const POST = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) =>
  aiOrchestratorController.runAgent(request, {
    params: context.params.then(({ id }) => ({ agentCode: id })),
  })
)
