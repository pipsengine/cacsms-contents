import { databaseHealthController } from '@/api/controllers/databaseHealthController'

export async function GET() {
  return databaseHealthController.getHealth()
}
