import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { recoveryPoliciesController } from '@/core/recovery-policies/controllers'
export const GET = withErrorHandling(() => recoveryPoliciesController.categories())

