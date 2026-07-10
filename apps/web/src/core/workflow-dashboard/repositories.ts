import { getConnectionPool, sql } from '@cacsms/database'
import type { WorkflowDashboardQuery } from './types'

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

function filters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowDashboardQuery) {
  const where = ['1 = 1']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_name LIKE @q OR workflow_code LIKE @q OR reference_id LIKE @q OR current_stage LIKE @q)')
  }
  ;[
    ['status', 'status'],
    ['workflowType', 'workflow_type'],
    ['priority', 'priority'],
    ['recoveryState', 'recovery_state'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowDashboardQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  return where.join(' AND ')
}

export const workflowDashboardRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!row) throw new Error('No organization row exists for workflow dashboard.')
    return String(row.id)
  },

  async summary() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_workflow_dashboard_summary WHERE organization_id = @org')
    return camel(result.recordset[0] ?? {})
  },

  async instances(query: WorkflowDashboardQuery = {}) {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = filters(request, query)
    const result = await request.query(`
      SELECT TOP 100 * FROM vw_active_workflow_instances
      WHERE organization_id = @org AND ${where}
      ORDER BY
        CASE status WHEN 'failed' THEN 1 WHEN 'blocked' THEN 2 WHEN 'recovering' THEN 3 WHEN 'running' THEN 4 WHEN 'queued' THEN 5 ELSE 6 END,
        created_at DESC
    `)
    return result.recordset.map(camel)
  },

  async categories() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM vw_workflow_category_health WHERE organization_id = @org ORDER BY category_name')
    return result.recordset.map(camel)
  },

  async queues() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM vw_workflow_queue_health WHERE organization_id = @org ORDER BY queue_name')
    return result.recordset.map(camel)
  },

  async recoveries() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 20 * FROM vw_workflow_recovery_status WHERE organization_id = @org ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },

  async decisions() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 20 * FROM workflow_autonomous_decisions WHERE organization_id = @org ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },

  async outputReadiness() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_workflow_final_output_readiness WHERE organization_id = @org')
    return camel(result.recordset[0] ?? {})
  },

  async definitionHealth() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT wd.id, wd.code, wd.name, wd.workflow_type, wd.status,
        COUNT(DISTINCT wi.id) AS instances,
        COUNT(DISTINCT CASE WHEN wi.status = 'completed' THEN wi.id END) AS completed,
        COUNT(DISTINCT CASE WHEN wi.status = 'failed' THEN wi.id END) AS failed,
        COUNT(DISTINCT ws.id) AS stages,
        CAST(CASE WHEN COUNT(DISTINCT wi.id) = 0 THEN 100 ELSE 100.0 * COUNT(DISTINCT CASE WHEN wi.status = 'completed' THEN wi.id END) / COUNT(DISTINCT wi.id) END AS DECIMAL(8,2)) AS health_percent
      FROM workflow_definitions wd
      LEFT JOIN workflow_instances wi ON wi.workflow_definition_id = wd.id AND wi.is_deleted = 0
      LEFT JOIN workflow_stages ws ON ws.workflow_definition_id = wd.id AND ws.is_deleted = 0
      WHERE wd.organization_id = @org AND wd.is_deleted = 0
      GROUP BY wd.id, wd.code, wd.name, wd.workflow_type, wd.status
      ORDER BY wd.name
    `)
    return result.recordset.map(camel)
  },

  async pipeline() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      WITH stages AS (
        SELECT * FROM (VALUES
          (1,'Trigger'),(2,'Validation'),(3,'Planning'),(4,'AI Execution'),(5,'Content Production'),(6,'Review'),(7,'Approval'),(8,'Scheduling'),(9,'Publishing'),(10,'Analytics'),(11,'Learning'),(12,'Completed')
        ) AS x(stage_order, stage_name)
      )
      SELECT s.stage_order, s.stage_name,
        COUNT(CASE WHEN wi.status IN ('running','recovering','queued','blocked') THEN 1 END) AS active_workflow_count,
        COUNT(CASE WHEN wis.status = 'completed' THEN 1 END) AS completed_count,
        COUNT(CASE WHEN wis.status = 'failed' THEN 1 END) AS failed_count,
        AVG(CASE WHEN wis.started_at IS NOT NULL AND wis.completed_at IS NOT NULL THEN DATEDIFF(second, wis.started_at, wis.completed_at) END) AS average_duration_seconds,
        COUNT(CASE WHEN bj.status IN ('queued','pending') THEN 1 END) AS queue_depth,
        CAST(CASE WHEN COUNT(wis.id) = 0 THEN 100 ELSE 100.0 * COUNT(CASE WHEN wis.status = 'completed' THEN 1 END) / COUNT(wis.id) END AS DECIMAL(8,2)) AS health_percent,
        COUNT(DISTINCT ra.id) AS autonomous_recovery_count,
        COUNT(CASE WHEN wi.status = 'blocked' THEN 1 END) AS current_blockers
      FROM stages s
      LEFT JOIN workflow_stages ws ON ws.organization_id = @org AND ((s.stage_name = 'Completed' AND ws.name LIKE '%Completed%') OR ws.sequence_no = s.stage_order OR ws.display_order = s.stage_order)
      LEFT JOIN workflow_instance_steps wis ON wis.workflow_stage_id = ws.id
      LEFT JOIN workflow_instances wi ON wi.id = wis.workflow_instance_id
      LEFT JOIN workflow_recovery_actions ra ON ra.workflow_instance_id = wi.id
      LEFT JOIN background_jobs bj ON bj.organization_id = @org AND bj.name LIKE '%' + s.stage_name + '%'
      GROUP BY s.stage_order, s.stage_name
      ORDER BY s.stage_order
    `)
    return result.recordset.map(camel)
  },

  async filters() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_active_workflow_instances WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'workflowType', workflow_type FROM vw_active_workflow_instances WHERE organization_id = @org GROUP BY workflow_type
      UNION ALL SELECT 'priority', priority FROM vw_active_workflow_instances WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'recoveryState', recovery_state FROM vw_active_workflow_instances WHERE organization_id = @org GROUP BY recovery_state
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}
