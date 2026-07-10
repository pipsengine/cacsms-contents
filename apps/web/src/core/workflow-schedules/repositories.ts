import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowSchedulesQuery = { q?: string; status?: string; scheduleType?: string; frequency?: string; workflow?: string; queue?: string; workerPool?: string; timezone?: string; priority?: string; owner?: string; organization?: string; brand?: string; environment?: string; autoOptimization?: string; missedRunPolicy?: string; capacityRisk?: string; lastResult?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow schedules.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowSchedulesQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(schedule_code LIKE @q OR schedule_name LIKE @q OR description LIKE @q OR workflow LIKE @q OR schedule_type LIKE @q OR brand LIKE @q)')
  }
  ;[
    ['status', 'status'], ['scheduleType', 'schedule_type'], ['frequency', 'frequency'], ['workflow', 'workflow'], ['queue', 'queue_name'], ['workerPool', 'worker_pool'],
    ['timezone', 'timezone'], ['priority', 'priority'], ['owner', 'owner'], ['organization', 'organization'], ['brand', 'brand'], ['environment', 'environment'],
    ['missedRunPolicy', 'missed_run_policy'], ['lastResult', 'last_result'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowSchedulesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.autoOptimization && query.autoOptimization !== 'All') {
    request.input('autoOptimization', sql.Bit, query.autoOptimization === 'true' || query.autoOptimization === '1' || query.autoOptimization === 'Yes')
    where.push('auto_optimization = @autoOptimization')
  }
  if (query.capacityRisk && query.capacityRisk !== 'All') {
    request.input('capacityRisk', sql.NVarChar, query.capacityRisk)
    where.push(`(CASE WHEN avg_delay_seconds > 60 THEN 'medium' ELSE 'low' END) = @capacityRisk`)
  }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const workflowSchedulesRepository = {
  organizationId,
  async list(query: WorkflowSchedulesQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_schedules_list WHERE ${where} ORDER BY CASE WHEN status IN ('missed','recovering','warning','invalid','delayed') THEN 0 ELSE 1 END, next_run_at`)
    return result.recordset.map(camel)
  },
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM vw_schedule_conflicts c WHERE c.organization_id = @org AND c.status = 'open') AS schedule_conflicts,
        (SELECT COUNT(*) FROM vw_schedule_capacity_forecast f WHERE f.organization_id = @org AND f.capacity_gap > 0) AS capacity_risk_windows,
        (SELECT COUNT(*) FROM vw_schedule_calendar c WHERE c.organization_id = @org AND c.start_time < SYSUTCDATETIME() AND c.status NOT IN ('running','completed')) AS overdue_runs,
        (SELECT TOP 1 forecast_window_start FROM vw_schedule_capacity_forecast f WHERE f.organization_id = @org ORDER BY forecast_window_start) AS next_major_execution_window,
        COALESCE((SELECT TOP 1 sla_risk FROM vw_schedule_capacity_forecast f WHERE f.organization_id = @org AND f.capacity_gap > 0 ORDER BY capacity_gap DESC), 'low') AS current_capacity_risk
      FROM vw_scheduler_engine_summary s WHERE s.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async types() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT schedule_type, COUNT(*) AS total_schedules, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_schedules,
        COUNT(CASE WHEN next_run_at BETWEEN SYSUTCDATETIME() AND DATEADD(hour, 1, SYSUTCDATETIME()) THEN 1 END) AS due_soon,
        SUM(executions_today) AS executions_today, AVG(success_rate) AS success_rate, SUM(missed_runs) AS missed_runs,
        SUM(recovery_count) AS recoveries, MIN(next_run_at) AS next_execution, AVG(avg_delay_seconds) AS average_delay_seconds,
        AVG(CASE WHEN status = 'active' THEN 96.0 WHEN status = 'warning' THEN 74.0 ELSE 62.0 END) AS health_percent
      FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY schedule_type ORDER BY schedule_type
    `)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_schedules_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow schedule not found: ${id}`)
    return camel(result.recordset[0])
  },
  async bySchedule(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_schedule_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  versions(id: string) { return this.bySchedule(id, 'workflow_schedule_versions', 'created_at DESC') },
  executions(id: string) { return this.bySchedule(id, 'workflow_schedule_executions', 'planned_start DESC') },
  validation(id: string) { return this.bySchedule(id, 'workflow_schedule_change_history', 'created_at DESC') },
  calendar() { return byOrgView('vw_schedule_calendar', 'start_time') },
  conflicts() { return byOrgView('vw_schedule_conflicts', 'created_at DESC') },
  capacityForecast() { return byOrgView('vw_schedule_capacity_forecast', 'forecast_window_start') },
  missedRuns() { return byOrgView('vw_schedule_missed_runs', 'detected_at DESC') },
  performance() { return byOrgView('vw_schedule_performance', 'executions_today DESC') },
  recommendations() { return byOrgView('vw_schedule_recommendations', 'created_at DESC') },
  finalOutputReadiness() { return byOrgView('vw_schedule_final_output_readiness', 'readiness_percent DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'scheduleType', schedule_type FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY schedule_type
      UNION ALL SELECT 'frequency', frequency FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY frequency
      UNION ALL SELECT 'workflow', workflow FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY workflow
      UNION ALL SELECT 'queue', queue_name FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY queue_name
      UNION ALL SELECT 'workerPool', worker_pool FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY worker_pool
      UNION ALL SELECT 'timezone', timezone FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY timezone
      UNION ALL SELECT 'priority', priority FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'owner', owner FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY owner
      UNION ALL SELECT 'organization', organization FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY organization
      UNION ALL SELECT 'brand', brand FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY brand
      UNION ALL SELECT 'environment', environment FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'missedRunPolicy', missed_run_policy FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY missed_run_policy
      UNION ALL SELECT 'lastResult', last_result FROM vw_workflow_schedules_list WHERE organization_id = @org GROUP BY last_result
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowScheduleRepository = workflowSchedulesRepository
export const ScheduleVersionRepository = workflowSchedulesRepository
export const ScheduleCalendarRepository = workflowSchedulesRepository
export const SchedulePolicyRepository = workflowSchedulesRepository
export const ScheduleExecutionRepository = workflowSchedulesRepository
export const ScheduleFailureRepository = workflowSchedulesRepository
export const ScheduleRecoveryRepository = workflowSchedulesRepository
export const ScheduleConflictRepository = workflowSchedulesRepository
export const ScheduleForecastRepository = workflowSchedulesRepository
export const ScheduleRecommendationRepository = workflowSchedulesRepository
export const ScheduleMetricsRepository = workflowSchedulesRepository
export const ScheduleFinalOutputRepository = workflowSchedulesRepository
