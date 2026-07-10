import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { incidentController } from '@/core/incidents/controllers'

export const PATCH = withErrorHandling(() => incidentController.disabled())
