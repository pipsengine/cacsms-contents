import { getConnectionPool, sql } from '@cacsms/database'

export type AutomationRulesQuery = {
  q?: string
  status?: string
  category?: string
  triggerType?: string
  environment?: string
  owner?: string
  organization?: string
  priority?: string
  executionMode?: string
  conflictStatus?: string
  recoveryEnabled?: string
  humanEscalationEnabled?: string
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value instanceof Date ? value.toISOString() : value])) as Record<string, unknown>
}

async function organizationId() {
  const pool = await getConnectionPool()
  const result = await pool.request().query("SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at")
  const row = result.recordset[0] ?? (await pool.request().query('SELECT TOP 1 id FROM organizations ORDER BY created_at')).recordset[0]
  if (!row) throw new Error('No organization row exists for automation rules.')
  return String(row.id)
}

function applyFilters(request: { input: (name: string, type: unknown, value: unknown) => unknown }, query: AutomationRulesQuery) {
  const where = ['organization_id = @org']
  if (query.q) {
    request.input('q', sql.NVarChar, `%${query.q}%`)
    where.push('(rule_code LIKE @q OR rule_name LIKE @q OR description LIKE @q OR category LIKE @q OR owner LIKE @q)')
  }
  ;[
    ['status', 'status'], ['category', 'category'], ['triggerType', 'trigger_type'], ['environment', 'environment'], ['owner', 'owner'],
    ['organization', 'organization'], ['priority', 'priority'], ['executionMode', 'execution_mode'], ['conflictStatus', 'conflict_status'],
  ].forEach(([key, column]) => {
    const value = query[key as keyof AutomationRulesQuery]
    if (value && value !== 'All') {
      request.input(key, sql.NVarChar, value)
      where.push(`${column} = @${key}`)
    }
  })
  if (query.recoveryEnabled && query.recoveryEnabled !== 'All') {
    request.input('recoveryEnabled', sql.Bit, query.recoveryEnabled === 'true' || query.recoveryEnabled === '1')
    where.push('recovery_enabled = @recoveryEnabled')
  }
  if (query.humanEscalationEnabled && query.humanEscalationEnabled !== 'All') {
    request.input('humanEscalationEnabled', sql.Bit, query.humanEscalationEnabled === 'true' || query.humanEscalationEnabled === '1')
    where.push('human_escalation_enabled = @humanEscalationEnabled')
  }
  return where.join(' AND ')
}

async function byOrgView(viewName: string, orderBy: string) {
  const pool = await getConnectionPool()
  const org = await organizationId()
  const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`SELECT * FROM ${viewName} WHERE organization_id = @org ORDER BY ${orderBy}`)
  return result.recordset.map(camel)
}

