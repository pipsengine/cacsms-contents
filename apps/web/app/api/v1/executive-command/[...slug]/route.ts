import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { executiveCommandController } from '@/core/executive-command/controllers'

type Ctx = { params: Promise<{ slug?: string[] }> | { slug?: string[] } }

export const GET = withErrorHandling((request: Request, context: Ctx) => executiveCommandController.section(request, context))
export const POST = withErrorHandling((request: Request, context: Ctx) => executiveCommandController.governed(request, context))
export const PATCH = withErrorHandling((request: Request, context: Ctx) => executiveCommandController.governed(request, context))
