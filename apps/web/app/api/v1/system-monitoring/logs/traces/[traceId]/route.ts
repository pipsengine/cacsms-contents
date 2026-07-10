import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { logsController } from '@/core/logs/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ traceId: string }> }) => logsController.trace(request, context))
