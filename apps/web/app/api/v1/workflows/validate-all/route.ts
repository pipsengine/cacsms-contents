import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDashboardController } from '@/core/workflow-dashboard/controllers'

export const POST = withErrorHandling(() => workflowDashboardController.disabled())
