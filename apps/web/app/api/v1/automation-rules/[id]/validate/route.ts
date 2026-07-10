import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { automationRulesController } from '@/core/automation-rules/controllers'

export const POST = withErrorHandling(() => automationRulesController.disabled())
