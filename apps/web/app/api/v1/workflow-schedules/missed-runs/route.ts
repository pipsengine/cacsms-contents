import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowSchedulesController } from '@/core/workflow-schedules/controllers'

export const GET = withErrorHandling(() => workflowSchedulesController.missedRuns())
