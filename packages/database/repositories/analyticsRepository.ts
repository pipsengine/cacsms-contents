import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const analyticsRepository = new (class AnalyticsRepository extends BaseRepository {
  constructor() {
    super('content_analytics')
  }

  async getContentMetrics(contentId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('contentId', sql.UniqueIdentifier, contentId).query(`
      SELECT *
      FROM content_analytics
      WHERE content_id = @contentId AND is_deleted = 0
      ORDER BY captured_at DESC
    `)

    return result.recordset
  }
})()

