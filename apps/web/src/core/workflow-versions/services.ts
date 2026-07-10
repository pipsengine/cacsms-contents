import { workflowVersionsRepository, type WorkflowVersionsQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Versions', value: summary.totalVersions ?? 0, trend: 'tracked definitions', status: 'healthy', dataSource: 'database' },
    { key: 'published', label: 'Published/Active', value: summary.publishedVersions ?? 0, trend: 'production governed', status: 'healthy', dataSource: 'database' },
    { key: 'draft', label: 'Draft Versions', value: summary.draftVersions ?? 0, trend: 'not released', status: 'watch', dataSource: 'database' },
    { key: 'validation', label: 'Under Validation', value: summary.underValidation ?? 0, trend: 'autonomous checks', status: n(summary.underValidation) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'rollouts', label: 'Active Rollouts', value: summary.activeRollouts ?? 0, trend: 'canary/progressive', status: n(summary.activeRollouts) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'rollbacks', label: 'Automatic Rollbacks Today', value: summary.automaticRollbacks ?? 0, trend: 'guardrail events', status: n(summary.automaticRollbacks) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'health', label: 'Version Health', value: pct(summary.versionHealth), trend: 'weighted average', status: n(summary.versionHealth) < 85 ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'compatibility', label: 'Compatibility Passed', value: pct(summary.compatibilityPassed), trend: 'contract checks', status: n(summary.compatibilityPassed) < 85 ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final-Output Compatible', value: pct(summary.finalOutputCompatible), trend: 'business result contract', status: n(summary.finalOutputCompatible) < 85 ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

function governanceStatus(summary: Record<string, unknown>) {
  return {
    status: n(summary.humanAttentionRequired) ? 'Attention Required' : 'Autonomous Guardrails Active',
    releaseGate: n(summary.compatibilityPassed) >= 85 ? 'Release gate healthy' : 'Compatibility warnings present',
    finalOutputGate: n(summary.finalOutputCompatible) >= 85 ? 'Final-output gate healthy' : 'Final-output contract risk',
    rollbackPolicy: n(summary.automaticRollbacks) ? 'Rollback executed today' : 'Rollback armed',
    lastReleaseEvent: summary.lastReleaseEvent,
  }
}

export const workflowVersionsService = {
  async dashboard(query: WorkflowVersionsQuery = {}) {
    const [summary, versions, comparison, compatibility, releaseReadiness, rollouts, canaryMetrics, migrations, drift, health, rollbacks, decisions, finalOutputCompatibility, filters] = await Promise.all([
      workflowVersionsRepository.summary(),
      workflowVersionsRepository.list(query),
      workflowVersionsRepository.comparisons(),
      workflowVersionsRepository.compatibilityAll(),
      workflowVersionsRepository.releaseReadinessAll(),
      workflowVersionsRepository.rollouts(),
      workflowVersionsRepository.canaryMetrics(),
      workflowVersionsRepository.migrations(),
      workflowVersionsRepository.drift(),
      workflowVersionsRepository.healthAll(),
      workflowVersionsRepository.rollbacks(),
      workflowVersionsRepository.decisions(),
      workflowVersionsRepository.finalOutputAll(),
      workflowVersionsRepository.filters(),
    ])
    const lifecycle = ['Draft', 'Validating', 'Validated', 'Release Ready', 'Canary', 'Rolling Out', 'Active', 'Superseded', 'Rollback Pending', 'Archived'].map((stage) => ({ stage, count: versions.filter((row) => String(row.versionStatus ?? row.releaseStatus).includes(stage)).length, status: stage }))
    return {
      summary: { ...summary, kpis: kpis(summary) },
      governanceStatus: governanceStatus(summary),
      lifecycle,
      failurePath: ['Validation Failed', 'Release Blocked', 'Canary Failed', 'Regression Detected', 'Automatic Rollback'].map((stage) => ({ stage, guardrail: 'autonomous', humanInput: false })),
      statusCards: versions.map((row) => ({ id: row.id, workflowName: row.workflowName, versionNumber: row.versionNumber, versionStatus: row.versionStatus, validationStatus: row.validationStatus, compatibilityStatus: row.compatibilityStatus, releaseStatus: row.releaseStatus, healthPercent: row.healthPercent, finalOutputCompatible: row.finalOutputCompatible })),
      versions,
      comparison,
      compatibility,
      releaseReadiness,
      rollouts,
      canaryMetrics,
      automaticRollback: rollbacks,
      activeInstanceMigrations: migrations,
      versionDrift: drift,
      versionHealth: health,
      releaseAnalytics: versions.map((row) => ({ id: row.id, workflowName: row.workflowName, version: row.versionNumber, successRate: row.successRate, failureRate: row.failureRate, duration: row.averageDurationMs, cost: row.averageCost, activeInstances: row.activeInstances })),
      autonomousDecisions: decisions,
      finalOutputCompatibility,
      filters,
      savedViews: ['All Versions', 'Draft', 'Validating', 'Release Ready', 'Canary', 'Rolling Out', 'Active', 'Blocked', 'Rollback Pending', 'Breaking Changes', 'Final Output Risk', 'Production', 'Staging', 'Human Attention Required'],
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/workflow-versions/stream', queue: 'workflow-version-management' },
    }
  },
  summary: workflowVersionsRepository.summary,
  get: workflowVersionsRepository.get,
  validation: (id: string) => workflowVersionsRepository.validation(id),
  compatibility: (id: string) => workflowVersionsRepository.compatibility(id),
  dependencies: (id: string) => workflowVersionsRepository.dependencies(id),
  releaseReadiness: (id: string) => workflowVersionsRepository.releaseReadiness(id),
  health: (id: string) => workflowVersionsRepository.health(id),
  finalOutputCompatibility: (id: string) => workflowVersionsRepository.finalOutputCompatibility(id),
  rollouts: workflowVersionsRepository.rollouts,
  rollout: (id: string) => workflowVersionsRepository.rollout(id),
  rolloutCanary: (id: string) => workflowVersionsRepository.rolloutCanary(id),
  rolloutHealth: (id: string) => workflowVersionsRepository.rolloutHealth(id),
  drift: workflowVersionsRepository.drift,
  migrations: workflowVersionsRepository.migrations,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'workflow-version-management', dataSource: 'database', events: ['workflow.version.created','workflow.version.updated','workflow.version.validating','workflow.version.validated','workflow.version.compatibility.completed','workflow.version.release_ready','workflow.version.release_blocked','workflow.version.rollout.started','workflow.version.canary.started','workflow.version.canary.passed','workflow.version.canary.failed','workflow.version.rollout.expanded','workflow.version.rollout.paused','workflow.version.activated','workflow.version.regression.detected','workflow.version.rollback.started','workflow.version.rollback.completed','workflow.version.drift.detected','workflow.version.drift.corrected','workflow.version.human_attention_required'] }
  },
}

export const WorkflowVersionService = workflowVersionsService
export const WorkflowVersionValidationService = workflowVersionsService
export const WorkflowVersionCompatibilityService = workflowVersionsService
export const WorkflowVersionReleaseService = workflowVersionsService
export const WorkflowVersionRolloutService = workflowVersionsService
export const WorkflowVersionRollbackService = workflowVersionsService
export const WorkflowVersionMigrationService = workflowVersionsService
export const WorkflowVersionDriftService = workflowVersionsService
export const WorkflowVersionFinalOutputService = workflowVersionsService

