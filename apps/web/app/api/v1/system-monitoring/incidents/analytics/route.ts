import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { incidentController } from '@/core/incidents/controllers'

export const GET = withErrorHandling(() => incidentController.analytics())
