import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowQueueController } from '@/core/workflow-queue/controllers'
export const POST = withErrorHandling(() => workflowQueueController.disabled())
