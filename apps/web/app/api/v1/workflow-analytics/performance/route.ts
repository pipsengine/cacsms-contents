import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowAnalyticsController } from '@/core/workflow-analytics/controllers'
export const GET = withErrorHandling((request: NextRequest) => workflowAnalyticsController.performance(request))

