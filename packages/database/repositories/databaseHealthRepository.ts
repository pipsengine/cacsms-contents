import { getDatabaseHealth } from '../services/databaseHealthService'

export const databaseHealthRepository = {
  async getHealth() {
    return getDatabaseHealth()
  },
}
