import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowQueueController } from '@/core/workflow-queue/controllers'
export const GET = withErrorHandling((request: NextRequest) => workflowQueueController.dependencies(request))
