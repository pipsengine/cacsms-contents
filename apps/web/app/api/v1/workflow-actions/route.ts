import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowActionsController } from '@/core/workflow-actions/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowActionsController.dashboard(request))
export const POST = withErrorHandling(() => workflowActionsController.disabled())
