import { aiOrchestratorController } from '@/core/ai-orchestrator/controllers'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const GET = withErrorHandling(() => aiOrchestratorController.providers())
