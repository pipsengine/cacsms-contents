import { getConnectionPool, sql } from '@cacsms/database'
import type { LogEntry, LogQuery } from './types'

function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : null
}

function metadata(value: unknown) {
  if (!value) return null
  try {
    return JSON.parse(String(value)) as Record<string, unknown>
  } catch {
    return null
  }
}

function redact(value: string | null, sensitive: boolean, canViewSensitive: boolean) {
  if (!value) return null
  const redacted = value
    .replace(/(token|api[_-]?key|password|secret)=([^&\s]+)/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
  return sensitive && !canViewSensitive ? '[REDACTED]' : redacted
}

function mapEntry(row: Record<string, unknown>, canViewSensitive = false): LogEntry {
  const sensitive = Boolean(row.is_sensitive)
  return {
    id: String(row.id),
    timestamp: String(iso(row.timestamp)),
    level: String(row.level),
    sourceType: String(row.source_type),
    sourceName: String(row.source_name),
    serviceName: String(row.service_name),
    moduleName: row.module_name ? String(row.module_name) : null,
    environment: String(row.environment),
    message: redact(String(row.message), sensitive, canViewSensitive) ?? '',
    errorCode: row.error_code ? String(row.error_code) : null,
    exceptionType: row.exception_type ? String(row.exception_type) : null,
    stackTrace: redact(row.stack_trace ? String(row.stack_trace) : null, sensitive, canViewSensitive),
    requestId: row.request_id ? String(row.request_id) : null,
    traceId: row.trace_id ? String(row.trace_id) : null,
    spanId: row.span_id ? String(row.span_id) : null,
    correlationId: row.correlation_id ? String(row.correlation_id) : null,
    workflowInstanceId: row.workflow_instance_id ? String(row.workflow_instance_id) : null,
    workflowStageId: row.workflow_stage_id ? String(row.workflow_stage_id) : null,
    agentRunId: row.agent_run_id ? String(row.agent_run_id) : null,
    jobId: row.job_id ? String(row.job_id) : null,
    userId: sensitive && !canViewSensitive ? '[REDACTED]' : row.user_id ? String(row.user_id) : null,
    endpoint: row.endpoint ? String(row.endpoint) : null,
    httpMethod: row.http_method ? String(row.http_method) : null,
    statusCode: row.status_code === null || row.status_code === undefined ? null : Number(row.status_code),
    durationMs: row.duration_ms === null || row.duration_ms === undefined ? null : Number(row.duration_ms),
    region: row.region ? String(row.region) : null,
    host: row.host ? String(row.host) : null,
    ipAddress: sensitive && !canViewSensitive ? '[REDACTED]' : row.ip_address ? String(row.ip_address) : null,
    metadata: sensitive && !canViewSensitive ? { sensitive: '[REDACTED]' } : metadata(row.metadata_json),
    sensitiveHidden: sensitive && !canViewSensitive,
  }
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: LogQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(message LIKE @q OR service_name LIKE @q OR source_name LIKE @q OR error_code LIKE @q OR trace_id LIKE @q OR correlation_id LIKE @q OR request_id LIKE @q)')
  }
  if (query.level && query.level !== 'All') {
    request.input('level', sql.NVarChar, query.level)
    where.push('level = @level')
  }
  if (query.sourceType && query.sourceType !== 'All') {
    request.input('sourceType', sql.NVarChar, query.sourceType)
    where.push('source_type = @sourceType')
  }
  if (query.service && query.service !== 'All') {
    request.input('service', sql.NVarChar, query.service)
    where.push('service_name = @service')
  }
  if (query.module && query.module !== 'All') {
    request.input('module', sql.NVarChar, query.module)
    where.push('module_name = @module')
  }
  if (query.environment && query.environment !== 'All') {
    request.input('environment', sql.NVarChar, query.environment)
    where.push('environment = @environment')
  }
  for (const key of ['traceId', 'correlationId', 'requestId'] as const) {
    if (query[key]) {
      const column = key === 'traceId' ? 'trace_id' : key === 'correlationId' ? 'correlation_id' : 'request_id'
      request.input(key, sql.NVarChar, query[key])
      where.push(`${column} = @${key}`)
    }
  }
  return where.join(' AND ')
}

