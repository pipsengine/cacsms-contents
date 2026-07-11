import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { recoveryPoliciesController } from '@/core/recovery-policies/controllers'
export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => recoveryPoliciesController.get(request, context))
export const PATCH = withErrorHandling(() => recoveryPoliciesController.disabled())

