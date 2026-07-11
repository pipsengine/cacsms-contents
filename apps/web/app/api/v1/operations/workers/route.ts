import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { operationsController } from '@/core/operations/controllers'

export const GET = withErrorHandling(() => operationsController.workers())
export const POST = withErrorHandling(() => operationsController.restart())
