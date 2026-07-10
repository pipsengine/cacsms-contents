import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowAnalyticsController } from '@/core/workflow-analytics/controllers'
export const GET = withErrorHandling(() => workflowAnalyticsController.summary())

