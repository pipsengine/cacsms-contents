import { apiDatabase } from '@/shared/api/apiResponse'
import { sessionService } from '@/services/sessionService'

export const organizationsController = {
  async current() {
    return apiDatabase(await sessionService.getCurrentOrganization(), 'Build-mode organization loaded.')
  },
}
