import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { recoveryPoliciesController } from '@/core/recovery-policies/controllers'
export const POST = withErrorHandling(() => recoveryPoliciesController.disabled())

