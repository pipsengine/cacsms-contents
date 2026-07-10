import { getConnectionPool, sql } from '@cacsms/database'

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

export type WorkflowDefinitionsQuery = {
  q?: string
  status?: string
  validationStatus?: string
  category?: string
  workflowType?: string
  owner?: string
  environment?: string
  recoveryPolicy?: string
  finalOutput?: string
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowDefinitionsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(code LIKE @q OR name LIKE @q OR description LIKE @q OR category LIKE @q OR owner LIKE @q)')
  }
  ;[
    ['status', 'status'],
    ['validationStatus', 'validation_status'],
    ['category', 'category'],
    ['workflowType', 'workflow_type'],
    ['owner', 'owner'],
    ['environment', 'environment'],
    ['recoveryPolicy', 'recovery_policy'],
    ['finalOutput', 'final_output'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowDefinitionsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  return where.join(' AND ')
}

export const workflowDefinitionsRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!row) throw new Error('No organization row exists for workflow definitions.')
    return String(row.id)
  },

  async list(query: WorkflowDefinitionsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_definitions_list WHERE ${where} ORDER BY health_percent ASC, last_updated DESC`)
    return result.recordset.map(camel)
  },

  async summary() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT h.*,
        (SELECT COUNT(*) FROM workflow_definition_versions v JOIN workflow_definitions wd ON wd.id = v.workflow_definition_id WHERE wd.organization_id = @org AND v.status = 'published') AS published_versions,
        (SELECT COUNT(*) FROM workflow_definition_versions v JOIN workflow_definitions wd ON wd.id = v.workflow_definition_id WHERE wd.organization_id = @org AND v.status = 'draft') AS draft_versions,
        (SELECT COUNT(*) FROM workflow_definitions wd WHERE wd.organization_id = @org AND wd.status IN ('deprecated')) AS deprecated_definitions,
        (SELECT COUNT(*) FROM workflow_definitions wd WHERE wd.organization_id = @org AND wd.status IN ('disabled','inactive')) AS disabled_count,
        (SELECT COUNT(*) FROM workflow_definition_health dh JOIN workflow_definitions wd ON wd.id = dh.workflow_definition_id WHERE wd.organization_id = @org AND dh.recovery_enabled = 1) AS recovery_enabled_count,
        (SELECT COUNT(*) FROM workflow_definition_health dh JOIN workflow_definitions wd ON wd.id = dh.workflow_definition_id WHERE wd.organization_id = @org AND dh.final_output_ready = 1) AS output_ready_count,
        (SELECT COUNT(*) FROM workflow_definitions wd WHERE wd.organization_id = @org AND MONTH(COALESCE(wd.updated_at, wd.created_at)) = MONTH(SYSUTCDATETIME()) AND YEAR(COALESCE(wd.updated_at, wd.created_at)) = YEAR(SYSUTCDATETIME())) AS updated_this_month,
        (SELECT MAX(validated_at) FROM workflow_validation_runs vr JOIN workflow_definitions wd ON wd.id = vr.workflow_definition_id WHERE wd.organization_id = @org) AS last_validation_run
      FROM vw_workflow_definition_health h
      WHERE h.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },

  async categories() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT category,
        COUNT(*) AS definition_count,
        COUNT(CASE WHEN current_published_version IS NOT NULL THEN 1 END) AS published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft,
        COUNT(CASE WHEN validation_status IN ('invalid','warning') OR health_status IN ('Invalid','Warning') THEN 1 END) AS invalid,
        AVG(success_rate) AS average_success_rate,
        AVG(avg_duration_seconds) AS average_duration_seconds,
        AVG(CASE WHEN recovery_policy = 'Enabled' THEN 100.0 ELSE 0 END) AS recovery_coverage,
        AVG(CASE WHEN final_output = 'Ready' THEN 100.0 ELSE 0 END) AS final_output_readiness,
        MAX(last_execution) AS last_execution,
        AVG(health_percent) AS health_percent
      FROM vw_workflow_definitions_list
      WHERE organization_id = @org
      GROUP BY category
      ORDER BY category
    `)
    return result.recordset.map(camel)
  },

  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_definitions_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow definition not found: ${id}`)
    return camel(result.recordset[0])
  },

  async byIdView(id: string, view: 'vw_workflow_definition_versions' | 'vw_workflow_definition_dependencies' | 'vw_workflow_definition_readiness' | 'vw_workflow_definition_recommendations') {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${view} WHERE workflow_definition_id = @id ORDER BY created_at DESC`)
    return result.recordset.map(camel)
  },

  async validation(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 10 * FROM workflow_validation_runs WHERE workflow_definition_id = @id ORDER BY validated_at DESC')
    return result.recordset.map(camel)
  },

  async executions(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 30 * FROM workflow_instances WHERE workflow_definition_id = @id AND is_deleted = 0 ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },

  async documentation(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 5 * FROM workflow_documentation WHERE workflow_definition_id = @id ORDER BY generated_at DESC')
    return result.recordset.map(camel)
  },

  async recommendations() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 30 * FROM vw_workflow_definition_recommendations WHERE organization_id = @org ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },

  async filters() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'validationStatus', validation_status FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY validation_status
      UNION ALL SELECT 'category', category FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY category
      UNION ALL SELECT 'workflowType', workflow_type FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY workflow_type
      UNION ALL SELECT 'owner', owner FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY owner
      UNION ALL SELECT 'environment', environment FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'recoveryPolicy', recovery_policy FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY recovery_policy
      UNION ALL SELECT 'finalOutput', final_output FROM vw_workflow_definitions_list WHERE organization_id = @org GROUP BY final_output
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}
