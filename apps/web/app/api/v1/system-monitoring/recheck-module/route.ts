import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowController } from '@/core/workflow/controllers/workflowController'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}))
  return workflowController.createInstance(
    new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({
        workflowCode: 'IMPLEMENTATION_VALIDATION',
        referenceType: 'implementation_module',
        referenceId: body.moduleId ?? 'scoped-module',
        context: body,
        requestedBy: body.requestedBy ?? 'dashboard',
      }),
      headers: { 'content-type': 'application/json' },
    }) as NextRequest
  )
})
