import { apiFallback } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const permissionsController = {
  async me() {
    const result = await sessionService.getCurrentPermissions()
    await sessionService.logActivity({
      action: 'permission.loaded',
      resource: 'permissions/me',
      permission: 'permissions:read',
      status: 'success',
    })
    return apiFallback(result.data, 'Loaded mock current user permissions.')
  },
}

