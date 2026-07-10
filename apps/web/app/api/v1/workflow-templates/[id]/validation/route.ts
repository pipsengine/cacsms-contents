import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTemplatesController } from '@/core/workflow-templates/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowTemplatesController.validation(request, context))
