import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { systemControlController } from '@/core/system-control/controllers/systemControlController'

export const GET = withErrorHandling(() => systemControlController.status())
