import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { databaseHealthController } from '@/api/controllers/databaseHealthController'

export const GET = withErrorHandling(() => databaseHealthController.getHealth())
