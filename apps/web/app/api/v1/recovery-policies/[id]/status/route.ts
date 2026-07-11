import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { recoveryPoliciesController } from '@/core/recovery-policies/controllers'
export const PATCH = withErrorHandling(() => recoveryPoliciesController.disabled())

