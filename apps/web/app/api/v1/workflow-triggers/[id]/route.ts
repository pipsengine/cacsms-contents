import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTriggersController } from '@/core/workflow-triggers/controllers'
export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowTriggersController.get(request, context))
export const PATCH = withErrorHandling(() => workflowTriggersController.disabled())
