import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const contentRepository = new (class ContentRepository extends BaseRepository {
  constructor() {
    super('content_items')
  }

  async findByStatus(status: string, organizationId?: string) {
    const pool = await getConnectionPool()
    const request = pool
      .request()
      .input('status', sql.NVarChar(50), status)
      .input('organizationId', sql.UniqueIdentifier, organizationId ?? null)

    const result = await request.query(`
      SELECT *
      FROM content_items
      WHERE status = @status
        AND is_deleted = 0
        AND (@organizationId IS NULL OR organization_id = @organizationId)
      ORDER BY updated_at DESC
    `)

    return result.recordset
  }
})()
