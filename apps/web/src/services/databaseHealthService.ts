import { databaseHealthRepository } from '@cacsms/database'

export const databaseHealthService = {
  async getHealth() {
    return {
      source: 'database' as const,
      data: await databaseHealthRepository.getHealth(),
    }
  },
}
