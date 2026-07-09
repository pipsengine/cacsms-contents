import { navigationController } from '@/api/controllers/navigationController'

export async function GET() {
  return navigationController.getNavigation()
}
