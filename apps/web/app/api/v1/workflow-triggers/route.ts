import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTriggersController } from '@/core/workflow-triggers/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowTriggersController.dashboard(request))
export const POST = withErrorHandling(() => workflowTriggersController.disabled())
