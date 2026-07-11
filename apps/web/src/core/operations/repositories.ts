import { getConnectionPool, sql } from '@cacsms/database'

export type Row = Record<string, unknown>

function camel(row: Row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      value instanceof Date ? value.toISOString() : value,
    ])
  ) as Row
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for Agent Operations Center.')
  return String(row.id)
}

async function query(sqlText: string, inputs: Record<string, unknown> = {}) {
  const pool = await getConnectionPool()
  const request = pool.request()
  Object.entries(inputs).forEach(([key, value]) => {
    request.input(key, key.toLowerCase().includes('id') ? sql.UniqueIdentifier : sql.NVarChar, value)
  })
  const result = await request.query(sqlText)
  return result.recordset.map(camel)
}

async function byOrg(sqlText: string) {
  return query(sqlText, { org: await organizationId() })
}

export const operationsRepository = {
  organizationId,

  async agentHealth() {
    return byOrg(`
      SELECT TOP 48
        a.id,
        a.code,
        a.name,
        a.domain,
        a.status,
        a.current_version,
        COALESCE(run_counts.running_runs, 0) AS running_runs,
        COALESCE(run_counts.total_runs, 0) AS total_runs,
        COALESCE(run_counts.avg_confidence, 0) AS avg_confidence,
        COALESCE(run_counts.avg_latency_ms, 0) AS avg_latency_ms,
        COALESCE(run_counts.total_cost, 0) AS total_cost,
        COALESCE(run_counts.queue_name, 'none') AS queue_name,
        COALESCE(run_counts.worker_id, 'none') AS worker_id
      FROM ai_agents a
      OUTER APPLY (
        SELECT
          SUM(CASE WHEN r.status IN ('Running','Planning','Waiting on Tool','Validating Output','Retrying','Recovering') THEN 1 ELSE 0 END) AS running_runs,
          COUNT(*) AS total_runs,
          AVG(CAST(r.confidence_score AS DECIMAL(8,2))) AS avg_confidence,
          AVG(CAST(r.latency_ms AS DECIMAL(18,2))) AS avg_latency_ms,
          SUM(CAST(r.actual_cost AS DECIMAL(18,4))) AS total_cost,
          MAX(r.queue_name) AS queue_name,
          MAX(r.worker_id) AS worker_id
        FROM ai_agent_runs r
        WHERE r.agent_id = a.id
      ) run_counts
      WHERE a.organization_id = @org
      ORDER BY running_runs DESC, a.domain, a.name
    `)
  },

  async workers() {
    return byOrg(`
      SELECT TOP 40
        COALESCE(worker_id, 'unassigned') AS worker_id,
        COALESCE(queue_name, 'ai-agent-runs') AS queue_name,
        COUNT(*) AS running_jobs,
        SUM(CASE WHEN status IN ('Running','Planning','Waiting on Tool','Validating Output') THEN 1 ELSE 0 END) AS active_jobs,
        SUM(CASE WHEN status IN ('Retrying','Recovering') THEN 1 ELSE 0 END) AS recovery_jobs,
        AVG(CAST(latency_ms AS DECIMAL(18,2))) AS latency_ms,
        AVG(CAST(confidence_score AS DECIMAL(8,2))) AS confidence_score,
        SUM(CAST(actual_cost AS DECIMAL(18,4))) AS cost,
        MAX(updated_at) AS last_seen_at
      FROM ai_agent_runs
      WHERE organization_id = @org
      GROUP BY COALESCE(worker_id, 'unassigned'), COALESCE(queue_name, 'ai-agent-runs')
      ORDER BY active_jobs DESC, running_jobs DESC
    `)
  },

  async queueFacts() {
    return byOrg(`
      SELECT
        q.id,
        q.name AS queue_name,
        q.status AS queue_status,
        q.health_percent,
        COUNT(j.id) AS jobs,
        SUM(CASE WHEN LOWER(j.status) IN ('queued','pending') THEN 1 ELSE 0 END) AS waiting,
        SUM(CASE WHEN LOWER(j.status) = 'running' THEN 1 ELSE 0 END) AS running,
        SUM(CASE WHEN LOWER(j.status) = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN LOWER(j.status) = 'completed' THEN 1 ELSE 0 END) AS completed,
        MAX(j.updated_at) AS last_job_at
      FROM job_queues q
      LEFT JOIN background_jobs j ON j.job_queue_id = q.id
      WHERE q.organization_id = @org
      GROUP BY q.id, q.name, q.status, q.health_percent
      ORDER BY waiting DESC, running DESC, q.name
    `)
  },

  async recentEvents() {
    return byOrg(`
      SELECT TOP 80
        id,
        event_type,
        source_name,
        severity,
        message,
        created_at
      FROM operations_events
      WHERE organization_id = @org
      ORDER BY created_at DESC
    `)
  },
}
