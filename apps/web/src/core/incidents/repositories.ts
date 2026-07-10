import { getConnectionPool, sql } from '@cacsms/database'
import type { IncidentQuery, IncidentRow } from './types'

function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : null
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

function mapIncident(row: Record<string, unknown>): IncidentRow {
  return {
    id: String(row.id),
    incidentNumber: String(row.incident_number),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    sourceType: String(row.source_type),
    sourceReferenceId: row.source_reference_id ? String(row.source_reference_id) : null,
    severity: String(row.severity),
    priority: String(row.priority),
    status: String(row.status),
    environment: String(row.environment),
    affectedService: row.affected_service ? String(row.affected_service) : null,
    affectedModule: row.affected_module ? String(row.affected_module) : null,
    customerImpact: String(row.customer_impact),
    impactScope: row.impact_scope ? String(row.impact_scope) : null,
    assignedTeam: row.assigned_team_name ? String(row.assigned_team_name) : null,
    incidentCommander: row.incident_commander_name ? String(row.incident_commander_name) : null,
    acknowledgedAt: iso(row.acknowledged_at),
    investigatingAt: iso(row.investigating_at),
    mitigatedAt: iso(row.mitigated_at),
    resolvedAt: iso(row.resolved_at),
    closedAt: iso(row.closed_at),
    slaDeadline: iso(row.sla_deadline),
    slaStatus: row.sla_status ? String(row.sla_status) : null,
    minutesRemaining: row.minutes_remaining === null || row.minutes_remaining === undefined ? null : Number(row.minutes_remaining),
    rootCauseStatus: String(row.root_cause_status),
    resolutionSummary: row.resolution_summary ? String(row.resolution_summary) : null,
    detectionSignal: row.detection_signal ? String(row.detection_signal) : null,
    escalationLevel: Number(row.escalation_level ?? 0),
    communicationStatus: String(row.communication_status),
    relatedAlerts: Number(row.related_alerts ?? 0),
    relatedLogs: Number(row.related_logs ?? 0),
    relatedWorkflows: Number(row.related_workflows ?? 0),
    relatedJobs: Number(row.related_jobs ?? 0),
    durationMinutes: Number(row.duration_minutes ?? 0),
    createdAt: String(iso(row.created_at)),
    updatedAt: String(iso(row.updated_at)),
  }
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: IncidentQuery) {
  const where = ['i.organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(i.incident_number LIKE @q OR i.title LIKE @q OR i.description LIKE @q OR i.source_reference_id LIKE @q OR svc.service_name LIKE @q OR mod.module_name LIKE @q)')
  }
  const filters: Array<[keyof IncidentQuery, string]> = [
    ['severity', 'i.severity'],
    ['priority', 'i.priority'],
    ['status', 'i.status'],
    ['source', 'i.source_type'],
    ['service', 'svc.service_name'],
    ['module', 'mod.module_name'],
    ['environment', 'i.environment'],
    ['team', 'i.assigned_team_name'],
    ['customerImpact', 'i.customer_impact'],
    ['slaStatus', 'sla.sla_status'],
  ]
  filters.forEach(([key, column]) => {
    const value = query[key]
    if (value && value !== 'All') {
      request.input(String(key), sql.NVarChar, value)
      where.push(`${column} = @${String(key)}`)
    }
  })
  return where.join(' AND ')
}

const baseSelect = `
  SELECT i.*, svc.service_name AS affected_service, mod.module_name AS affected_module, sla.sla_status, sla.minutes_remaining,
    DATEDIFF(minute, i.created_at, COALESCE(i.closed_at, i.resolved_at, SYSUTCDATETIME())) AS duration_minutes,
    (SELECT COUNT(*) FROM incident_alert_links x WHERE x.incident_id = i.id) AS related_alerts,
    (SELECT COUNT(*) FROM incident_log_links x WHERE x.incident_id = i.id) AS related_logs,
    (SELECT COUNT(*) FROM incident_workflow_links x WHERE x.incident_id = i.id) AS related_workflows,
    (SELECT COUNT(*) FROM incident_job_links x WHERE x.incident_id = i.id) AS related_jobs
  FROM incidents i
  LEFT JOIN incident_services svc ON svc.id = i.affected_service_id
  LEFT JOIN incident_modules mod ON mod.id = i.affected_module_id
  LEFT JOIN incident_sla_tracking sla ON sla.incident_id = i.id
`

