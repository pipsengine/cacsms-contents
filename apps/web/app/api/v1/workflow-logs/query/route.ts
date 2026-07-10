import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowLogsController } from '@/core/workflow-logs/controllers'

export const POST = withErrorHandling((request: NextRequest) => workflowLogsController.search(request))
