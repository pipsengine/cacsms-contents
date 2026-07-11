import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { executiveCommandController } from '@/core/executive-command/controllers'

export const GET = withErrorHandling(() => executiveCommandController.dashboard())
export const POST = withErrorHandling((request: Request) => executiveCommandController.governed(request))
export const PATCH = withErrorHandling((request: Request) => executiveCommandController.governed(request))
