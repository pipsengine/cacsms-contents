import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowLogsController } from '@/core/workflow-logs/controllers'

export const GET = withErrorHandling(() => workflowLogsController.analytics())
