import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { automationRulesController } from '@/core/automation-rules/controllers'

export const GET = withErrorHandling(() => automationRulesController.stream())
