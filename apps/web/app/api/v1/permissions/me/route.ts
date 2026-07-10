import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { permissionsController } from '@/api/controllers/permissionsController'

export const GET = withErrorHandling(() => permissionsController.me())