export const incidentRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!row) throw new Error('No organization row exists for incident management.')
    return String(row.id)
  },

  async list(query: IncidentQuery = {}) {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const page = Math.max(1, Number(query.page ?? 1))
    const pageSize = Math.min(200, Math.max(10, Number(query.pageSize ?? 80)))
    const request = pool.request().input('org', sql.UniqueIdentifier, org).input('offset', sql.Int, (page - 1) * pageSize).input('pageSize', sql.Int, pageSize)
    const where = applyFilters(request, query)
    const result = await request.query(`
      ${baseSelect}
      WHERE ${where}
      ORDER BY
        CASE i.severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END,
        CASE WHEN i.status IN ('Resolved','Closed') THEN 2 ELSE 1 END,
        i.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `)
    return result.recordset.map(mapIncident)
  },

  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`${baseSelect} WHERE i.id = @id`)
    if (!result.recordset[0]) throw new Error(`Incident not found: ${id}`)
    return mapIncident(result.recordset[0])
  },

  async summary() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT
        COUNT(CASE WHEN status NOT IN ('Resolved','Closed') THEN 1 END) AS active_incidents,
        COUNT(CASE WHEN severity = 'Critical' AND status NOT IN ('Resolved','Closed') THEN 1 END) AS critical_incidents,
        COUNT(CASE WHEN severity = 'High' AND status NOT IN ('Resolved','Closed') THEN 1 END) AS high_priority_incidents,
        COUNT(CASE WHEN status NOT IN ('Resolved','Closed') AND assigned_team_name IS NULL THEN 1 END) AS unassigned_incidents,
        AVG(CASE WHEN acknowledged_at IS NOT NULL THEN DATEDIFF(second, created_at, acknowledged_at) END) AS mt_ack_seconds,
        AVG(CASE WHEN resolved_at IS NOT NULL THEN DATEDIFF(minute, created_at, resolved_at) END) AS mt_resolve_minutes,
        COUNT(CASE WHEN CAST(resolved_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE) THEN 1 END) AS resolved_today,
        MAX(updated_at) AS last_updated
      FROM incidents
      WHERE organization_id = @org
    `)
    const sla = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT
        COUNT(CASE WHEN s.sla_status = 'Breached' THEN 1 END) AS breaches,
        COUNT(CASE WHEN s.sla_status = 'At Risk' THEN 1 END) AS at_risk,
        COUNT(*) AS tracked
      FROM incident_sla_tracking s
      JOIN incidents i ON i.id = s.incident_id
      WHERE i.organization_id = @org
    `)
    const row = result.recordset[0] ?? {}
    const slaRow = sla.recordset[0] ?? {}
    return {
      activeIncidents: Number(row.active_incidents ?? 0),
      criticalIncidents: Number(row.critical_incidents ?? 0),
      highPriorityIncidents: Number(row.high_priority_incidents ?? 0),
      unassignedIncidents: Number(row.unassigned_incidents ?? 0),
      meanTimeToAcknowledgeSeconds: Number(row.mt_ack_seconds ?? 0),
      meanTimeToResolveMinutes: Number(row.mt_resolve_minutes ?? 0),
      resolvedToday: Number(row.resolved_today ?? 0),
      slaBreaches: Number(slaRow.breaches ?? 0),
      slaAtRisk: Number(slaRow.at_risk ?? 0),
      trackedSla: Number(slaRow.tracked ?? 0),
      lastSynchronizedAt: iso(row.last_updated),
      monitoringStatus: 'live',
      organization: 'AI Media Group',
      environment: 'production',
      onCallTeam: 'Automation Platform On-Call',
      dataSource: 'database',
    }
  },

  async lifecycle() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      WITH stages AS (
        SELECT * FROM (VALUES
          (1,'Detected','Detected'), (2,'Created','Created'), (3,'Triaged','Triaged'), (4,'Assigned','Assigned'),
          (5,'Acknowledged','Acknowledged'), (6,'Investigating','Investigating'), (7,'Mitigating','Mitigating'),
          (8,'Monitoring','Monitoring'), (9,'Resolved','Resolved'), (10,'Postmortem','Postmortem'), (11,'Closed','Closed')
        ) AS x(stage_order, stage_name, status_name)
      )
      SELECT s.stage_order, s.stage_name,
        COUNT(i.id) AS incident_count,
        AVG(CASE WHEN i.id IS NOT NULL THEN DATEDIFF(minute, i.created_at, COALESCE(i.resolved_at, SYSUTCDATETIME())) END) AS average_duration_minutes,
        COUNT(CASE WHEN sla.sla_status = 'At Risk' THEN 1 END) AS sla_risk,
        COUNT(CASE WHEN i.assigned_team_name IS NULL AND i.id IS NOT NULL AND i.status NOT IN ('Resolved','Closed') THEN 1 END) AS blocked_incidents,
        STRING_AGG(CONVERT(NVARCHAR(MAX), COALESCE(i.assigned_team_name, 'Autonomous Assignment')), ', ') AS current_owners,
        CASE WHEN COUNT(i.id) = 0 THEN 0
             WHEN s.stage_name IN ('Resolved','Closed') THEN 100
             ELSE CAST((100.0 * COUNT(CASE WHEN i.acknowledged_at IS NOT NULL OR i.resolved_at IS NOT NULL THEN 1 END) / COUNT(i.id)) AS DECIMAL(8,2)) END AS completion_percentage
      FROM stages s
      LEFT JOIN incidents i ON i.organization_id = @org AND i.status = s.status_name
      LEFT JOIN incident_sla_tracking sla ON sla.incident_id = i.id
      GROUP BY s.stage_order, s.stage_name
      ORDER BY s.stage_order
    `)
    return result.recordset.map(camel)
  },

  async queues() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      WITH queues AS (
        SELECT 'Critical Queue' AS queue_name, 'severity' AS kind, 'Critical' AS value UNION ALL
        SELECT 'High-Priority Queue','severity','High' UNION ALL
        SELECT 'Unassigned Queue','assignment','Unassigned' UNION ALL
        SELECT 'SLA-Risk Queue','sla','At Risk' UNION ALL
        SELECT 'Customer-Impacting Queue','impact','Customer' UNION ALL
        SELECT 'Security Incident Queue','module','Security' UNION ALL
        SELECT 'AI Failure Queue','source','AI Orchestrator' UNION ALL
        SELECT 'Publishing Failure Queue','source','Publishing' UNION ALL
        SELECT 'Workflow Failure Queue','source','Workflow Engine' UNION ALL
        SELECT 'Integration Failure Queue','source','External integrations' UNION ALL
        SELECT 'Database Incident Queue','source','Database' UNION ALL
        SELECT 'Infrastructure Queue','team','Infrastructure'
      )
      SELECT q.queue_name,
        COUNT(i.id) AS incident_count,
        MIN(i.created_at) AS oldest_incident,
        AVG(CASE WHEN i.id IS NOT NULL THEN DATEDIFF(minute, i.created_at, SYSUTCDATETIME()) END) AS average_age_minutes,
        COUNT(DISTINCT i.assigned_team_name) AS assigned_responders,
        COUNT(CASE WHEN sla.sla_status IN ('At Risk','Breached') THEN 1 END) AS sla_risk,
        CASE WHEN COUNT(CASE WHEN i.severity = 'Critical' THEN 1 END) > 0 THEN 'critical'
             WHEN COUNT(CASE WHEN sla.sla_status IN ('At Risk','Breached') THEN 1 END) > 0 THEN 'at-risk'
             ELSE 'stable' END AS queue_health
      FROM queues q
      LEFT JOIN incidents i ON i.organization_id = @org AND i.status NOT IN ('Resolved','Closed') AND (
        (q.kind = 'severity' AND i.severity = q.value) OR
        (q.kind = 'assignment' AND i.assigned_team_name IS NULL) OR
        (q.kind = 'sla' AND EXISTS (SELECT 1 FROM incident_sla_tracking st WHERE st.incident_id = i.id AND st.sla_status = q.value)) OR
        (q.kind = 'impact' AND i.customer_impact IN ('Medium','High')) OR
        (q.kind = 'module' AND EXISTS (SELECT 1 FROM incident_modules m WHERE m.id = i.affected_module_id AND m.module_name = q.value)) OR
        (q.kind = 'source' AND i.source_type = q.value) OR
        (q.kind = 'team' AND i.assigned_team_name = q.value)
      )
      LEFT JOIN incident_sla_tracking sla ON sla.incident_id = i.id
      GROUP BY q.queue_name
      ORDER BY incident_count DESC, q.queue_name
    `)
    return result.recordset.map(camel)
  },

  async listSimple(table: 'incident_sources' | 'incident_services' | 'incident_responders' | 'incident_saved_views') {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${table} WHERE organization_id = @org ORDER BY created_at DESC`)
    return result.recordset.map(camel)
  },

  async timeline(incidentId?: string) {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = incidentId ? 'e.incident_id = @incidentId' : 'e.organization_id = @org'
    if (incidentId) request.input('incidentId', sql.UniqueIdentifier, incidentId)
    const result = await request.query(`
      SELECT TOP 40 e.*, i.incident_number, i.title AS incident_title, i.severity, i.status
      FROM incident_events e
      JOIN incidents i ON i.id = e.incident_id
      WHERE ${where}
      ORDER BY e.event_time DESC
    `)
    return result.recordset.map(camel)
  },

  async related(id: string) {
    const pool = await getConnectionPool()
    const maps = await Promise.all([
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_alert_links WHERE incident_id = @id'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_log_links WHERE incident_id = @id'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_trace_links WHERE incident_id = @id'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_workflow_links WHERE incident_id = @id'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_agent_run_links WHERE incident_id = @id'),
      pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM incident_job_links WHERE incident_id = @id'),
    ])
    const [alerts, logs, traces, workflows, agentRuns, jobs] = maps.map((result) => result.recordset.map(camel))
    return { alerts, logs, traces, workflows, agentRuns, jobs }
  },

  async incidentSection(id: string, table: 'incident_responders' | 'incident_communications' | 'incident_bridge_sessions' | 'incident_diagnostics' | 'incident_remediations' | 'incident_root_causes' | 'incident_postmortems' | 'incident_action_items') {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE incident_id = @id ORDER BY created_at DESC`)
    return result.recordset.map(camel)
  },

  async filters() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'severity' AS kind, severity AS value FROM incidents WHERE organization_id = @org GROUP BY severity
      UNION ALL SELECT 'priority', priority FROM incidents WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'status', status FROM incidents WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'source', source_type FROM incidents WHERE organization_id = @org GROUP BY source_type
      UNION ALL SELECT 'environment', environment FROM incidents WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'team', assigned_team_name FROM incidents WHERE organization_id = @org AND assigned_team_name IS NOT NULL GROUP BY assigned_team_name
      UNION ALL SELECT 'service', svc.service_name FROM incidents i JOIN incident_services svc ON svc.id = i.affected_service_id WHERE i.organization_id = @org GROUP BY svc.service_name
      UNION ALL SELECT 'module', mod.module_name FROM incidents i JOIN incident_modules mod ON mod.id = i.affected_module_id WHERE i.organization_id = @org GROUP BY mod.module_name
      UNION ALL SELECT 'slaStatus', sla.sla_status FROM incident_sla_tracking sla JOIN incidents i ON i.id = sla.incident_id WHERE i.organization_id = @org GROUP BY sla.sla_status
      UNION ALL SELECT 'customerImpact', customer_impact FROM incidents WHERE organization_id = @org GROUP BY customer_impact
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}
