import { databaseHealthService } from '@/services/databaseHealthService'
import { apiDatabase, apiFallback } from '@/shared/api/apiResponse'

export const databaseHealthController = {
  async getHealth() {
    const result = await databaseHealthService.getHealth()
    return result.source === 'database'
      ? apiDatabase(result.data, 'Database health loaded.')
      : apiFallback(result.data, 'Database unavailable. Health fallback returned.')
  },
}
