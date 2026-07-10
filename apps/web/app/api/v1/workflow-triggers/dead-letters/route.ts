import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTriggersController } from '@/core/workflow-triggers/controllers'
export const GET = withErrorHandling(() => workflowTriggersController.deadLetters())
