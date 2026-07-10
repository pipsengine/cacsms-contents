import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { navigationController } from '@/api/controllers/navigationController'

export const GET = withErrorHandling(() => navigationController.getNavigation())
