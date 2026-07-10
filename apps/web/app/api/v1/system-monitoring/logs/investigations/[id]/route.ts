import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { logsController } from '@/core/logs/controllers'

export const PATCH = withErrorHandling(() => logsController.createDisabled())
