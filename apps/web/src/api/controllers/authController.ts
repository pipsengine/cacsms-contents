import { apiDatabase } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const authController = {
  async me() {
    return apiDatabase(await sessionService.getCurrentUser(), 'Build-mode user loaded.')
  },
}
