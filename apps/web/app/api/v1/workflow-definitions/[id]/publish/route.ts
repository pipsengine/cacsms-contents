import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDefinitionsController } from '@/core/workflow-definitions/controllers'
export const POST = withErrorHandling(() => workflowDefinitionsController.disabled())
