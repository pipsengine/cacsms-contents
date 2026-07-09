import { BaseRepository } from './baseRepository'
import { getConnectionPool } from '../connection'

export const apiStatusRepository = new (class ApiStatusRepository extends BaseRepository {
  constructor() {
    super('api_endpoints')
  }

  async getApiStatusDashboard() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT api_group, endpoint, http_method, status, health_percent, avg_latency_ms, error_rate
      FROM api_endpoints
      WHERE is_deleted = 0
      ORDER BY api_group, endpoint
    `)
    return result.recordset
  }
})()
