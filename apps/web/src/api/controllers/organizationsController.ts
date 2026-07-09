import { apiFallback } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const organizationsController = {
  async current() {
    const result = await sessionService.getCurrentOrganization()
    return apiFallback(result.data, 'Loaded mock current organization.')
  },
}

