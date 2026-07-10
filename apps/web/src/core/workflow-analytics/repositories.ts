import { getConnectionPool, sql } from '@cacsms/database'

export type WorkflowAnalyticsQuery = { q?: string; category?: string; workflow?: string; owner?: string; slaStatus?: string; healthRange?: string; finalOutputRange?: string; dateRange?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for workflow analytics.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: WorkflowAnalyticsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_code LIKE @q OR workflow_name LIKE @q OR category LIKE @q OR owner LIKE @q)')
  }
  ;[['category', 'category'], ['workflow', 'workflow_code'], ['owner', 'owner']].forEach(([key, column]) => {
    const value = query[key as keyof WorkflowAnalyticsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.slaStatus === 'At Risk') where.push('sla_compliance < 95')
  if (query.slaStatus === 'Compliant') where.push('sla_compliance >= 95')
  if (query.finalOutputRange === 'At Risk') where.push('final_output_rate < 90')
  if (query.finalOutputRange === 'Healthy') where.push('final_output_rate >= 90')
  if (query.healthRange === 'At Risk') where.push('health_percent < 90')
  if (query.healthRange === 'Healthy') where.push('health_percent >= 90')
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const workflowAnalyticsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_workflow_analytics_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  performance(query: WorkflowAnalyticsQuery = {}) {
    return this.workflows(query)
  },
  async workflows(query: WorkflowAnalyticsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_workflow_performance WHERE ${where} ORDER BY CASE WHEN health_percent < 85 THEN 0 WHEN sla_compliance < 95 THEN 1 ELSE 2 END, executions DESC`)
    return result.recordset.map(camel)
  },
  async workflow(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT TOP 1 * FROM vw_workflow_performance WHERE workflow_definition_id=@id;
      SELECT * FROM workflow_stage_metrics WHERE workflow_definition_id=@id ORDER BY bottleneck_score DESC;
      SELECT * FROM workflow_agent_metrics WHERE workflow_definition_id=@id ORDER BY created_at DESC;
      SELECT * FROM workflow_approval_metrics WHERE workflow_definition_id=@id ORDER BY created_at DESC;
      SELECT * FROM workflow_recovery_metrics WHERE workflow_definition_id=@id ORDER BY created_at DESC;
      SELECT * FROM workflow_final_output_metrics WHERE workflow_definition_id=@id ORDER BY created_at DESC;
      SELECT * FROM workflow_cost_metrics WHERE workflow_definition_id=@id ORDER BY created_at DESC;
      SELECT * FROM workflow_optimization_recommendations WHERE workflow_definition_id=@id ORDER BY created_at DESC;
    `)
    const [overview, stages, agents, approvals, recovery, finalOutput, costs, recommendations] = result.recordsets as unknown as Array<Array<Record<string, unknown>>>
    return { overview: camel(overview[0] ?? {}), stages: stages.map(camel), agents: agents.map(camel), approvals: approvals.map(camel), recovery: recovery.map(camel), finalOutput: finalOutput.map(camel), costs: costs.map(camel), recommendations: recommendations.map(camel) }
  },
  categories() {
    return byOrgView('(SELECT organization_id, category, SUM(executions) AS executions, CAST(AVG(success_rate) AS DECIMAL(8,2)) AS success_rate, CAST(AVG(failure_rate) AS DECIMAL(8,2)) AS failure_rate, CAST(AVG(recovery_rate) AS DECIMAL(8,2)) AS recovery_rate, CAST(AVG(avg_duration_ms) AS INT) AS average_duration_ms, CAST(AVG(avg_cost) AS DECIMAL(18,4)) AS average_cost, CAST(AVG(sla_compliance) AS DECIMAL(8,2)) AS sla_compliance, CAST(AVG(final_output_rate) AS DECIMAL(8,2)) AS final_output_rate, CAST(AVG(human_intervention_rate) AS DECIMAL(8,2)) AS human_intervention_rate, CAST(AVG(efficiency_score) AS DECIMAL(8,2)) AS efficiency_score, CAST(AVG(health_percent) AS DECIMAL(8,2)) AS health_percent FROM vw_workflow_performance GROUP BY organization_id, category) c', 'health_percent ASC')
  },
  performanceTrend() { return byOrgView('workflow_analytics_hourly', 'metric_hour DESC') },
  bottlenecks() { return byOrgView('vw_workflow_bottlenecks', 'current_metric DESC') },
  duration() { return byOrgView('vw_workflow_duration_analytics', 'p95_duration_ms DESC') },
  reliability() { return byOrgView('vw_workflow_reliability_analytics', 'success_rate ASC') },
  cost() { return byOrgView('vw_workflow_cost_analytics', 'total_cost DESC') },
  autonomy() { return byOrgView('vw_workflow_autonomy_analytics', 'human_intervention_rate DESC') },
  sla() { return byOrgView('vw_workflow_sla_analytics', 'breached DESC, at_risk DESC') },
  finalOutput() { return byOrgView('vw_workflow_final_output_analytics', 'output_completion_rate ASC') },
  agents() { return byOrgView('vw_workflow_agent_analytics', 'success_rate ASC') },
  approvals() { return byOrgView('workflow_approval_metrics', 'decision_time_ms DESC') },
  queues() { return byOrgView('workflow_queue_metrics', 'congestion_risk DESC') },
  workers() { return byOrgView('workflow_worker_metrics', 'utilization DESC') },
  recovery() { return byOrgView('vw_workflow_recovery_analytics', 'recovery_duration_ms DESC') },
  predictions() { return byOrgView('vw_workflow_predictions', 'risk_score DESC') },
  recommendations() { return byOrgView('vw_workflow_optimization_recommendations', 'auto_apply_eligible DESC, confidence DESC') },
  businessImpact() { return byOrgView('vw_workflow_business_impact', 'created_at DESC') },
  decisions() { return byOrgView('workflow_optimization_actions', 'created_at DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category AS value FROM vw_workflow_performance WHERE organization_id=@org GROUP BY category
      UNION ALL SELECT 'workflow', workflow_code FROM vw_workflow_performance WHERE organization_id=@org GROUP BY workflow_code
      UNION ALL SELECT 'owner', owner FROM vw_workflow_performance WHERE organization_id=@org GROUP BY owner
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowPerformanceRepository = workflowAnalyticsRepository
export const WorkflowBottleneckRepository = workflowAnalyticsRepository
export const WorkflowDurationRepository = workflowAnalyticsRepository
export const WorkflowReliabilityRepository = workflowAnalyticsRepository
export const WorkflowCostRepository = workflowAnalyticsRepository
export const WorkflowAutonomyRepository = workflowAnalyticsRepository
export const WorkflowSlaAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowFinalOutputAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowAgentAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowQueueAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowWorkerAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowApprovalAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowRecoveryAnalyticsRepository = workflowAnalyticsRepository
export const WorkflowPredictionRepository = workflowAnalyticsRepository
export const WorkflowOptimizationRepository = workflowAnalyticsRepository
export const WorkflowBusinessImpactRepository = workflowAnalyticsRepository
