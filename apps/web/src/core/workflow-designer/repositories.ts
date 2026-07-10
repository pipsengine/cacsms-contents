import { getConnectionPool, sql } from '@cacsms/database'

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

export const workflowDesignerRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!row) throw new Error('No organization row exists for workflow designer.')
    return String(row.id)
  },

  async definitions() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT wd.*,
        (SELECT COUNT(*) FROM workflow_stages ws WHERE ws.workflow_definition_id = wd.id AND ws.is_deleted = 0) AS stage_count,
        (SELECT COUNT(*) FROM workflow_node_configurations n WHERE n.workflow_definition_id = wd.id) AS node_count,
        (SELECT TOP 1 status FROM workflow_validation_runs vr WHERE vr.workflow_definition_id = wd.id ORDER BY validated_at DESC) AS validation_status,
        (SELECT TOP 1 status FROM workflow_deployments d WHERE d.workflow_definition_id = wd.id ORDER BY deployed_at DESC) AS deployment_status,
        (SELECT TOP 1 created_at FROM workflow_change_history h WHERE h.workflow_definition_id = wd.id ORDER BY created_at DESC) AS last_saved_at
      FROM workflow_definitions wd
      WHERE wd.organization_id = @org AND wd.is_deleted = 0
      ORDER BY wd.name
    `)
    return result.recordset.map(camel)
  },

  async definition(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM workflow_definitions WHERE id = @id AND is_deleted = 0')
    if (!result.recordset[0]) throw new Error(`Workflow definition not found: ${id}`)
    return camel(result.recordset[0])
  },

  async versions(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_definition_versions WHERE workflow_definition_id = @id ORDER BY version_number DESC')
    return result.recordset.map(camel)
  },

  async canvas(id: string) {
    const pool = await getConnectionPool()
    const [nodes, connections, groups, annotations, variables, inputSchemas, outputSchemas] = await Promise.all([
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_node_configurations WHERE workflow_definition_id = @id ORDER BY position_y, position_x'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_connections WHERE workflow_definition_id = @id ORDER BY priority, created_at'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_groups WHERE workflow_definition_id = @id ORDER BY created_at'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_annotations WHERE workflow_definition_id = @id ORDER BY created_at'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_variables WHERE workflow_definition_id = @id ORDER BY variable_name'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_input_schemas WHERE workflow_definition_id = @id ORDER BY version_number DESC'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_output_schemas WHERE workflow_definition_id = @id ORDER BY version_number DESC'),
    ])
    return {
      nodes: nodes.recordset.map(camel),
      connections: connections.recordset.map(camel),
      groups: groups.recordset.map(camel),
      annotations: annotations.recordset.map(camel),
      variables: variables.recordset.map(camel),
      inputSchemas: inputSchemas.recordset.map(camel),
      outputSchemas: outputSchemas.recordset.map(camel),
    }
  },

  async nodeTypes() {
    const pool = await getConnectionPool()
    const result = await pool.request().query('SELECT * FROM workflow_node_types WHERE is_active = 1 ORDER BY category, display_name')
    return result.recordset.map(camel)
  },

  async templates() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM workflow_templates WHERE organization_id = @org ORDER BY category, template_name')
    return result.recordset.map(camel)
  },

  async validation(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 10 * FROM workflow_validation_runs WHERE workflow_definition_id = @id ORDER BY validated_at DESC')
    return result.recordset.map(camel)
  },

  async simulations(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 10 * FROM workflow_simulation_runs WHERE workflow_definition_id = @id ORDER BY started_at DESC')
    return result.recordset.map(camel)
  },

  async history(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 20 * FROM workflow_change_history WHERE workflow_definition_id = @id ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },

  async documentation(id: string) {
    const pool = await getConnectionPool()
    const [cost, perf, deployments] = await Promise.all([
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM workflow_cost_estimates WHERE workflow_definition_id = @id ORDER BY created_at DESC'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM workflow_performance_estimates WHERE workflow_definition_id = @id ORDER BY created_at DESC'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 5 * FROM workflow_deployments WHERE workflow_definition_id = @id ORDER BY deployed_at DESC'),
    ])
    return {
      cost: camel(cost.recordset[0] ?? {}),
      performance: camel(perf.recordset[0] ?? {}),
      deployments: deployments.recordset.map(camel),
    }
  },
}
