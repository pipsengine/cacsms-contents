import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const aiRepository = new (class AiRepository extends BaseRepository {
  constructor() {
    super('ai_agents')
  }

  async findAgentsByStatus(status: string) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('status', sql.NVarChar(50), status)
      .query('SELECT * FROM ai_agents WHERE status = @status AND is_deleted = 0 ORDER BY name')

    return result.recordset
  }
})()

