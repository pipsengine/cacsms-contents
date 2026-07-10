import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { activeWorkflowsController } from '@/core/active-workflows/controllers'

export const GET = withErrorHandling(() => activeWorkflowsController.stream())
