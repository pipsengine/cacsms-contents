import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowTemplatesQuery = { q?: string; category?: string; status?: string; validationStatus?: string; complexity?: string; recoveryEnabled?: string; approvalConfigured?: string; publishingConfigured?: string; analyticsConfigured?: string; learningConfigured?: string; organizationScope?: string; owner?: string; recommended?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow templates.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowTemplatesQuery) {
  const where = ['(organization_id = @org OR organization_id IS NULL)']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(template_code LIKE @q OR template_name LIKE @q OR description LIKE @q OR category_name LIKE @q)')
  }
  ;[
    ['category', 'category_name'], ['status', 'status'], ['validationStatus', 'validation_status'], ['complexity', 'complexity'], ['organizationScope', 'organization_scope'], ['owner', 'owner_name'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowTemplatesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  ;[
    ['recoveryEnabled', 'recovery_enabled'], ['approvalConfigured', 'approval_configured'], ['publishingConfigured', 'publishing_configured'], ['analyticsConfigured', 'analytics_configured'], ['learningConfigured', 'learning_configured'], ['recommended', 'recommended'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowTemplatesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.Bit, value === 'true' || value === '1' || value === 'Yes')
      where.push(`${column} = @${key}`)
    }
  })
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const workflowTemplatesRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT TOP 1 h.*,
        (SELECT SUM(usage_count) FROM vw_workflow_templates_list WHERE organization_id=@org) AS templates_used_this_month,
        COALESCE((SELECT TOP 1 category_name FROM vw_workflow_template_categories WHERE organization_id=@org ORDER BY invalid DESC, template_count DESC), 'none detected') AS current_library_bottleneck
      FROM vw_workflow_template_health h
    `)
    return camel(result.recordset[0] ?? {})
  },
  async list(query: WorkflowTemplatesQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_templates_list WHERE ${where} ORDER BY recommended DESC, CASE WHEN status='Production Ready' THEN 0 WHEN status='Approved' THEN 1 WHEN status='Draft' THEN 2 ELSE 3 END, updated_at DESC`)
    return result.recordset.map(camel)
  },
  categories() { return byOrgView('vw_workflow_template_categories', 'template_count DESC') },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_templates_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow template not found: ${id}`)
    return camel(result.recordset[0])
  },
  async byTemplate(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_template_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  versions(id: string) { return this.byTemplate(id, 'workflow_template_versions', 'version_number DESC') },
  validation(id: string) { return this.byTemplate(id, 'workflow_template_validation_runs', 'created_at DESC') },
  simulations(id: string) { return this.byTemplate(id, 'workflow_template_simulation_runs', 'created_at DESC') },
  dependencies(id: string) { return this.byTemplate(id, 'workflow_template_dependencies', 'created_at DESC') },
  performance(id: string) { return this.byTemplate(id, 'workflow_template_performance', 'metric_date DESC') },
  recommendations() { return byOrgView('vw_workflow_template_recommendations', 'match_score DESC') },
  finalOutputReadiness() { return byOrgView('vw_workflow_template_final_output_readiness', 'readiness_percent DESC') },
  async allVersions() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT v.id, v.workflow_template_id, v.version_number, v.status, v.created_by, v.change_summary, v.validation_status, v.approval_status, v.published_environments, v.instantiation_count, v.success_rate, v.rollback_eligible, v.created_at, t.template_code, t.template_name, t.organization_id FROM workflow_template_versions v JOIN workflow_templates t ON t.id = v.workflow_template_id WHERE t.organization_id = @org ORDER BY v.created_at DESC`)
    return result.recordset.map(camel)
  },
  async allValidation() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT r.id, r.workflow_template_id, r.status, r.validation_score, r.error_count, r.warning_count, r.recommendation_count, r.auto_fix_available, r.created_at, t.template_code, t.template_name, t.organization_id FROM workflow_template_validation_runs r JOIN workflow_templates t ON t.id = r.workflow_template_id WHERE t.organization_id = @org ORDER BY r.created_at DESC`)
    return result.recordset.map(camel)
  },
  async simulationsAll() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT s.id, s.workflow_template_id, s.brand, s.status, s.estimated_duration_ms, s.estimated_cost, s.final_output_readiness, s.risk_summary, s.created_at, t.template_code, t.template_name, t.organization_id FROM workflow_template_simulation_runs s JOIN workflow_templates t ON t.id = s.workflow_template_id WHERE t.organization_id = @org ORDER BY s.created_at DESC`)
    return result.recordset.map(camel)
  },
  dependenciesAll() { return byOrgView('vw_workflow_template_dependencies', 'created_at DESC') },
  performanceAll() { return byOrgView('vw_workflow_template_performance', 'metric_date DESC') },
  async documentation() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT d.id, d.workflow_template_id, d.doc_type, d.title, d.content_summary, d.generated_at, t.template_code, t.template_name, t.organization_id FROM workflow_template_documentation d JOIN workflow_templates t ON t.id = d.workflow_template_id WHERE t.organization_id = @org ORDER BY d.generated_at DESC`)
    return result.recordset.map(camel)
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category_name AS value FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'status', status FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'validationStatus', validation_status FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY validation_status
      UNION ALL SELECT 'complexity', complexity FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY complexity
      UNION ALL SELECT 'organizationScope', organization_scope FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY organization_scope
      UNION ALL SELECT 'owner', owner_name FROM vw_workflow_templates_list WHERE organization_id=@org GROUP BY owner_name
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowTemplateRepository = workflowTemplatesRepository
export const WorkflowTemplateVersionRepository = workflowTemplatesRepository
export const WorkflowTemplateCategoryRepository = workflowTemplatesRepository
export const WorkflowTemplateStageRepository = workflowTemplatesRepository
export const WorkflowTemplateDependencyRepository = workflowTemplatesRepository
export const WorkflowTemplateInstantiationRepository = workflowTemplatesRepository
export const WorkflowTemplateValidationRepository = workflowTemplatesRepository
export const WorkflowTemplateSimulationRepository = workflowTemplatesRepository
export const WorkflowTemplatePerformanceRepository = workflowTemplatesRepository
export const WorkflowTemplateRecommendationRepository = workflowTemplatesRepository
export const WorkflowTemplateDocumentationRepository = workflowTemplatesRepository
export const WorkflowTemplateFinalOutputRepository = workflowTemplatesRepository
