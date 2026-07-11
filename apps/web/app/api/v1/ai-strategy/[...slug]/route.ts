import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { aiStrategyController } from '@/core/ai-strategy/controllers'

type Ctx = { params: Promise<{ slug?: string[] }> | { slug?: string[] } }

export const GET = withErrorHandling((request: Request, context: Ctx) => aiStrategyController.section(request, context))
export const POST = withErrorHandling((request: Request, context: Ctx) => aiStrategyController.governed(request, context))
export const PATCH = withErrorHandling((request: Request, context: Ctx) => aiStrategyController.governed(request, context))
