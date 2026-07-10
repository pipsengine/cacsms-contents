import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowAnalyticsController } from '@/core/workflow-analytics/controllers'
export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowAnalyticsController.workflow(request, context))

