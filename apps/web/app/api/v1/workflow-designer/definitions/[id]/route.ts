import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDesignerController } from '@/core/workflow-designer/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowDesignerController.getDefinition(request, context))
export const PATCH = withErrorHandling(() => workflowDesignerController.disabled())
