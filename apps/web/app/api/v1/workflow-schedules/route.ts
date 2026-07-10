import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowSchedulesController } from '@/core/workflow-schedules/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowSchedulesController.dashboard(request))
export const POST = withErrorHandling(() => workflowSchedulesController.disabled())