export const automationRulesRepository = {
  organizationId,
  async list(query: AutomationRulesQuery = {}) {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const request = pool.request().input('org', sql.UniqueIdentifier, org)
    const where = applyFilters(request, query)
    const result = await request.query(`SELECT * FROM vw_automation_rules_list WHERE ${where} ORDER BY CASE WHEN conflict_status = 'conflicted' THEN 0 WHEN status IN ('invalid','warning') THEN 1 ELSE 2 END, executions_today DESC`)
    return result.recordset.map(camel)
  },
  async summary() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT h.*,
        (SELECT COUNT(*) FROM automation_rule_executions e WHERE e.organization_id = @org AND e.status IN ('Executing','Evaluating','Recovering')) AS actions_in_progress,
        (SELECT COUNT(*) FROM automation_rule_executions e WHERE e.organization_id = @org AND e.status = 'Failed') AS failed_actions,
        (SELECT COUNT(*) FROM automation_rule_conflicts c WHERE c.organization_id = @org AND c.status = 'open') AS conflicts_detected,
        (SELECT COUNT(*) FROM automation_rule_executions e WHERE e.organization_id = @org AND e.recovery_used = 1 AND CAST(e.created_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE)) AS recoveries_in_progress,
        (SELECT TOP 1 COALESCE(d.outcome, d.selected_actions) FROM automation_rule_decisions d JOIN automation_rules r ON r.id = d.automation_rule_id WHERE r.organization_id = @org ORDER BY d.created_at DESC) AS last_autonomous_decision
      FROM vw_automation_rule_health h WHERE h.organization_id = @org
    `)
    return camel(result.recordset[0] ?? {})
  },
  async categories() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT category, COUNT(*) AS total_rules, COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_rules,
        SUM(executions_today) AS execution_count, AVG(success_rate) AS success_rate, SUM(failed_actions) AS failed_actions,
        SUM(recoveries) AS recoveries, COUNT(CASE WHEN conflict_status = 'conflicted' THEN 1 END) AS conflicts,
        MAX(last_execution) AS last_execution, AVG(CASE WHEN status = 'active' AND conflict_status = 'clear' THEN 96.0 WHEN status = 'warning' THEN 74.0 ELSE 62.0 END) AS health_percent
      FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY category ORDER BY category
    `)
    return result.recordset.map(camel)
  },
  async get(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT TOP 1 * FROM vw_automation_rules_list WHERE id = @id')
    if (!result.recordset[0]) throw new Error(`Automation rule not found: ${id}`)
    return camel(result.recordset[0])
  },
  versions(id: string) { return this.byRule(id, 'automation_rule_versions', 'created_at DESC') },
  executions(id: string) { return this.byRule(id, 'vw_automation_rule_executions', 'created_at DESC') },
  decisionTrace(id: string) { return this.byRule(id, 'automation_rule_decisions', 'created_at DESC') },
  validation(id: string) { return this.byRule(id, 'automation_rule_validation_runs', 'validated_at DESC') },
  simulations(id: string) { return this.byRule(id, 'automation_rule_simulation_runs', 'created_at DESC') },
  conflicts() { return byOrgView('vw_automation_rule_conflicts', 'risk_score DESC') },
  performance() { return byOrgView('vw_automation_rule_performance', 'execution_count_today DESC') },
  recommendations() { return byOrgView('vw_automation_rule_recommendations', 'created_at DESC') },
  finalOutputImpact() { return byOrgView('vw_automation_rule_final_output_impact', 'impact_score DESC') },
  async byRule(id: string, table: string, orderBy: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${table} WHERE automation_rule_id = @id ORDER BY ${orderBy}`)
    return result.recordset.map(camel)
  },
  async filters() {
    const pool = await getConnectionPool()
    const org = await organizationId()
    const result = await pool.request().input('org', sql.UniqueIdentifier, org).query(`
      SELECT 'status' AS kind, status AS value FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY status
      UNION ALL SELECT 'category', category FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY category
      UNION ALL SELECT 'triggerType', trigger_type FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY trigger_type
      UNION ALL SELECT 'environment', environment FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY environment
      UNION ALL SELECT 'owner', owner FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY owner
      UNION ALL SELECT 'organization', organization FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY organization
      UNION ALL SELECT 'priority', priority FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY priority
      UNION ALL SELECT 'executionMode', execution_mode FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY execution_mode
      UNION ALL SELECT 'conflictStatus', conflict_status FROM vw_automation_rules_list WHERE organization_id = @org GROUP BY conflict_status
      ORDER BY kind, value
    `)
    return result.recordset.reduce<Record<string, string[]>>((acc, row) => {
      const key = String(row.kind)
      acc[key] = [...(acc[key] ?? []), String(row.value)]
      return acc
    }, {})
  },
}

export const AutomationRuleRepository = automationRulesRepository
export const AutomationRuleVersionRepository = automationRulesRepository
export const AutomationRuleTriggerRepository = automationRulesRepository
export const AutomationRuleConditionRepository = automationRulesRepository
export const AutomationRuleActionRepository = automationRulesRepository
export const AutomationRuleExecutionRepository = automationRulesRepository
export const AutomationRuleDecisionRepository = automationRulesRepository
export const AutomationRuleConflictRepository = automationRulesRepository
export const AutomationRuleValidationRepository = automationRulesRepository
export const AutomationRuleSimulationRepository = automationRulesRepository
export const AutomationRuleMetricsRepository = automationRulesRepository
export const AutomationRuleRecommendationRepository = automationRulesRepository
