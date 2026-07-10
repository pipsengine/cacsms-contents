import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowController } from '@/core/workflow/controllers/workflowController'

export const GET = withErrorHandling(() => workflowController.listInstances())

export const POST = withErrorHandling((request: NextRequest) => workflowController.createInstance(request))
