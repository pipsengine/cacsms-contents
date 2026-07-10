import { workflowController } from '@/core/workflow/controllers/workflowController'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const GET = withErrorHandling(() => workflowController.listDefinitions())
