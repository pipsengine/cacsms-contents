import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDefinitionsController } from '@/core/workflow-definitions/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowDefinitionsController.dashboard(request))
export const POST = withErrorHandling(() => workflowDefinitionsController.disabled())
