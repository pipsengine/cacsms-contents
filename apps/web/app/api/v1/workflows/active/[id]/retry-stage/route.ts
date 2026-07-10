import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { activeWorkflowsController } from '@/core/active-workflows/controllers'

export const POST = withErrorHandling(() => activeWorkflowsController.disabled())
