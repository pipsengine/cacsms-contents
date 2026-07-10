import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowController } from '@/core/workflow/controllers/workflowController'

export const POST = withErrorHandling((request: NextRequest, context: { params: Promise<{ instanceId: string }> }) => workflowController.cancel(request, context))
