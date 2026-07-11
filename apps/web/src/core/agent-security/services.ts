import { agentSecurityRepository, type SecurityQuery } from './repositories'

function n(v: unknown) { return Number(v ?? 0) }
function pct(v: unknown) { return `${n(v).toFixed(1)}%` }
function kpis(s: Record<string, unknown>) {
  return [
    { key: 'posture', label: 'AI Security Posture', value: pct(s.aiSecurityPosture), trend: 'zero-trust coverage', target: '96.8%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'identities', label: 'Active AI Identities', value: s.activeAiIdentities ?? 0, trend: 'identity registry', target: 164, variance: 0, status: 'healthy', source: 'database' },
    { key: 'excessive', label: 'Excessive-Permission Findings', value: s.excessivePermissionFindings ?? 0, trend: 'least privilege review', target: 7, variance: 0, status: 'watch', source: 'database' },
    { key: 'incidents', label: 'Open Security Incidents', value: s.openSecurityIncidents ?? 0, trend: 'autonomous response', target: 4, variance: 0, status: 'watch', source: 'database' },
    { key: 'critical', label: 'Critical Threats', value: s.criticalThreats ?? 0, trend: 'contained watchlist', target: 1, variance: 0, status: 'critical', source: 'database' },
    { key: 'prompt', label: 'Prompt-Injection Attempts', value: s.promptInjectionAttempts ?? 0, trend: 'quarantined inputs', target: 28, variance: 0, status: 'watch', source: 'database' },
    { key: 'secrets', label: 'Secrets Expiring Soon', value: s.secretsExpiringSoon ?? 0, trend: 'rotation scheduled', target: 6, variance: 0, status: 'watch', source: 'database' },
    { key: 'containment', label: 'Autonomous Containment Rate', value: pct(s.autonomousContainmentRate), trend: 'no routine human input', target: '94.2%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'output', label: 'Final-Output Security Readiness', value: pct(s.finalOutputSecurityReadiness), trend: 'release assurance', target: '97.1%', variance: '+0.1%', status: 'healthy', source: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: s.humanAttentionRequired ?? 0, trend: 'exception only', target: 0, variance: '+1', status: 'critical', source: 'database' },
    { key: 'blocked', label: 'Blocked Unauthorized Actions', value: s.blockedUnauthorizedActions ?? 0, trend: 'authorization denied', target: 186, variance: 0, status: 'healthy', source: 'database' },
    { key: 'tools', label: 'High-Risk Tool Calls', value: s.highRiskToolCalls ?? 0, trend: 'tool-abuse monitoring', target: 11, variance: 0, status: 'watch', source: 'database' },
  ]
}
export const agentSecurityService = {
  async dashboard(query: SecurityQuery = {}) {
    const [summary, identities, domains, lifecycle, zeroTrust, permissions, secrets, dlp, behavior, threatIntel, events, incidents, containment, playbooks, vulnerabilities, controls, risks, auditEvents, recommendations, finalOutput, filters] = await Promise.all([
      agentSecurityRepository.summary(), agentSecurityRepository.identities(query), agentSecurityRepository.domains(), agentSecurityRepository.lifecycle(), agentSecurityRepository.zeroTrust(), agentSecurityRepository.permissions(), agentSecurityRepository.secrets(), agentSecurityRepository.dlp(), agentSecurityRepository.behavior(), agentSecurityRepository.threatIntel(), agentSecurityRepository.events(), agentSecurityRepository.incidents(), agentSecurityRepository.containment(), agentSecurityRepository.playbooks(), agentSecurityRepository.vulnerabilities(), agentSecurityRepository.controls(), agentSecurityRepository.risks(), agentSecurityRepository.auditEvents(), agentSecurityRepository.recommendations(), agentSecurityRepository.finalOutput(), agentSecurityRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { securityEngine: 'Running', zeroTrustEngine: 'Healthy', activeSecurityEvents: events.length, openIncidents: summary.openSecurityIncidents, criticalThreats: summary.criticalThreats, identityRisk: summary.excessivePermissionFindings, secretsHealth: `${summary.secretsExpiringSoon} expiring`, lastSecurityDecision: summary.lastSecurityDecision, dataSource: 'database' },
      engineStatus: { currentSecurityMode: 'Autonomous with Security Guardrails', identityRegistry: 'Healthy', authenticationService: 'Healthy', authorizationEngine: 'Healthy', zeroTrustPolicyEngine: 'Healthy', permissionAnalyzer: 'Healthy', serviceAccountMonitor: 'Healthy', secretVaultConnector: 'Healthy', credentialRotationEngine: 'Healthy', promptInjectionDetector: 'Healthy', jailbreakDetector: 'Healthy', toolAbuseDetector: 'Healthy', dataLossPreventionEngine: 'Healthy', tenantIsolationMonitor: 'Healthy', ragPoisoningDetector: 'Healthy', memoryIntegrityMonitor: 'Healthy', vulnerabilityScanner: 'Healthy', threatIntelligenceService: 'Healthy', incidentResponseEngine: 'Healthy', autonomousContainmentEngine: 'Healthy', evidencePreservationService: 'Healthy', auditPipeline: 'Healthy', currentSecurityBottleneck: 'One identity requires review', currentHighestRiskThreat: 'Critical prompt-injection attempt contained', humanAttentionRequired: 1 },
      identities, domains, lifecycle, zeroTrust, permissions, secrets, dlp, behavior, threatIntel, events, incidents, containment, playbooks, vulnerabilities, controls, risks, auditEvents, recommendations, finalOutput, filters, selectedIdentity: identities[0] ?? {},
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-security/stream', queue: 'agent-security', autonomousMode: true },
      dataSource: 'database' as const,
    }
  },
  summary: agentSecurityRepository.summary,
  identities: agentSecurityRepository.identities,
  domains: agentSecurityRepository.domains,
  events: agentSecurityRepository.events,
  incidents: agentSecurityRepository.incidents,
  secrets: agentSecurityRepository.secrets,
  permissions: agentSecurityRepository.permissions,
  vulnerabilities: agentSecurityRepository.vulnerabilities,
  risks: agentSecurityRepository.risks,
  controls: agentSecurityRepository.controls,
  finalOutput: agentSecurityRepository.finalOutput,
  streamDescriptor() { return { stream: 'polling-ready', heartbeatSeconds: 10, queue: 'agent-security', dataSource: 'database', events: ['security.identity.created','security.identity.updated','security.identity.risk_changed','security.identity.suspended','security.authentication.failed','security.authorization.denied','security.permission.excessive_detected','security.access_review.started','security.secret.expiring','security.secret.rotated','security.prompt_injection.detected','security.jailbreak.detected','security.tool_abuse.detected','security.data_leakage.detected','security.event.correlated','security.incident.created','security.incident.containment_started','security.incident.contained','security.vulnerability.detected','security.control.failed','security.final_output.updated','security.human_attention_required'] } },
}
