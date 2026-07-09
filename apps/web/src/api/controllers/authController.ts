import { apiFallback } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const authController = {
  async me() {
    const result = await sessionService.getCurrentUser()
    return apiFallback(result.data, 'Loaded mock current user session.')
  },
}

