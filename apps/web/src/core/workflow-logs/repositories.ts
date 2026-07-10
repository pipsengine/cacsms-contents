import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowLogsQuery = { q?: string; level?: string; eventType?: string; workflow?: string; workflowStatus?: string; stage?: string; queue?: string; worker?: string; agent?: string; provider?: string; model?: string; approvalStatus?: string; recoveryStrategy?: string; outputStatus?: string; publishingStatus?: string; analyticsStatus?: string; learningStatus?: string; incidentState?: string; organization?: string; brand?: string; environment?: string; traceId?: string; correlationId?: string; status?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow logs.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowLogsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(message LIKE @q OR workflow_name LIKE @q OR event_type LIKE @q OR stage_code LIKE @q OR trace_id LIKE @q OR correlation_id LIKE @q OR error_code LIKE @q OR brand LIKE @q)')
  }
  ;[
    ['level', 'level'], ['eventType', 'event_type'], ['workflow', 'workflow_name'], ['workflowStatus', 'status'], ['stage', 'stage_code'], ['queue', 'queue_name'],
    ['worker', 'worker_id'], ['agent', 'agent_code'], ['outputStatus', 'output_state'], ['publishingStatus', 'publishing_state'], ['analyticsStatus', 'analytics_state'],
    ['learningStatus', 'learning_state'], ['environment', 'environment'], ['traceId', 'trace_id'], ['correlationId', 'correlation_id'], ['status', 'status'], ['brand', 'brand'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowLogsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
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

export const workflowLogsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        COALESCE((SELECT TOP 1 events_per_second FROM workflow_log_ingestion_metrics WHERE organization_id=@org ORDER BY metric_time DESC),0) AS events_per_second,
        COALESCE((SELECT TOP 1 storage_usage_gb FROM workflow_log_ingestion_metrics WHERE organization_id=@org ORDER BY metric_time DESC),0) AS storage_usage_gb,
        (SELECT COUNT(*) FROM workflow_trace_completeness WHERE organization_id=@org AND state <> 'complete') AS open_trace_gaps,
        COALESCE((SELECT TOP 1 event_type FROM workflow_log_entries WHERE organization_id=@org GROUP BY event_type ORDER BY COUNT(*) DESC),'none detected') AS current_bottleneck
      FROM vw_workflow_logs_summary s WHERE s.organization_id=@org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async events(query: WorkflowLogsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT TOP 250 * FROM vw_workflow_event_stream WHERE ${where} ORDER BY timestamp DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_workflow_event_stream WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Workflow log event not found: ${id}`)
    return camel(result.recordset[0])
  },
  async context(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM workflow_log_properties WHERE workflow_log_entry_id = @id ORDER BY property_name')
    return result.recordset.map(camel)
  },
  async trace(traceId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('traceId', sql.NVarChar, traceId).query('SELECT * FROM vw_workflow_trace_explorer WHERE trace_id = @traceId ORDER BY start_time')
    return result.recordset.map(camel)
  },
  async instanceTrace(instanceId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('instanceId', sql.UniqueIdentifier, instanceId).query('SELECT * FROM vw_workflow_trace_explorer WHERE workflow_instance_id = @instanceId ORDER BY start_time')
    return result.recordset.map(camel)
  },
  async instanceRows(instanceId: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('instanceId', sql.UniqueIdentifier, instanceId).query(`SELECT * FROM ${table} WHERE workflow_instance_id = @instanceId ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  timeline(instanceId: string) { return this.instanceRows(instanceId, 'vw_workflow_stage_timeline', 'created_at') },
  recovery(instanceId: string) { return this.instanceRows(instanceId, 'vw_workflow_recovery_history', 'created_at') },
  lineage(instanceId: string) { void instanceId; return byOrgView('vw_workflow_output_lineage', 'created_at DESC') },
  traces() { return byOrgView('vw_workflow_trace_explorer', 'start_time') },
  stageTimeline() { return byOrgView('vw_workflow_stage_timeline', 'created_at DESC') },
  transitionTrace() { return byOrgView('workflow_transition_logs', 'created_at DESC') },
  agentTrace() { return byOrgView('workflow_agent_execution_logs', 'created_at DESC') },
  jobTrace() { return byOrgView('workflow_job_execution_logs', 'created_at DESC') },
  recoveryHistory() { return byOrgView('vw_workflow_recovery_history', 'created_at DESC') },
  outputLineage() { return byOrgView('vw_workflow_output_lineage', 'created_at DESC') },
  errorClusters() { return byOrgView('vw_workflow_error_clusters', 'last_seen_at DESC') },
  savedViews() { return byOrgView('workflow_log_saved_views', 'view_name') },
  alertRules() { return byOrgView('workflow_log_alert_rules', 'severity, name') },
  investigations() { return byOrgView('workflow_log_investigations', 'created_at DESC') },
  analytics() { return byOrgView('vw_workflow_log_analytics', 'event_count DESC') },
  retention() { return byOrgView('workflow_log_retention_policies', 'retention_days DESC') },
  completeness() { return byOrgView('vw_workflow_trace_completeness', 'created_at DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'level' AS kind, level AS value FROM vw_workflow_event_stream WHERE organization_id=@org GROUP BY level
      UNION ALL SELECT 'eventType', event_type FROM vw_workflow_event_stream WHERE organization_id=@org GROUP BY event_type
      UNION ALL SELECT 'workflow', workflow_name FROM vw_workflow_event_stream WHERE organization_id=@org GROUP BY workflow_name
      UNION ALL SELECT 'workflowStatus', status FROM vw_workflow_event_stream WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'stage', stage_code FROM vw_workflow_event_stream WHERE organization_id=@org AND stage_code IS NOT NULL GROUP BY stage_code
      UNION ALL SELECT 'queue', queue_name FROM vw_workflow_event_stream WHERE organization_id=@org AND queue_name IS NOT NULL GROUP BY queue_name
      UNION ALL SELECT 'worker', worker_id FROM vw_workflow_event_stream WHERE organization_id=@org AND worker_id IS NOT NULL GROUP BY worker_id
      UNION ALL SELECT 'agent', agent_code FROM vw_workflow_event_stream WHERE organization_id=@org AND agent_code IS NOT NULL GROUP BY agent_code
      UNION ALL SELECT 'outputStatus', output_state FROM vw_workflow_event_stream WHERE organization_id=@org AND output_state IS NOT NULL GROUP BY output_state
      UNION ALL SELECT 'publishingStatus', publishing_state FROM vw_workflow_event_stream WHERE organization_id=@org AND publishing_state IS NOT NULL GROUP BY publishing_state
      UNION ALL SELECT 'analyticsStatus', analytics_state FROM vw_workflow_event_stream WHERE organization_id=@org AND analytics_state IS NOT NULL GROUP BY analytics_state
      UNION ALL SELECT 'learningStatus', learning_state FROM vw_workflow_event_stream WHERE organization_id=@org AND learning_state IS NOT NULL GROUP BY learning_state
      UNION ALL SELECT 'environment', environment FROM vw_workflow_event_stream WHERE organization_id=@org GROUP BY environment
      UNION ALL SELECT 'brand', brand FROM vw_workflow_event_stream WHERE organization_id=@org AND brand IS NOT NULL GROUP BY brand
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowLogRepository = workflowLogsRepository
export const WorkflowLogQueryRepository = workflowLogsRepository
export const WorkflowTraceRepository = workflowLogsRepository
export const WorkflowStageTimelineRepository = workflowLogsRepository
export const WorkflowTransitionTraceRepository = workflowLogsRepository
export const WorkflowAgentTraceRepository = workflowLogsRepository
export const WorkflowJobTraceRepository = workflowLogsRepository
export const WorkflowRecoveryLogRepository = workflowLogsRepository
export const WorkflowOutputLineageRepository = workflowLogsRepository
export const WorkflowErrorClusterRepository = workflowLogsRepository
export const WorkflowLogSavedViewRepository = workflowLogsRepository
export const WorkflowLogAlertRepository = workflowLogsRepository
export const WorkflowLogInvestigationRepository = workflowLogsRepository
export const WorkflowLogRetentionRepository = workflowLogsRepository
export const WorkflowLogExportRepository = workflowLogsRepository
