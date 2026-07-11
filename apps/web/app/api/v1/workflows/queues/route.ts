import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDashboardController } from '@/core/workflow-dashboard/controllers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(() => workflowDashboardController.queues())
