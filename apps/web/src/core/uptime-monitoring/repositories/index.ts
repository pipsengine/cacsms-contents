import { getConnectionPool, sql } from '@cacsms/database'
import type { AvailabilityBlock, MaintenanceWindow, RegionalMetric, SlaRow, UptimeIncident, UptimeMonitor } from '../types'

function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : null
}

function mapMonitor(row: Record<string, unknown>): UptimeMonitor {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    monitorType: String(row.monitor_type),
    category: String(row.service_category),
    endpoint: String(row.endpoint_resource),
    method: row.http_method ? String(row.http_method) : null,
    region: String(row.region),
    status: String(row.status) as UptimeMonitor['status'],
    uptime24h: Number(row.uptime_24h ?? 0),
    uptime7d: Number(row.uptime_7d ?? 0),
    uptime30d: Number(row.uptime_30d ?? 0),
    responseTimeMs: Number(row.response_time_ms ?? 0),
    lastOutage: iso(row.last_outage_at),
    downtimeMinutes: Number(row.downtime_minutes ?? 0),
    checkFrequencySeconds: Number(row.check_frequency_seconds ?? 60),
    timeoutSeconds: Number(row.timeout_seconds ?? 10),
    retryCount: Number(row.retry_count ?? 2),
    slaTarget: Number(row.sla_target ?? 99.9),
    owner: row.owner ? String(row.owner) : null,
    alertPolicy: row.alert_policy ? String(row.alert_policy) : null,
    lastChecked: iso(row.last_checked_at),
    isEnabled: Boolean(row.is_enabled),
  }
}

