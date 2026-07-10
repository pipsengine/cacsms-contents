import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowVersionsController } from '@/core/workflow-versions/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowVersionsController.get(request, context))
export const PATCH = withErrorHandling(() => workflowVersionsController.disabled())

