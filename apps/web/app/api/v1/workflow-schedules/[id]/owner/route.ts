import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowSchedulesController } from '@/core/workflow-schedules/controllers'

export const PATCH = withErrorHandling(() => workflowSchedulesController.disabled())
