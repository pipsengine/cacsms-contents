import { BaseRepository } from './baseRepository'
import { getConnectionPool } from '../connection'

export const serviceHealthRepository = new (class ServiceHealthRepository extends BaseRepository {
  constructor() {
    super('system_services')
  }

  async getServiceHealthDashboard() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT name, status, health_percent, latency_ms, last_checked_at
      FROM system_services
      WHERE is_deleted = 0
      ORDER BY name
    `)
    return result.recordset
  }
})()
