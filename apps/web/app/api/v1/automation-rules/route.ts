import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { automationRulesController } from '@/core/automation-rules/controllers'

export const GET = withErrorHandling((request: NextRequest) => automationRulesController.dashboard(request))
export const POST = withErrorHandling(() => automationRulesController.disabled())
