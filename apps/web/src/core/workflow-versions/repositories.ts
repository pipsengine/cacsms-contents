import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowVersionsQuery = {
  q?: string
  versionStatus?: string
  validationStatus?: string
  compatibilityStatus?: string
  environment?: string
  rolloutStrategy?: string
  workflow?: string
  owner?: string
  finalOutputCompatibility?: string
  rollbackState?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow versions.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowVersionsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_code LIKE @q OR workflow_name LIKE @q OR definition_code LIKE @q OR definition_name LIKE @q OR owner LIKE @q)')
  }
  ;[
    ['versionStatus', 'version_status'],
    ['validationStatus', 'validation_status'],
    ['compatibilityStatus', 'compatibility_status'],
    ['environment', 'environment'],
    ['rolloutStrategy', 'rollout_strategy'],
    ['workflow', 'workflow_code'],
    ['owner', 'owner'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowVersionsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.finalOutputCompatibility && query.finalOutputCompatibility !== 'All') {
    const value = query.finalOutputCompatibility
    if (value === 'Blocked') where.push('final_output_compatible < 75')
    if (value === 'Warning') where.push('final_output_compatible >= 75 AND final_output_compatible < 90')
    if (value === 'Compatible') where.push('final_output_compatible >= 90')
  }
  if (query.rollbackState && query.rollbackState !== 'All') {
    request.input('rollbackState', sql.NVarChar, query.rollbackState)
    where.push('version_status = @rollbackState')
  }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const workflowVersionsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_workflow_version_summary WHERE organization_id = @org')
    return camel(result.recordset[0] ?? {})
  },
  async list(query: WorkflowVersionsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_versions_list WHERE ${where} ORDER BY CASE WHEN version_status IN ('Rollback Pending','Validation Failed') THEN 0 WHEN release_status IN ('Canary','Rolling Out','Paused') THEN 1 ELSE 2 END, updated_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_versions_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow version not found: ${id}`)
    return camel(result.recordset[0])
  },
  async byVersion(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_definition_version_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  validation(id: string) { return this.byVersion(id, 'workflow_version_validations', 'created_at DESC') },
  compatibility(id: string) { return this.byVersion(id, 'workflow_version_compatibility', 'created_at DESC') },
  dependencies(id: string) { return this.byVersion(id, 'workflow_version_dependencies', 'created_at DESC') },
  health(id: string) { return this.byVersion(id, 'workflow_version_health_metrics', 'created_at DESC') },
  finalOutputCompatibility(id: string) { return this.byVersion(id, 'workflow_version_final_output_compatibility', 'created_at DESC') },
  async releaseReadiness(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_version_release_readiness WHERE id = @id')
    return camel(result.recordset[0] ?? {})
  },
  rollouts() { return byOrgView('vw_workflow_version_rollouts', 'created_at DESC') },
  async rollout(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_version_rollouts WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow version rollout not found: ${id}`)
    return camel(result.recordset[0])
  },
  async rolloutCanary(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_version_canary_metrics WHERE workflow_version_rollout_id = @id ORDER BY created_at DESC')
    return result.recordset.map(camel)
  },
  async rolloutHealth(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT h.* FROM workflow_version_health_metrics h JOIN workflow_version_rollouts r ON r.workflow_definition_version_id = h.workflow_definition_version_id WHERE r.id = @id ORDER BY h.created_at DESC')
    return result.recordset.map(camel)
  },
  drift() { return byOrgView('vw_workflow_version_drift', 'created_at DESC') },
  migrations() { return byOrgView('workflow_version_migrations m JOIN workflow_definition_versions v ON v.id = m.workflow_definition_version_id', 'm.created_at DESC') },
  comparisons() { return byOrgView('workflow_version_comparisons c JOIN workflow_definition_versions v ON v.id = c.workflow_definition_version_id', 'c.created_at DESC') },
  releaseReadinessAll() { return byOrgView('vw_workflow_version_release_readiness', 'updated_at DESC') },
  canaryMetrics() { return byOrgView('vw_workflow_version_canary_comparison', 'created_at DESC') },
  healthAll() { return byOrgView('vw_workflow_version_health', 'created_at DESC') },
  compatibilityAll() { return byOrgView('vw_workflow_version_compatibility', 'created_at DESC') },
  rollbacks() { return byOrgView('workflow_version_rollbacks r JOIN workflow_definition_versions v ON v.id = r.workflow_definition_version_id', 'r.created_at DESC') },
  decisions() { return byOrgView('workflow_version_autonomous_decisions d JOIN workflow_definition_versions v ON v.id = d.workflow_definition_version_id', 'd.created_at DESC') },
  finalOutputAll() { return byOrgView('vw_workflow_version_final_output_compatibility', 'created_at DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'versionStatus' AS kind, version_status AS value FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY version_status
      UNION ALL SELECT 'validationStatus', validation_status FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY validation_status
      UNION ALL SELECT 'compatibilityStatus', compatibility_status FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY compatibility_status
      UNION ALL SELECT 'environment', environment FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY environment
      UNION ALL SELECT 'rolloutStrategy', rollout_strategy FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY rollout_strategy
      UNION ALL SELECT 'workflow', workflow_code FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY workflow_code
      UNION ALL SELECT 'owner', owner FROM vw_workflow_versions_list WHERE organization_id=@org GROUP BY owner
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowVersionRepository = workflowVersionsRepository
export const WorkflowDefinitionVersionRepository = workflowVersionsRepository
export const WorkflowVersionValidationRepository = workflowVersionsRepository
export const WorkflowVersionCompatibilityRepository = workflowVersionsRepository
export const WorkflowVersionReleaseRepository = workflowVersionsRepository
export const WorkflowVersionRolloutRepository = workflowVersionsRepository
export const WorkflowVersionCanaryRepository = workflowVersionsRepository
export const WorkflowVersionRollbackRepository = workflowVersionsRepository
export const WorkflowVersionMigrationRepository = workflowVersionsRepository
export const WorkflowVersionDriftRepository = workflowVersionsRepository
export const WorkflowVersionFinalOutputRepository = workflowVersionsRepository

