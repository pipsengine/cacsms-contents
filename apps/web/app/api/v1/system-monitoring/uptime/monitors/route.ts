import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { uptimeMonitoringController } from '@/core/uptime-monitoring/controllers'

export const GET = withErrorHandling(() => uptimeMonitoringController.monitors())
export const POST = withErrorHandling(() => uptimeMonitoringController.monitors())
