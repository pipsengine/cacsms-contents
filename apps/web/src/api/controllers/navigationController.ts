import { navigationService } from '@/services/navigationService'
import { apiDatabase, apiFallback } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const navigationController = {
  async getNavigation() {
    const permissions = await sessionService.getCurrentPermissions()
    const result = await navigationService.getNavigationTree(permissions.data.permissions)
    await sessionService.logActivity({
      action: 'navigation.loaded',
      resource: 'navigation',
      permission: 'navigation:read',
      status: result.source === 'database' ? 'success' : 'fallback',
    })
    return result.source === 'database'
      ? apiDatabase(result.data, 'Navigation loaded from database.')
      : apiFallback(result.data)
  },
}
