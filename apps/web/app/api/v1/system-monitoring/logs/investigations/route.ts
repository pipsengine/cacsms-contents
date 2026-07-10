import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { logsController } from '@/core/logs/controllers'

export const GET = withErrorHandling(() => logsController.investigations())
export const POST = withErrorHandling(() => logsController.createDisabled())
