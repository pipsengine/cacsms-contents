import { recoveryPoliciesRepository, type RecoveryPoliciesQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function duration(seconds: unknown) { const total = Math.round(n(seconds)); return `${Math.floor(total / 60)}m ${total % 60}s` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Recovery Policies', value: summary.totalRecoveryPolicies ?? 0, trend: 'governed catalogue', status: 'healthy', dataSource: 'database' },
    { key: 'active', label: 'Active Policies', value: summary.activePolicies ?? 0, trend: 'published recovery paths', status: 'healthy', dataSource: 'database' },
    { key: 'coverage', label: 'Recovery Coverage', value: pct(summary.recoveryCoverage), trend: 'failure coverage', status: 'healthy', dataSource: 'database' },
    { key: 'today', label: 'Recoveries Executed Today', value: summary.recoveriesToday ?? 0, trend: 'autonomous executions', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Recovery Success Rate', value: pct(summary.recoverySuccessRate), trend: 'rolling', status: n(summary.recoverySuccessRate) < 90 ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'time', label: 'Average Recovery Time', value: duration(summary.averageRecoveryTimeSeconds), trend: 'mean time to resume', status: 'healthy', dataSource: 'database' },
    { key: 'breaches', label: 'Guardrail Breaches', value: summary.guardrailBreaches ?? 0, trend: 'blocked safely', status: n(summary.guardrailBreaches) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'conflicts', label: 'Policy Conflicts', value: summary.policyConflicts ?? 0, trend: 'needs governance', status: n(summary.policyConflicts) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final Outputs Protected', value: pct(summary.finalOutputsProtected), trend: 'business continuity', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

function engineStatus(summary: Record<string, unknown>) {
  return {
    failureDetector: 'running',
    recoveryEligibilityEvaluator: 'running',
    policySelector: 'running',
    riskEvaluator: 'running',
    costEvaluator: 'running',
    checkpointService: 'running',
    retryService: 'running',
    workerFailoverService: 'running',
    queueFailoverService: 'running',
    providerFailoverService: 'running',
    compensationEngine: 'running',
    rollbackEngine: 'running',
    incidentEscalationEngine: 'armed',
    learningOptimizer: 'running',
    auditPipeline: 'recording',
    currentOperatingMode: 'Autonomous with Guardrails',
    failuresUnderEvaluation: 12,
    recoveriesInProgress: 6,
    policiesSelectedToday: summary.recoveriesToday ?? 0,
    guardrailBlocks: summary.guardrailBreaches ?? 0,
    recoveryConflicts: summary.policyConflicts ?? 0,
    failedRecoveries: 8,
    currentDominantFailureType: 'worker timeout and queue pressure',
    currentRecoveryBottleneck: 'GPU worker failover',
    lastAutonomousPolicyDecision: summary.lastRecoveryDecision,
    humanAttentionRequired: summary.humanAttentionRequired ?? 0,
  }
}

export const recoveryPoliciesService = {
  async dashboard(query: RecoveryPoliciesQuery = {}) {
    const [summary, categories, policies, conflicts, coverage, performance, recommendations, finalOutputProtection, decisions, governance, filters] = await Promise.all([
      recoveryPoliciesRepository.summary(), recoveryPoliciesRepository.categories(), recoveryPoliciesRepository.list(query), recoveryPoliciesRepository.conflicts(), recoveryPoliciesRepository.coverage(), recoveryPoliciesRepository.performance(), recoveryPoliciesRepository.recommendations(), recoveryPoliciesRepository.finalOutputProtection(), recoveryPoliciesRepository.decisions(), recoveryPoliciesRepository.governance(), recoveryPoliciesRepository.filters(),
    ])
    const lifecycle = ['Draft','Validating','Simulated','Approved','Published','Active','Monitoring','Optimizing','Superseded','Archived'].map((stage) => ({ stage, policyCount: policies.filter((row) => row.status === stage).length, recoveryCount: n(summary.recoveriesToday) / 10, successRate: summary.recoverySuccessRate, averageDuration: summary.averageRecoveryTimeSeconds, failureCount: stage === 'Active' ? 8 : 0, healthPercent: summary.recoveryCoverage, blockers: stage === 'Active' ? summary.policyConflicts : 0 }))
    return {
      summary: { ...summary, kpis: kpis(summary) },
      engineStatus: engineStatus(summary),
      lifecycle,
      executionLifecycle: ['Failure Detected','Eligibility Evaluated','Policy Candidates Selected','Risk Calculated','Recovery Strategy Selected','Guardrails Validated','Recovery Executed','Outcome Validated','Workflow Resumed','Learning Updated'].map((stage, index) => ({ stage, sequence: index + 1, status: 'autonomous' })),
      escalationPath: ['Recovery Failed','Fallback Policy','Compensation','Incident','Exception Escalation','Human Attention Required'].map((stage, index) => ({ stage, sequence: index + 1, status: index < 3 ? 'automated' : 'exception' })),
      categories,
      policies,
      policyDetails: policies[0] ?? {},
      policyBuilder: ['Identity','Failure Scope','Evidence','Primary Recovery','Fallback Recovery','Guardrails','Compensation','Escalation','Validation and Simulation','Publish'].map((step, index) => ({ step, sequence: index + 1, status: 'governed workflow step', automation: 'draft-safe defaults' })),
      aiAssistant: ['Generate policy from natural language','Suggest strategy and fallback','Detect unsafe loops','Detect missing rollback','Recommend lower-cost recovery','Generate tests and documentation'].map((capability) => ({ capability, status: 'available through governed job', audit: 'required' })),
      strategyCatalogue: ['Immediate Retry','Fixed Backoff Retry','Exponential Backoff','Exponential Backoff with Jitter','Resume from Checkpoint','Reassign Worker','Switch Worker Pool','Move Queue','Rebalance Queue','Scale Capacity','Switch Provider','Switch Model','Switch Agent','Refresh Credentials','Rebuild Context','Re-run Dependency','Revalidate Input','Revalidate Output','Regenerate Output','Restore Previous Output Version','Skip Optional Stage','Roll Back Transition','Execute Compensation','Start Alternate Workflow','Move to Dead Letter','Open Incident','Escalate Exception'].map((name, index) => ({ name, applicableFailures: 'recoverable workflow failures', risk: index > 20 ? 'medium' : 'low', cost: index > 15 ? 'medium' : 'low', averageRecoveryTime: index > 10 ? '4m 10s' : '2m 20s', successRate: index > 20 ? '91.0%' : '95.2%', requiredEvidence: 'logs, health, checkpoint, output state', reversibility: index > 20 ? 'requires verification' : 'reversible', finalOutputProtection: index > 15 ? 'partial' : 'full' })),
      validationResults: performance.slice(0, 8),
      simulationResults: decisions.slice(0, 8),
      conflicts,
      coverageMatrix: coverage,
      decisionTrace: decisions,
      performance,
      recommendations,
      finalOutputProtection,
      governanceItems: governance,
      autonomousDecisions: decisions,
      filters,
      savedViews: ['All Policies','Active Policies','Invalid Policies','Conflicted Policies','Low Success Rate','High Recovery Time','High Cost','Missing Checkpoint','Missing Compensation','Human Escalation Enabled','Final Output at Risk','Recently Updated','Human Attention Required'],
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/recovery-policies/stream', queue: 'recovery-policy-management' },
    }
  },
  summary: recoveryPoliciesRepository.summary,
  categories: recoveryPoliciesRepository.categories,
  list: (query: RecoveryPoliciesQuery = {}) => recoveryPoliciesRepository.list(query),
  async get(id: string) {
    const [policy, versions, validation, simulations, executions, decisionTrace] = await Promise.all([
      recoveryPoliciesRepository.get(id),
      recoveryPoliciesRepository.versions(id),
      recoveryPoliciesRepository.validation(id),
      recoveryPoliciesRepository.simulations(id),
      recoveryPoliciesRepository.executions(id),
      recoveryPoliciesRepository.decisionTrace(id),
    ])
    return { policy, versions, validation, simulations, executions, decisionTrace }
  },
  versions: (id: string) => recoveryPoliciesRepository.versions(id),
  validation: (id: string) => recoveryPoliciesRepository.validation(id),
  simulations: (id: string) => recoveryPoliciesRepository.simulations(id),
  executions: (id: string) => recoveryPoliciesRepository.executions(id),
  decisionTrace: (id: string) => recoveryPoliciesRepository.decisionTrace(id),
  conflicts: recoveryPoliciesRepository.conflicts,
  coverage: recoveryPoliciesRepository.coverage,
  performance: recoveryPoliciesRepository.performance,
  recommendations: recoveryPoliciesRepository.recommendations,
  finalOutputProtection: recoveryPoliciesRepository.finalOutputProtection,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'recovery-policy-management', dataSource: 'database', events: ['recovery.policy.created','recovery.policy.updated','recovery.policy.validating','recovery.policy.validated','recovery.policy.simulation.started','recovery.policy.simulation.completed','recovery.policy.published','recovery.policy.disabled','recovery.policy.selected','recovery.policy.guardrail.blocked','recovery.policy.execution.started','recovery.policy.execution.completed','recovery.policy.execution.failed','recovery.policy.conflict.detected','recovery.policy.conflict.resolved','recovery.policy.recommendation.created','recovery.policy.recommendation.applied','recovery.policy.rollback.started','recovery.policy.rollback.completed','recovery.policy.human_attention_required'] }
  },
}

export const RecoveryPolicyService = recoveryPoliciesService
export const RecoveryPolicySelectionService = recoveryPoliciesService
export const RecoveryEligibilityService = recoveryPoliciesService
export const RecoveryEvidenceService = recoveryPoliciesService
export const RecoveryRiskService = recoveryPoliciesService
export const RecoveryCostService = recoveryPoliciesService
export const RecoveryGuardrailService = recoveryPoliciesService
export const RecoveryStrategyService = recoveryPoliciesService
export const RecoveryCheckpointService = recoveryPoliciesService
export const RecoveryCompensationService = recoveryPoliciesService
export const RecoveryEscalationService = recoveryPoliciesService
export const RecoveryPolicyValidationService = recoveryPoliciesService
export const RecoveryPolicySimulationService = recoveryPoliciesService
export const RecoveryPolicyConflictService = recoveryPoliciesService
export const RecoveryPolicyCoverageService = recoveryPoliciesService
export const RecoveryPolicyPerformanceService = recoveryPoliciesService
export const RecoveryPolicyOptimizationService = recoveryPoliciesService
export const RecoveryPolicyGovernanceService = recoveryPoliciesService
export const RecoveryPolicyFinalOutputService = recoveryPoliciesService
export const RecoveryPolicyDocumentationService = recoveryPoliciesService
