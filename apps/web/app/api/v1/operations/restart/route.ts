import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { operationsController } from '@/core/operations/controllers'

export const POST = withErrorHandling(() => operationsController.restart())
