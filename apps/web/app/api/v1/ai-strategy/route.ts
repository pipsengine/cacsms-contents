import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { aiStrategyController } from '@/core/ai-strategy/controllers'

export const GET = withErrorHandling(() => aiStrategyController.dashboard())
export const POST = withErrorHandling((request: Request) => aiStrategyController.governed(request))
export const PATCH = withErrorHandling((request: Request) => aiStrategyController.governed(request))
