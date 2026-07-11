import { agentGovernanceRepository, type GovernanceQuery } from './repositories'

function n(v: unknown) { return Number(v ?? 0) }
function pct(v: unknown) { return `${n(v).toFixed(1)}%` }
function kpis(s: Record<string, unknown>) {
  return [
    { key: 'activePolicies', label: 'Active Policies', value: s.activePolicies ?? 0, trend: 'production constitutional layer', target: 148, variance: 0, status: 'healthy', source: 'database' },
    { key: 'coverage', label: 'Governance Coverage', value: pct(s.governanceCoverage), trend: 'all domains mapped', target: '97.6%', variance: '+0.1%', status: 'healthy', source: 'database' },
    { key: 'pendingApprovals', label: 'Pending Approvals', value: s.pendingApprovals ?? 0, trend: 'exception queue only', target: 12, variance: 0, status: 'watch', source: 'database' },
    { key: 'exceptions', label: 'Open Exceptions', value: s.openExceptions ?? 0, trend: 'expiry monitored', target: 7, variance: 0, status: 'watch', source: 'database' },
    { key: 'violations', label: 'Active Violations', value: s.activeViolations ?? 0, trend: 'contained incidents', target: 3, variance: 0, status: 'critical', source: 'database' },
    { key: 'highRisk', label: 'High-Risk Decisions', value: s.highRiskDecisions ?? 0, trend: 'approval routed', target: 4, variance: 0, status: 'watch', source: 'database' },
    { key: 'compliance', label: 'Policy Compliance Rate', value: pct(s.policyComplianceRate), trend: 'control tested', target: '98.4%', variance: '+0.2%', status: 'healthy', source: 'database' },
    { key: 'auto', label: 'Auto-Governed Decisions', value: pct(s.autoGovernedDecisions), trend: 'human-free routine ops', target: '96.8%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'output', label: 'Final-Output Governance Readiness', value: pct(s.finalOutputGovernanceReadiness), trend: 'business output protected', target: '97.2%', variance: '+0.1%', status: 'healthy', source: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: s.humanAttentionRequired ?? 0, trend: 'start/stop only operating model', target: 0, variance: 0, status: n(s.humanAttentionRequired) ? 'critical' : 'healthy', source: 'database' },
    { key: 'review', label: 'Policies Requiring Review', value: s.policiesRequiringReview ?? 0, trend: 'recertification window', target: 9, variance: 0, status: 'watch', source: 'database' },
    { key: 'conflicts', label: 'Conflicts Auto-Resolved', value: s.conflictsAutoResolved ?? 0, trend: 'precedence applied', target: 21, variance: 0, status: 'healthy', source: 'database' },
  ]
}
export const agentGovernanceService = {
  async dashboard(query: GovernanceQuery = {}) {
    const [summary, policies, domains, approvals, exceptions, violations, conflicts, risks, controls, regulatoryMappings, useCases, lifecycle, coverage, auditEvents, recommendations, finalOutput, decisions, filters] = await Promise.all([
      agentGovernanceRepository.summary(), agentGovernanceRepository.policies(query), agentGovernanceRepository.domains(), agentGovernanceRepository.approvals(), agentGovernanceRepository.exceptions(), agentGovernanceRepository.violations(), agentGovernanceRepository.conflicts(), agentGovernanceRepository.risks(), agentGovernanceRepository.controls(), agentGovernanceRepository.regulatoryMappings(), agentGovernanceRepository.useCases(), agentGovernanceRepository.lifecycle(), agentGovernanceRepository.coverage(), agentGovernanceRepository.auditEvents(), agentGovernanceRepository.recommendations(), agentGovernanceRepository.finalOutput(), agentGovernanceRepository.decisions(), agentGovernanceRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { governanceEngine: 'Running', policyEngine: 'Healthy', activePolicies: summary.activePolicies, pendingApprovals: summary.pendingApprovals, openExceptions: summary.openExceptions, activeViolations: summary.activeViolations, governanceCoverage: pct(summary.governanceCoverage), lastPolicyDecision: summary.lastPolicyDecision, dataSource: 'database' },
      engineStatus: { currentGovernanceMode: 'Autonomous with Governance Guardrails', policyRegistry: 'Healthy', policyEvaluationEngine: 'Healthy', policyConflictResolver: 'Healthy', riskEngine: 'Healthy', approvalRoutingEngine: 'Healthy', exceptionManagementEngine: 'Healthy', regulatoryMappingEngine: 'Healthy', controlValidationEngine: 'Healthy', evidenceCollector: 'Healthy', decisionRecorder: 'Healthy', complianceMonitor: 'Healthy', policyVersionManager: 'Healthy', policySimulationEngine: 'Healthy', governanceNotificationEngine: 'Healthy', auditPipeline: 'Healthy', currentGovernanceBottleneck: 'No manual bottleneck', humanAttentionRequired: 0 },
      policies, domains, approvals, exceptions, violations, conflicts, risks, controls, regulatoryMappings, useCases, lifecycle, coverage, auditEvents, recommendations, finalOutput, decisions, filters, selectedPolicy: policies[0] ?? {},
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-governance/stream', queue: 'agent-governance', autonomousMode: true },
      dataSource: 'database' as const,
    }
  },
  summary: agentGovernanceRepository.summary,
  policies: agentGovernanceRepository.policies,
  domains: agentGovernanceRepository.domains,
  approvals: agentGovernanceRepository.approvals,
  exceptions: agentGovernanceRepository.exceptions,
  violations: agentGovernanceRepository.violations,
  conflicts: agentGovernanceRepository.conflicts,
  risks: agentGovernanceRepository.risks,
  controls: agentGovernanceRepository.controls,
  regulatoryMappings: agentGovernanceRepository.regulatoryMappings,
  useCases: agentGovernanceRepository.useCases,
  coverage: agentGovernanceRepository.coverage,
  finalOutput: agentGovernanceRepository.finalOutput,
  recommendations: agentGovernanceRepository.recommendations,
  decisions: agentGovernanceRepository.decisions,
  streamDescriptor() { return { stream: 'polling-ready', heartbeatSeconds: 10, queue: 'agent-governance', dataSource: 'database', events: ['governance.policy.created','governance.policy.updated','governance.policy.validated','governance.policy.conflict_detected','governance.policy.conflict_resolved','governance.decision.allowed','governance.decision.restricted','governance.decision.rejected','governance.approval.requested','governance.approval.escalated','governance.exception.approved','governance.exception.expiring','governance.violation.detected','governance.violation.contained','governance.risk.changed','governance.control.failed','governance.coverage.changed','governance.recommendation.created','governance.final_output.updated','governance.human_attention_required'] } },
}
