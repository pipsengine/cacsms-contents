import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDefinitionsController } from '@/core/workflow-definitions/controllers'

export const GET = withErrorHandling(() => workflowDefinitionsController.categories())
