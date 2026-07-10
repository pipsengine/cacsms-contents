import { navigationService } from '@/services/navigationService'
import { apiDatabase } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const navigationController = {
  async getNavigation() {
    const result = await navigationService.getNavigationTree([])
    await sessionService.logActivity({
      action: 'navigation.loaded',
      resource: 'navigation',
      permission: 'navigation:read',
      status: 'success',
    })
    return apiDatabase(result.data, 'Navigation loaded from database.')
  },
}
