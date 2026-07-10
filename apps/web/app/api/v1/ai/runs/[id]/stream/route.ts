import type { NextRequest } from 'next/server'
import { apiResponse } from '@/shared/api/apiResponse'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const GET = withErrorHandling(async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  return apiResponse({ data: { runId: id, stream: 'not_connected' }, message: 'AI run stream endpoint is registered.', metadata: { source: 'database' } })
})
