import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowApprovalController } from '@/core/workflow/controllers/workflowApprovalController'

export const POST = withErrorHandling((request: NextRequest, context: { params: Promise<{ instanceId: string }> }) => workflowApprovalController.reject(request, context))