export const logsRepository = {
  async organizationId() {
    const pool = await getConnectionPool()
    const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
    const fallback = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
    if (!fallback) throw new Error('No organization row exists for logs.')
    return String(fallback.id)
  },

  async search(query: LogQuery = {}, canViewSensitive = false) {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const page = Math.max(1, Number(query.page ?? 1))
    const pageSize = Math.min(200, Math.max(10, Number(query.pageSize ?? 80)))
    const request = pool.request().input('org', sql.UniqueIdentifier, org).input('offset', sql.Int, (page - 1) * pageSize).input('pageSize', sql.Int, pageSize)
    const where = applyFilters(request, query)
    const result = await request.query(`
      SELECT * FROM log_entries
      WHERE ${where}
      ORDER BY timestamp DESC
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `)
    return result.recordset.map((row) => mapEntry(row, canViewSensitive))
  },

  async getLog(id: string, canViewSensitive = false) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM log_entries WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Log entry not found: ${id}`)
    return mapEntry(result.recordset[0], canViewSensitive)
  },

  async summary() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT
        COUNT(*) AS total_logs,
        SUM(CASE WHEN level IN ('Error') THEN 1 ELSE 0 END) AS errors,
        SUM(CASE WHEN level = 'Warning' THEN 1 ELSE 0 END) AS warnings,
        SUM(CASE WHEN level IN ('Critical','Fatal') THEN 1 ELSE 0 END) AS critical,
        COUNT(DISTINCT source_name) AS active_sources,
        AVG(COALESCE(duration_ms, 0)) AS avg_duration,
        COUNT(DISTINCT trace_id) AS traces,
        MAX(created_at) AS last_updated
      FROM log_entries
      WHERE organization_id = @org AND timestamp >= DATEADD(day, -1, SYSUTCDATETIME())
    `)
    const storage = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT COUNT(*) * 0.0027 AS storage_gb FROM log_entries WHERE organization_id = @org')
    const row = result.recordset[0] ?? {}
    return {
      totalLogsToday: Number(row.total_logs ?? 0),
      errors: Number(row.errors ?? 0),
      warnings: Number(row.warnings ?? 0),
      criticalEvents: Number(row.critical ?? 0),
      activeSources: Number(row.active_sources ?? 0),
      averageIngestionDelaySeconds: 1.4,
      correlatedTraces: Number(row.traces ?? 0),
      storageUsedGb: Number(Number(storage.recordset[0]?.storage_gb ?? 0).toFixed(2)),
      lastUpdated: iso(row.last_updated),
      currentDataSource: 'database',
      environment: 'production',
    }
  },

  async volumeTrend() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT TOP 48 bucket_start, total_logs, error_logs, warning_logs, critical_logs, avg_ingestion_delay_ms
      FROM log_ingestion_metrics
      WHERE organization_id = @org
      ORDER BY bucket_start ASC
    `)
    return result.recordset.map((row) => ({
      timestamp: iso(row.bucket_start),
      total: Number(row.total_logs),
      errors: Number(row.error_logs),
      warnings: Number(row.warning_logs),
      critical: Number(row.critical_logs),
      delayMs: Number(row.avg_ingestion_delay_ms),
    }))
  },

  async listSources() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM log_sources WHERE organization_id = @org AND is_deleted = 0 ORDER BY source_type, source_name')
    return result.recordset.map((row) => ({
      id: String(row.id),
      sourceType: String(row.source_type),
      sourceName: String(row.source_name),
      serviceName: String(row.service_name),
      moduleName: row.module_name ? String(row.module_name) : null,
      status: String(row.status),
      healthPercent: Number(row.health_percent),
      logsPerMinute: Number(row.logs_per_minute),
      ingestionDelayMs: Number(row.ingestion_delay_ms),
      droppedEvents: Number(row.dropped_events),
      parsingErrors: Number(row.parsing_errors),
      storageDestination: row.storage_destination ? String(row.storage_destination) : null,
      lastEventAt: iso(row.last_event_at),
    }))
  },

  async listErrorClusters() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT * FROM log_error_clusters WHERE organization_id = @org ORDER BY occurrence_count DESC')
    return result.recordset.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      errorCode: row.error_code ? String(row.error_code) : null,
      exceptionType: row.exception_type ? String(row.exception_type) : null,
      serviceName: row.service_name ? String(row.service_name) : null,
      moduleName: row.module_name ? String(row.module_name) : null,
      occurrenceCount: Number(row.occurrence_count),
      firstSeenAt: iso(row.first_seen_at),
      lastSeenAt: iso(row.last_seen_at),
      impact: row.impact ? String(row.impact) : null,
      trend: row.trend ? String(row.trend) : null,
      resolutionStatus: String(row.resolution_status),
      owner: row.owner ? String(row.owner) : null,
      rootCause: row.root_cause ? String(row.root_cause) : null,
    }))
  },

  async listSimple(table: 'log_saved_views' | 'log_alert_rules' | 'log_investigations' | 'log_retention_policies') {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${table} WHERE organization_id = @org ORDER BY created_at DESC`)
    return result.recordset.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])))
  },

  async filters() {
    const pool = await getConnectionPool()
    const org = await this.organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'level' AS kind, level AS value FROM log_entries WHERE organization_id = @org GROUP BY level
      UNION ALL SELECT 'sourceType', source_type FROM log_entries WHERE organization_id = @org GROUP BY source_type
      UNION ALL SELECT 'service', service_name FROM log_entries WHERE organization_id = @org GROUP BY service_name
      UNION ALL SELECT 'module', module_name FROM log_entries WHERE organization_id = @org AND module_name IS NOT NULL GROUP BY module_name
      UNION ALL SELECT 'environment', environment FROM log_entries WHERE organization_id = @org GROUP BY environment
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}
