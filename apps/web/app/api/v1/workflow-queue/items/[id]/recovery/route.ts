import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowQueueController } from '@/core/workflow-queue/controllers'
export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => workflowQueueController.recovery(request, context))
