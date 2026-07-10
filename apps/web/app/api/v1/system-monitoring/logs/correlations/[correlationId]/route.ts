import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { logsController } from '@/core/logs/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ correlationId: string }> }) => logsController.correlation(request, context))
