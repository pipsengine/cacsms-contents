import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowActionsController } from '@/core/workflow-actions/controllers'

export const GET = withErrorHandling(() => workflowActionsController.performance())
