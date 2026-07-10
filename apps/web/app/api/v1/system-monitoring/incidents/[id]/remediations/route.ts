import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { incidentController } from '@/core/incidents/controllers'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => incidentController.remediations(request, context))
