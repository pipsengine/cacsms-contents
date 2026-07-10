import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowVersionsController } from '@/core/workflow-versions/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowVersionsController.dashboard(request))
export const POST = withErrorHandling(() => workflowVersionsController.disabled())
export const PATCH = withErrorHandling(() => workflowVersionsController.disabled())