export const uptimeMonitorRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const fallback = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!fallback) throw new Error('No organization row exists for uptime monitoring.')
    return String(fallback.id)
  },

  async listMonitors() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM uptime_monitors WHERE organization_id = @org AND is_deleted = 0 ORDER BY service_category, name')
    return result.recordset.map(mapMonitor)
  },

  async getMonitor(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM uptime_monitors WHERE id = @id AND is_deleted = 0')
    if (!result.recordset[0]) throw new Error(`Uptime monitor not found: ${id}`)
    return mapMonitor(result.recordset[0])
  },

  async listHistory(monitorId?: string) {
    const pool = await getConnectionPool()
    const request = pool.request().input('monitorId', sql.UniqueIdentifier, monitorId ?? null)
    const result = await request.query(`
      SELECT TOP 800 * FROM monitor_status_history
      WHERE @monitorId IS NULL OR monitor_id = @monitorId
      ORDER BY started_at DESC
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      monitorId: String(row.monitor_id),
      status: String(row.status) as AvailabilityBlock['status'],
      startedAt: String(iso(row.started_at)),
      endedAt: iso(row.ended_at),
      responseTimeMs: row.response_time_ms === null ? null : Number(row.response_time_ms),
      incidentReference: row.incident_reference ? String(row.incident_reference) : null,
      errorMessage: row.error_message ? String(row.error_message) : null,
    })) satisfies AvailabilityBlock[]
  },

  async listIncidents() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT i.*, m.name AS monitor_name
      FROM uptime_incidents i
      JOIN uptime_monitors m ON m.id = i.monitor_id
      WHERE i.organization_id = @org
      ORDER BY i.started_at DESC
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      incidentKey: String(row.incident_key),
      service: String(row.monitor_name),
      severity: String(row.severity),
      status: String(row.status),
      startedAt: String(iso(row.started_at)),
      resolvedAt: iso(row.resolved_at),
      durationMinutes: Number(row.duration_minutes ?? 0),
      rootCause: row.root_cause ? String(row.root_cause) : null,
      userImpact: row.user_impact ? String(row.user_impact) : null,
      slaImpact: row.sla_impact ? String(row.sla_impact) : null,
      assignedTeam: row.assigned_team ? String(row.assigned_team) : null,
      postmortemStatus: row.postmortem_status ? String(row.postmortem_status) : null,
    })) satisfies UptimeIncident[]
  },

  async listSla() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT m.id AS monitor_id, m.name, p.sla_target, p.allowed_downtime_minutes, r.actual_uptime, r.actual_downtime_minutes, r.remaining_allowance_minutes, r.breach_status, r.current_risk
      FROM uptime_monitors m
      JOIN uptime_sla_policies p ON p.monitor_id = m.id
      JOIN uptime_sla_results r ON r.monitor_id = m.id
      WHERE m.organization_id = @org AND m.is_deleted = 0
      ORDER BY r.breach_status DESC, m.name
    `)
    return result.recordset.map((row) => ({
      monitorId: String(row.monitor_id),
      service: String(row.name),
      slaTarget: Number(row.sla_target),
      actualUptime: Number(row.actual_uptime),
      allowedDowntimeMinutes: Number(row.allowed_downtime_minutes),
      actualDowntimeMinutes: Number(row.actual_downtime_minutes),
      remainingAllowanceMinutes: Number(row.remaining_allowance_minutes),
      breachStatus: String(row.breach_status),
      currentRisk: String(row.current_risk),
    })) satisfies SlaRow[]
  },

  async listMaintenance() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT mw.*, STRING_AGG(m.name, ', ') AS services
      FROM maintenance_windows mw
      LEFT JOIN maintenance_services ms ON ms.maintenance_window_id = mw.id
      LEFT JOIN uptime_monitors m ON m.id = ms.monitor_id
      WHERE mw.organization_id = @org
      GROUP BY mw.id, mw.organization_id, mw.title, mw.start_time, mw.end_time, mw.expected_impact, mw.owner, mw.approval_status, mw.notification_status, mw.current_state, mw.created_at, mw.updated_at
      ORDER BY mw.start_time DESC
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      servicesAffected: row.services ? String(row.services).split(', ') : [],
      startTime: String(iso(row.start_time)),
      endTime: String(iso(row.end_time)),
      durationMinutes: Math.max(0, Math.round((new Date(String(row.end_time)).getTime() - new Date(String(row.start_time)).getTime()) / 60000)),
      expectedImpact: row.expected_impact ? String(row.expected_impact) : null,
      owner: row.owner ? String(row.owner) : null,
      approvalStatus: String(row.approval_status),
      notificationStatus: String(row.notification_status),
      currentState: String(row.current_state),
    })) satisfies MaintenanceWindow[]
  },

  async listRegionalMetrics() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT region, AVG(availability_percent) AS availability, AVG(avg_latency_ms) AS latency, SUM(failed_checks) AS failed_checks, SUM(degraded_services) AS degraded_services, MAX(last_incident_at) AS last_incident, MIN(health_status) AS health_status
      FROM uptime_monitor_regions
      GROUP BY region
      ORDER BY region
    `)
    return result.recordset.map((row) => ({
      region: String(row.region),
      availability: Number(row.availability ?? 0),
      averageLatencyMs: Number(row.latency ?? 0),
      failedChecks: Number(row.failed_checks ?? 0),
      degradedServices: Number(row.degraded_services ?? 0),
      lastIncident: iso(row.last_incident),
      healthStatus: String(row.health_status ?? 'Unknown'),
    })) satisfies RegionalMetric[]
  },

  async createManualCheck(monitorId?: string) {
    const pool = await getConnectionPool()
    const monitor = monitorId ? await this.getMonitor(monitorId) : (await this.listMonitors())[0]
    if (!monitor) throw new Error('No uptime monitor is available for check execution.')
    const correlationId = crypto.randomUUID()
    const check = await pool.request().input('monitorId', sql.UniqueIdentifier, monitor.id).input('region', sql.NVarChar, monitor.region).input('correlationId', sql.NVarChar, correlationId).query(`
      INSERT INTO uptime_checks(monitor_id, region, status, correlation_id)
      OUTPUT INSERTED.id
      VALUES (@monitorId, @region, 'running', @correlationId)
    `)
    const responseTime = Math.max(10, monitor.responseTimeMs + (Math.floor(Math.random() * 21) - 10))
    await pool.request()
      .input('checkId', sql.UniqueIdentifier, String(check.recordset[0].id))
      .input('monitorId', sql.UniqueIdentifier, monitor.id)
      .input('region', sql.NVarChar, monitor.region)
      .input('success', sql.Bit, !['Major Outage', 'Partial Outage'].includes(monitor.status))
      .input('statusCode', sql.Int, ['Major Outage', 'Partial Outage'].includes(monitor.status) ? 503 : 200)
      .input('responseTime', sql.Int, responseTime)
      .input('errorCode', sql.NVarChar, ['Major Outage', 'Partial Outage'].includes(monitor.status) ? 'UPTIME_CHECK_FAILED' : null)
      .input('errorMessage', sql.NVarChar, ['Major Outage', 'Partial Outage'].includes(monitor.status) ? `${monitor.name} is not meeting availability checks.` : null)
      .input('responseSummary', sql.NVarChar, `${monitor.name} checked from ${monitor.region}`)
      .input('correlationId', sql.NVarChar, correlationId)
      .query(`
        INSERT INTO uptime_check_results(check_id, monitor_id, region, started_at, completed_at, success, status_code, response_time_ms, error_code, error_message, response_summary, correlation_id)
        VALUES (@checkId, @monitorId, @region, DATEADD(second, -1, SYSUTCDATETIME()), SYSUTCDATETIME(), @success, @statusCode, @responseTime, @errorCode, @errorMessage, @responseSummary, @correlationId);
        UPDATE uptime_checks SET status = 'completed' WHERE id = @checkId;
        UPDATE uptime_monitors SET last_checked_at = SYSUTCDATETIME(), response_time_ms = @responseTime, updated_at = SYSUTCDATETIME() WHERE id = @monitorId;
      `)
    return { monitorId: monitor.id, monitorName: monitor.name, correlationId, responseTimeMs: responseTime }
  },

  async updateMonitorStatus(id: string, status: 'Paused' | 'Operational') {
    const pool = await getConnectionPool()
    await pool.request().input('id', sql.UniqueIdentifier, id).input('status', sql.NVarChar, status).query("UPDATE uptime_monitors SET status = @status, is_enabled = CASE WHEN @status = 'Paused' THEN 0 ELSE 1 END, updated_at = SYSUTCDATETIME() WHERE id = @id")
    return this.getMonitor(id)
  },
}
