import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDashboardController } from '@/core/workflow-dashboard/controllers'

export const GET = withErrorHandling(() => workflowDashboardController.summary())
