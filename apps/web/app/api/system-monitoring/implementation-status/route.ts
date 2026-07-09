import { systemMonitoringController } from '@/api/controllers/systemMonitoringController'

export async function GET() {
  return systemMonitoringController.getImplementationStatus()
}
