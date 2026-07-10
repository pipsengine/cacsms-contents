import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowSchedulesController } from '@/core/workflow-schedules/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowSchedulesController.get(request, context))
export const PATCH = withErrorHandling(() => workflowSchedulesController.disabled())
