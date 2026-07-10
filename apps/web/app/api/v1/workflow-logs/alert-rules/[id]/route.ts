import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowLogsController } from '@/core/workflow-logs/controllers'

export const PATCH = withErrorHandling(() => workflowLogsController.disabled())
export const DELETE = withErrorHandling(() => workflowLogsController.disabled())
