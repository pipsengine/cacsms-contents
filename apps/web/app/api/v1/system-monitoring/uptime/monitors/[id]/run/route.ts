import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { uptimeMonitoringController } from '@/core/uptime-monitoring/controllers'

export const POST = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => uptimeMonitoringController.runMonitor(request, context))
