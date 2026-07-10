import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowQueueController } from '@/core/workflow-queue/controllers'
export const GET = withErrorHandling(() => workflowQueueController.summary())
