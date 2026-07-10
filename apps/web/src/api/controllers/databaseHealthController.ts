import { databaseHealthService } from '@/services/databaseHealthService'
import { apiDatabase } from '@/shared/api/apiResponse'

export const databaseHealthController = {
  async getHealth() {
    const result = await databaseHealthService.getHealth()
    return apiDatabase(result.data, 'Database health loaded.')
  },
}
