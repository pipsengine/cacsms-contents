import { authController } from '@/api/controllers/authController'

export async function GET() {
  return authController.me()
}

