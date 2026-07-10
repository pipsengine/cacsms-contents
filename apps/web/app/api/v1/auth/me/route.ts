import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { authController } from '@/api/controllers/authController'

export const GET = withErrorHandling(() => authController.me())
