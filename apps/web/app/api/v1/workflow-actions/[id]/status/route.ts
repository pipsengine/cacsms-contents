import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowActionsController } from '@/core/workflow-actions/controllers'

export const PATCH = withErrorHandling(() => workflowActionsController.disabled())
