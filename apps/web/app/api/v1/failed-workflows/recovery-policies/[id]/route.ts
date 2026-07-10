import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { failedWorkflowsController } from '@/core/failed-workflows/controllers'

export const PATCH = withErrorHandling(() => failedWorkflowsController.disabled())
