import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const workflowRepository = new (class WorkflowRepository extends BaseRepository {
  constructor() {
    super('workflow_definitions')
  }

  async getDefinitionWithStages(workflowDefinitionId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('workflowDefinitionId', sql.UniqueIdentifier, workflowDefinitionId).query(`
      SELECT wd.id AS workflow_definition_id,
             wd.name,
             wd.version,
             ws.id AS stage_id,
             ws.name AS stage_name,
             ws.display_order,
             ws.approval_required
      FROM workflow_definitions wd
      LEFT JOIN workflow_stages ws ON ws.workflow_definition_id = wd.id AND ws.is_deleted = 0
      WHERE wd.id = @workflowDefinitionId AND wd.is_deleted = 0
      ORDER BY ws.display_order
    `)

    return result.recordset
  }
})()

