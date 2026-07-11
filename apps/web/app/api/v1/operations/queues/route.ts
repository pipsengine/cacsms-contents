import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { operationsController } from '@/core/operations/controllers'

export const GET = withErrorHandling(() => operationsController.queues())
export const POST = withErrorHandling(() => operationsController.pause())
