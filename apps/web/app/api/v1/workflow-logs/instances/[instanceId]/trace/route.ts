import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowLogsController } from '@/core/workflow-logs/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ instanceId: string }> }) => workflowLogsController.instanceTrace(request, context))
