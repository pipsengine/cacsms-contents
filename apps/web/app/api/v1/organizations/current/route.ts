import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { organizationsController } from '@/api/controllers/organizationsController'

export const GET = withErrorHandling(() => organizationsController.current())
