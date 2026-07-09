import { databaseHealthRepository } from '@cacsms/database'
import { logger } from '@/shared/logging/logger'

export const databaseHealthService = {
  async getHealth() {
    try {
      return {
        source: 'database' as const,
        data: await databaseHealthRepository.getHealth(),
      }
    } catch (error) {
      logger.warn(error, 'Database health fallback active')
      return {
        source: 'mock' as const,
        data: {
          connected: false,
          server: process.env.MSSQL_SERVER ?? null,
          database: process.env.MSSQL_DATABASE ?? 'db_cacsms-contents',
          latencyMs: null,
          migrationVersion: null,
          lastCheckedAt: new Date().toISOString(),
        },
      }
    }
  },
}
