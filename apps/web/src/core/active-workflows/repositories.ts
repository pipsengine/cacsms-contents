import { getConnectionPool, sql } from '@cacsms/database'

export type ActiveWorkflowsQuery = {
  q?: string
  workflowType?: string
  status?: string
  currentStage?: string
  priority?: string
  slaStatus?: string
  queue?: string
  worker?: string
  approvalState?: string
  recoveryState?: string
  organization?: string
  brand?: string
  finalOutput?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: ActiveWorkflowsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_name LIKE @q OR reference LIKE @q OR current_stage LIKE @q OR owner LIKE @q OR brand LIKE @q OR correlation_id LIKE @q)')
  }
  ;[
    ['workflowType', 'workflow_type'],
    ['status', 'status'],
    ['currentStage', 'current_stage'],
    ['priority', 'priority'],
    ['slaStatus', 'sla_status'],
    ['queue', 'queue_name'],
    ['worker', 'worker_name'],
    ['approvalState', 'approval_state'],
    ['recoveryState', 'recovery_state'],
    ['organization', 'organization'],
    ['brand', 'brand'],
    ['finalOutput', 'final_output'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof ActiveWorkflowsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  return where.join(' AND ')
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for active workflows.')
  return String(row.id)
}

async function view(name: string, orderBy = 'created_at DESC') {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${name} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const activeWorkflowRepository = {
  organizationId,

  async list(query: ActiveWorkflowsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_active_workflows WHERE ${where} ORDER BY CASE WHEN sla_status = 'breached' THEN 0 WHEN sla_status = 'at_risk' THEN 1 ELSE 2 END, started_at DESC`)
    return result.recordset.map(camel)
  },

  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT
        COUNT(*) AS active_workflows,
        COUNT(CASE WHEN status = 'running' THEN 1 END) AS running,
        COUNT(CASE WHEN status IN ('queued','waiting') THEN 1 END) AS waiting,
        COUNT(CASE WHEN status = 'awaiting_approval' THEN 1 END) AS awaiting_approval,
        COUNT(CASE WHEN status = 'recovering' OR recovery_state NOT IN ('none','resolved') THEN 1 END) AS recovering,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) AS blocked,
        COUNT(CASE WHEN sla_status <> 'breached' THEN 1 END) AS expected_to_complete,
        COUNT(CASE WHEN sla_status IN ('at_risk','breached') THEN 1 END) AS sla_at_risk,
        CAST(AVG(CASE WHEN final_output IN ('on_track','ready') THEN 100.0 WHEN final_output = 'recovering' THEN 70.0 WHEN final_output = 'at_risk' THEN 45.0 ELSE 20.0 END) AS DECIMAL(8,2)) AS final_output_on_track,
        COUNT(CASE WHEN guardrail_status = 'exceeds_guardrails' THEN 1 END) AS human_attention_required,
        COUNT(DISTINCT current_stage) AS running_stage_count,
        SUM(ai_agents) AS active_ai_agents,
        SUM(background_jobs) AS active_background_jobs,
        COUNT(DISTINCT worker_name) AS assigned_workers,
        COUNT(CASE WHEN status IN ('queued','waiting') THEN 1 END) AS queue_depth,
        CAST(AVG(progress_percent) AS DECIMAL(8,2)) AS average_progress,
        CAST(AVG(elapsed_seconds) AS DECIMAL(18,2)) AS average_elapsed_seconds,
        CAST(AVG(DATEDIFF(second, SYSUTCDATETIME(), estimated_completion_at)) AS DECIMAL(18,2)) AS average_eta_seconds,
        COALESCE((SELECT TOP 1 current_bottleneck FROM vw_active_workflows WHERE organization_id = @org AND current_bottleneck <> 'none detected' GROUP BY current_bottleneck ORDER BY COUNT(*) DESC), 'none detected') AS current_bottleneck,
        COUNT(CASE WHEN recovery_state NOT IN ('none','resolved') THEN 1 END) AS recovery_actions_in_progress,
        CAST(AVG(CASE WHEN final_output IN ('on_track','ready') THEN 100.0 ELSE 55.0 END) AS DECIMAL(8,2)) AS expected_final_output_rate,
        MAX(updated_at) AS last_event
      FROM vw_active_workflows
      WHERE organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },

  async pipeline() {
    const pool = await getConnectionPool()
    const result = await pool.request().query('SELECT * FROM vw_active_workflow_stages ORDER BY stage_order')
    return result.recordset.map(camel)
  },

  async agents() { return view('vw_active_workflow_agents', 'updated_at DESC') },
  async jobs() { return view('vw_active_workflow_jobs', 'started_at DESC') },
  async recoveries() { return view('vw_active_workflow_recoveries', 'created_at DESC') },
  async risks() { return view('vw_active_workflow_sla_risk', 'risk_percent DESC') },
  async outputReadiness() { return view('vw_active_workflow_final_output', 'readiness_percent ASC') },
  async outputReadinessForInstance(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM vw_active_workflow_final_output WHERE id = @id ORDER BY readiness_percent DESC')
    return result.recordset.map(camel)
  },
  async bottlenecks() { return view('vw_active_workflow_bottlenecks', 'confidence_percent DESC') },

  async decisions() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT TOP 40 d.*, aw.workflow_name
      FROM active_workflow_decisions d
      LEFT JOIN vw_active_workflows aw ON aw.id = d.workflow_instance_id
      WHERE aw.organization_id = @org OR d.workflow_instance_id IS NULL
      ORDER BY d.created_at DESC
    `)
    return result.recordset.map(camel)
  },

  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_active_workflows WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Active workflow not found: ${id}`)
    return camel(result.recordset[0])
  },

  async byInstance(id: string, viewName: string, orderBy = 'created_at DESC') {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${viewName} WHERE workflow_instance_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },

  async stages(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT s.*, ws.name AS stage_name, ws.sequence_no
      FROM workflow_instance_steps s
      JOIN workflow_stages ws ON ws.id = s.workflow_stage_id
      WHERE s.workflow_instance_id = @id
      ORDER BY ws.sequence_no
    `)
    return result.recordset.map(camel)
  },

  async map(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT ws.id, ws.name, ws.sequence_no,
        COALESCE(s.status, CASE WHEN ws.id = wi.current_stage_id THEN wi.status ELSE 'pending' END) AS status,
        COALESCE(s.progress_percent, 0) AS progress_percent
      FROM workflow_instances wi
      JOIN workflow_stages ws ON ws.workflow_definition_id = wi.workflow_definition_id
      LEFT JOIN workflow_instance_steps s ON s.workflow_instance_id = wi.id AND s.workflow_stage_id = ws.id
      WHERE wi.id = @id AND ws.is_deleted = 0
      ORDER BY ws.sequence_no
    `)
    return result.recordset.map(camel)
  },

  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'workflowType' AS kind, workflow_type AS value FROM vw_active_workflows WHERE organization_id = @org GROUP BY workflow_type
      UNION ALL SELECT 'status', status FROM vw_active_workflows WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'currentStage', current_stage FROM vw_active_workflows WHERE organization_id = @org GROUP BY current_stage
      UNION ALL SELECT 'priority', priority FROM vw_active_workflows WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'slaStatus', sla_status FROM vw_active_workflows WHERE organization_id = @org GROUP BY sla_status
      UNION ALL SELECT 'queue', queue_name FROM vw_active_workflows WHERE organization_id = @org GROUP BY queue_name
      UNION ALL SELECT 'worker', worker_name FROM vw_active_workflows WHERE organization_id = @org GROUP BY worker_name
      UNION ALL SELECT 'approvalState', approval_state FROM vw_active_workflows WHERE organization_id = @org GROUP BY approval_state
      UNION ALL SELECT 'recoveryState', recovery_state FROM vw_active_workflows WHERE organization_id = @org GROUP BY recovery_state
      UNION ALL SELECT 'organization', organization FROM vw_active_workflows WHERE organization_id = @org GROUP BY organization
      UNION ALL SELECT 'brand', brand FROM vw_active_workflows WHERE organization_id = @org GROUP BY brand
      UNION ALL SELECT 'finalOutput', final_output FROM vw_active_workflows WHERE organization_id = @org GROUP BY final_output
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const ActiveWorkflowRepository = activeWorkflowRepository
export const ActiveWorkflowStageRepository = activeWorkflowRepository
export const ActiveWorkflowAgentRepository = activeWorkflowRepository
export const ActiveWorkflowJobRepository = activeWorkflowRepository
export const ActiveWorkflowRecoveryRepository = activeWorkflowRepository
export const ActiveWorkflowRiskRepository = activeWorkflowRepository
export const ActiveWorkflowOutputRepository = activeWorkflowRepository
export const ActiveWorkflowDecisionRepository = activeWorkflowRepository
