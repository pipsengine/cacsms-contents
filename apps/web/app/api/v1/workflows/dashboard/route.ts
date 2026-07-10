import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDashboardController } from '@/core/workflow-dashboard/controllers'

export const GET = withErrorHandling((request: NextRequest) => workflowDashboardController.dashboard(request))
