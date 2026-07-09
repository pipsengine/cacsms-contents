import { permissionsController } from '@/api/controllers/permissionsController'

export async function GET() {
  return permissionsController.me()
}

