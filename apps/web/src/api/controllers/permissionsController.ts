import { apiDatabase } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const permissionsController = {
  async me() {
    return apiDatabase(await sessionService.getCurrentPermissions(), 'Build-mode permissions loaded.')
  },
}
