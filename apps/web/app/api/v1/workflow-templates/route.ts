import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTemplatesController } from '@/core/workflow-templates/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowTemplatesController.dashboard(request))
export const POST = withErrorHandling(() => workflowTemplatesController.disabled())
