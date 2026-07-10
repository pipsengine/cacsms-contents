import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowVersionsController } from '@/core/workflow-versions/controllers'

export const PATCH = withErrorHandling(() => workflowVersionsController.disabled())

