import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { incidentController } from '@/core/incidents/controllers'

export const GET = withErrorHandling((request: NextRequest) => incidentController.dashboard(request))
export const POST = withErrorHandling(() => incidentController.disabled())
