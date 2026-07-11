import { getConnectionPool, sql } from '@cacsms/database'

export type RecoveryPoliciesQuery = { q?: string; category?: string; status?: string; failureScope?: string; primaryStrategy?: string; fallbackStrategy?: string; owner?: string; environment?: string; finalOutputProtection?: string; humanEscalation?: string }

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for recovery policies.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: RecoveryPoliciesQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(policy_code LIKE @q OR policy_name LIKE @q OR description LIKE @q OR category_name LIKE @q OR primary_strategy LIKE @q OR fallback_strategy LIKE @q)')
  }
  ;[['category', 'category_name'], ['status', 'status'], ['failureScope', 'failure_scope'], ['primaryStrategy', 'primary_strategy'], ['fallbackStrategy', 'fallback_strategy'], ['owner', 'owner_id'], ['environment', 'environment']].forEach(([key, column]) => {
    const value = query[key as keyof RecoveryPoliciesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.finalOutputProtection === 'At Risk') where.push('final_output_protection_rate < 95')
  if (query.finalOutputProtection === 'Protected') where.push('final_output_protection_rate >= 95')
  if (query.humanEscalation && query.humanEscalation !== 'All') {
    request.input('humanEscalation', sql.Bit, query.humanEscalation === 'true' || query.humanEscalation === 'Yes')
    where.push('human_escalation_enabled = @humanEscalation')
  }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id=@org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const recoveryPoliciesRepository = {
  organizationId,
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query('SELECT TOP 1 * FROM vw_recovery_policy_summary WHERE organization_id=@org')
    return camel(result.recordset[0] ?? {})
  },
  categories() { return byOrgView('vw_recovery_policy_health', 'health_percent ASC') },
  async list(query: RecoveryPoliciesQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_recovery_policies_list WHERE ${where} ORDER BY CASE WHEN status IN ('Invalid','Conflicted','Warning') THEN 0 ELSE 1 END, priority DESC, updated_at DESC`)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_recovery_policies_list WHERE id=@id')
    if (!result.recordset[0]) throw new Error(`Recovery policy not found: ${id}`)
    return camel(result.recordset[0])
  },
  async byPolicy(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE recovery_policy_id=@id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  versions(id: string) { return this.byPolicy(id, 'recovery_policy_versions', 'version_number DESC') },
  validation(id: string) { return this.byPolicy(id, 'recovery_policy_validations', 'created_at DESC') },
  simulations(id: string) { return this.byPolicy(id, 'recovery_policy_simulations', 'created_at DESC') },
  executions(id: string) { return this.byPolicy(id, 'recovery_policy_executions', 'created_at DESC') },
  async decisionTrace(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT s.* FROM recovery_policy_execution_steps s JOIN recovery_policy_executions e ON e.id=s.recovery_policy_execution_id WHERE e.recovery_policy_id=@id ORDER BY s.created_at DESC, s.step_order')
    return result.recordset.map(camel)
  },
  conflicts() { return byOrgView('vw_recovery_policy_conflicts', 'created_at DESC') },
  coverage() { return byOrgView('vw_recovery_policy_coverage', 'coverage_row') },
  performance() { return byOrgView('vw_recovery_policy_performance', 'success_rate ASC') },
  recommendations() { return byOrgView('vw_recovery_policy_recommendations', 'auto_apply_eligible DESC, confidence DESC') },
  finalOutputProtection() { return byOrgView('vw_recovery_policy_final_output_protection', 'protection_status, degradation_risk DESC') },
  decisions() { return byOrgView('recovery_policy_decisions', 'created_at DESC') },
  governance() { return byOrgView('recovery_policy_governance_approvals g JOIN recovery_policies p ON p.id=g.recovery_policy_id', 'g.created_at DESC') },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'category' AS kind, category_name AS value FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY category_name
      UNION ALL SELECT 'status', status FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY status
      UNION ALL SELECT 'failureScope', failure_scope FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY failure_scope
      UNION ALL SELECT 'primaryStrategy', primary_strategy FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY primary_strategy
      UNION ALL SELECT 'fallbackStrategy', fallback_strategy FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY fallback_strategy
      UNION ALL SELECT 'owner', owner_id FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY owner_id
      UNION ALL SELECT 'environment', environment FROM vw_recovery_policies_list WHERE organization_id=@org GROUP BY environment
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const RecoveryPolicyRepository = recoveryPoliciesRepository
export const RecoveryPolicyVersionRepository = recoveryPoliciesRepository
export const RecoveryPolicyScopeRepository = recoveryPoliciesRepository
export const RecoveryPolicyEvidenceRepository = recoveryPoliciesRepository
export const RecoveryPolicyStrategyRepository = recoveryPoliciesRepository
export const RecoveryPolicyGuardrailRepository = recoveryPoliciesRepository
export const RecoveryPolicyCheckpointRepository = recoveryPoliciesRepository
export const RecoveryPolicyCompensationRepository = recoveryPoliciesRepository
export const RecoveryPolicyEscalationRepository = recoveryPoliciesRepository
export const RecoveryPolicyValidationRepository = recoveryPoliciesRepository
export const RecoveryPolicySimulationRepository = recoveryPoliciesRepository
export const RecoveryPolicyExecutionRepository = recoveryPoliciesRepository
export const RecoveryPolicyDecisionRepository = recoveryPoliciesRepository
export const RecoveryPolicyConflictRepository = recoveryPoliciesRepository
export const RecoveryPolicyCoverageRepository = recoveryPoliciesRepository
export const RecoveryPolicyMetricsRepository = recoveryPoliciesRepository
export const RecoveryPolicyRecommendationRepository = recoveryPoliciesRepository
export const RecoveryPolicyGovernanceRepository = recoveryPoliciesRepository
export const RecoveryPolicyFinalOutputRepository = recoveryPoliciesRepository

