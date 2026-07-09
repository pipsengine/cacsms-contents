import { BaseRepository } from './baseRepository'
import { getConnectionPool } from '../connection'

export const workflowStatusRepository = new (class WorkflowStatusRepository extends BaseRepository {
  constructor() {
    super('workflow_definitions')
  }

  async getWorkflowStatusDashboard() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT wd.name AS workflow, wd.status, ws.name AS stage, ws.display_order
      FROM workflow_definitions wd
      LEFT JOIN workflow_stages ws ON ws.workflow_definition_id = wd.id AND ws.is_deleted = 0
      WHERE wd.is_deleted = 0
      ORDER BY wd.created_at DESC, ws.display_order
    `)
    return result.recordset
  }
})()
