import { BaseRepository } from './baseRepository'
import { getConnectionPool } from '../connection'

export const implementationStatusRepository = new (class ImplementationStatusRepository extends BaseRepository {
  constructor() {
    super('implementation_linkage_matrix')
  }

  async getImplementationStatusDashboard() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT m.name AS module, p.name AS page, ilm.status, ilm.health_percent,
             ilm.route_linked, ilm.component_ready, ilm.api_linked, ilm.storage_validated, ilm.final_output_ready
      FROM implementation_linkage_matrix ilm
      JOIN modules m ON m.id = ilm.module_id
      LEFT JOIN pages p ON p.id = ilm.page_id
      WHERE ilm.is_deleted = 0
      ORDER BY m.display_order, p.name
    `)
    return result.recordset
  }
})()
