import { getConnectionPool, sql } from '@cacsms/database'

export type FailedWorkflowsQuery = { q?: string; status?: string; category?: string; severity?: string; workflow?: string; failedStage?: string; recoveryPolicy?: string; checkpoint?: string; outputPreserved?: string; worker?: string; queue?: string; provider?: string; model?: string; slaStatus?: string; publishingImpact?: string; finalOutputImpact?: string; incident?: string; organization?: string; brand?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for failed workflows.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: FailedWorkflowsQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(workflow_name LIKE @q OR reference_id LIKE @q OR failure_code LIKE @q OR failed_stage LIKE @q OR brand LIKE @q)')
  }
  ;[
    ['status', 'status'], ['category', 'failure_category'], ['severity', 'severity'], ['workflow', 'workflow_name'], ['failedStage', 'failed_stage'],
    ['recoveryPolicy', 'recovery_policy'], ['worker', 'assigned_worker_id'], ['queue', 'queue_name'], ['provider', 'provider_id'], ['model', 'model_id'],
    ['slaStatus', 'sla_status'], ['publishingImpact', 'publishing_impact'], ['finalOutputImpact', 'final_output_impact'], ['incident', 'incident'],
    ['organization', 'organization'], ['brand', 'brand'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof FailedWorkflowsQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.checkpoint && query.checkpoint !== 'All') {
    request.input('checkpoint', sql.Bit, query.checkpoint === 'true' || query.checkpoint === '1' || query.checkpoint === 'Yes')
    where.push('checkpoint_available = @checkpoint')
  }
  if (query.outputPreserved && query.outputPreserved !== 'All') {
    request.input('outputPreserved', sql.Bit, query.outputPreserved === 'true' || query.outputPreserved === '1' || query.outputPreserved === 'Yes')
    where.push('output_preserved = @outputPreserved')
  }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const failedWorkflowsRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM vw_failed_workflows f WHERE f.organization_id=@org AND f.status='Diagnosing') AS failures_under_diagnosis,
        (SELECT TOP 1 failure_category FROM vw_failed_workflows f WHERE f.organization_id=@org GROUP BY failure_category ORDER BY COUNT(*) DESC) AS dominant_failure_type,
        COALESCE((SELECT TOP 1 queue_name FROM vw_failed_workflows f WHERE f.organization_id=@org GROUP BY queue_name ORDER BY COUNT(*) DESC), 'none detected') AS current_bottleneck,
        (SELECT TOP 1 decision FROM workflow_recovery_decisions d JOIN workflow_failures f ON f.id=d.workflow_failure_id WHERE f.organization_id=@org ORDER BY d.created_at DESC) AS last_autonomous_recovery
      FROM vw_failure_control_summary s WHERE s.organization_id=@org
    `)
    return camel(result.recordset[0] ?? {})
  },
  categories() { return byOrgView('vw_failure_categories', 'failure_count DESC') },
  async list(query: FailedWorkflowsQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_failed_workflows WHERE ${where} ORDER BY CASE WHEN status IN ('Escalated','Unrecoverable') THEN 0 WHEN status IN ('Recovering','Retrying','Compensating') THEN 1 ELSE 2 END, detected_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_failed_workflows WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Failed workflow not found: ${id}`)
    return camel(result.recordset[0])
  },
  async byFailure(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE workflow_failure_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  diagnosis(id: string) { return this.byFailure(id, 'workflow_failure_diagnoses', 'created_at DESC') },
  rootCause(id: string) { return this.byFailure(id, 'workflow_failure_root_causes', 'created_at DESC') },
  recovery(id: string) { return this.byFailure(id, 'workflow_recovery_attempts', 'created_at DESC') },
  checkpoints(id: string) { return this.byFailure(id, 'workflow_recovery_checkpoints', 'created_at DESC') },
  outputs(id: string) { return this.byFailure(id, 'workflow_recovery_outputs', 'created_at DESC') },
  timeline(id: string) { return this.byFailure(id, 'workflow_recovery_decisions', 'created_at DESC') },
  repeatedPatterns() { return byOrgView('vw_repeated_failure_patterns', 'last_seen_at DESC') },
  recoveryPolicies() { return byOrgView('workflow_recovery_policies', 'policy_name') },
  recoveries() { return byOrgView('vw_failure_recoveries', 'created_at DESC') },
  incidents() { return byOrgView('vw_failure_incident_escalations', 'created_at DESC') },
  rootCauses() { return byOrgView('vw_failure_root_causes', 'created_at DESC') },
  checkpointsAll() { return byOrgView('vw_failure_checkpoints', 'created_at DESC') },
  outputsAll() { return byOrgView('vw_failure_output_preservation', 'created_at DESC') },
  finalOutputProtection() { return byOrgView('vw_failure_final_output_protection', 'readiness_percent') },
  decisions() { return byOrgView('workflow_recovery_decisions d JOIN workflow_failures f ON f.id = d.workflow_failure_id', 'd.created_at DESC') },
  learning() { return byOrgView('workflow_failure_learning', 'created_at DESC') },
  compensations() { return byOrgView('workflow_recovery_compensations c JOIN workflow_failures f ON f.id = c.workflow_failure_id', 'c.created_at DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_failed_workflows WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'category', failure_category FROM vw_failed_workflows WHERE organization_id=@org GROUP BY failure_category
      UNION ALL SELECT 'severity', severity FROM vw_failed_workflows WHERE organization_id=@org GROUP BY severity
      UNION ALL SELECT 'workflow', workflow_name FROM vw_failed_workflows WHERE organization_id=@org GROUP BY workflow_name
      UNION ALL SELECT 'failedStage', failed_stage FROM vw_failed_workflows WHERE organization_id=@org GROUP BY failed_stage
      UNION ALL SELECT 'recoveryPolicy', recovery_policy FROM vw_failed_workflows WHERE organization_id=@org GROUP BY recovery_policy
      UNION ALL SELECT 'queue', queue_name FROM vw_failed_workflows WHERE organization_id=@org GROUP BY queue_name
      UNION ALL SELECT 'provider', provider_id FROM vw_failed_workflows WHERE organization_id=@org GROUP BY provider_id
      UNION ALL SELECT 'model', model_id FROM vw_failed_workflows WHERE organization_id=@org GROUP BY model_id
      UNION ALL SELECT 'slaStatus', sla_status FROM vw_failed_workflows WHERE organization_id=@org GROUP BY sla_status
      UNION ALL SELECT 'publishingImpact', publishing_impact FROM vw_failed_workflows WHERE organization_id=@org GROUP BY publishing_impact
      UNION ALL SELECT 'finalOutputImpact', final_output_impact FROM vw_failed_workflows WHERE organization_id=@org GROUP BY final_output_impact
      UNION ALL SELECT 'brand', brand FROM vw_failed_workflows WHERE organization_id=@org GROUP BY brand
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const WorkflowFailureRepository = failedWorkflowsRepository
export const FailureContextRepository = failedWorkflowsRepository
export const FailureEvidenceRepository = failedWorkflowsRepository
export const FailureDiagnosisRepository = failedWorkflowsRepository
export const FailureRootCauseRepository = failedWorkflowsRepository
export const RecoveryPolicyRepository = failedWorkflowsRepository
export const RecoveryAttemptRepository = failedWorkflowsRepository
export const RecoveryCheckpointRepository = failedWorkflowsRepository
export const RecoveryOutputRepository = failedWorkflowsRepository
export const RecoveryCompensationRepository = failedWorkflowsRepository
export const RecoveryEscalationRepository = failedWorkflowsRepository
export const FailurePatternRepository = failedWorkflowsRepository
export const FailureLearningRepository = failedWorkflowsRepository
export const FailureMetricsRepository = failedWorkflowsRepository
export const FailureFinalOutputRepository = failedWorkflowsRepository
