import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { activeAgentRunsController } from '@/core/active-agent-runs/controllers'
export const GET = withErrorHandling(() => activeAgentRunsController.pipeline())
