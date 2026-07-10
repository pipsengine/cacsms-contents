import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { failedWorkflowsController } from '@/core/failed-workflows/controllers'

export const GET = withErrorHandling((request: NextRequest) => failedWorkflowsController.dashboard(request))
