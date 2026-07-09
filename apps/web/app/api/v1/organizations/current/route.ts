import { organizationsController } from '@/api/controllers/organizationsController'

export async function GET() {
  return organizationsController.current()
}

