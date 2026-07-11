import { agentVersionReleaseRepository, type VersionReleaseQuery } from './repositories'

function n(v: unknown) { return Number(v ?? 0) }
function pct(v: unknown) { return `${n(v).toFixed(1)}%` }

function kpis(s: Record<string, unknown>) {
  return [
    { key: 'components', label: 'Versioned Components', value: s.versionedComponents ?? 0, trend: 'registry coverage', comparison: 'current estate', target: 486, variance: 0, status: 'healthy', source: 'database' },
    { key: 'active', label: 'Active Releases', value: s.activeReleases ?? 0, trend: 'deployments monitored', comparison: 'live release window', target: 8, variance: 0, status: 'watch', source: 'database' },
    { key: 'ready', label: 'Ready for Promotion', value: s.readyForPromotion ?? 0, trend: 'guardrails passed', comparison: 'current queue', target: 14, variance: 0, status: 'healthy', source: 'database' },
    { key: 'approvals', label: 'Releases Awaiting Approval', value: s.releasesAwaitingApproval ?? 0, trend: 'approval gated', comparison: 'governed production', target: 5, variance: 0, status: 'watch', source: 'database' },
    { key: 'success', label: 'Production Deployment Success', value: pct(s.productionDeploymentSuccess), trend: 'production assurance', comparison: 'last 30 days', target: '98.6%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'rollback', label: 'Rollback Readiness', value: pct(s.rollbackReadiness), trend: 'restore coverage', comparison: 'all components', target: '97.2%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'rolledback', label: 'Releases Rolled Back', value: s.releasesRolledBack ?? 0, trend: 'autonomous recovery', comparison: 'historical', target: 3, variance: 0, status: 'healthy', source: 'database' },
    { key: 'duration', label: 'Average Deployment Time', value: `${s.averageDeploymentMinutes ?? 0}m ${s.averageDeploymentSeconds ?? 0}s`, trend: 'deployment runner', comparison: 'rolling average', target: '12m 48s', variance: '0s', status: 'healthy', source: 'database' },
    { key: 'final', label: 'Final-Output Release Readiness', value: pct(s.finalOutputReleaseReadiness), trend: 'business outcome linkage', comparison: 'current estate', target: '96.8%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'human', label: 'Human Attention Required', value: s.humanAttentionRequired ?? 0, trend: 'exception only', comparison: 'current window', target: 0, variance: 0, status: 'healthy', source: 'database' },
    { key: 'drift', label: 'Components with Version Drift', value: s.componentsWithVersionDrift ?? 0, trend: 'configuration drift', comparison: 'current estate', target: 7, variance: 0, status: 'watch', source: 'database' },
    { key: 'blocked', label: 'Releases Blocked by Dependencies', value: s.releasesBlockedByDependencies ?? 0, trend: 'dependency analyzer', comparison: 'current queue', target: 4, variance: 0, status: 'watch', source: 'database' },
  ]
}

export const agentVersionReleaseService = {
  async dashboard(query: VersionReleaseQuery = {}) {
    const [summary, componentVersions, releases, domains, lifecycle, dependencies, packages, environments, promotions, deployments, featureFlags, migrations, drift, gates, risks, approvals, health, regressions, rollbacks, recoveries, notes, analytics, traceability, decisions, filters] = await Promise.all([
      agentVersionReleaseRepository.summary(), agentVersionReleaseRepository.componentVersions(query), agentVersionReleaseRepository.releases(query), agentVersionReleaseRepository.domains(), agentVersionReleaseRepository.lifecycle(), agentVersionReleaseRepository.dependencies(), agentVersionReleaseRepository.packages(), agentVersionReleaseRepository.environments(), agentVersionReleaseRepository.promotions(), agentVersionReleaseRepository.deployments(), agentVersionReleaseRepository.featureFlags(), agentVersionReleaseRepository.migrations(), agentVersionReleaseRepository.drift(), agentVersionReleaseRepository.gates(), agentVersionReleaseRepository.risks(), agentVersionReleaseRepository.approvals(), agentVersionReleaseRepository.health(), agentVersionReleaseRepository.regressions(), agentVersionReleaseRepository.rollbacks(), agentVersionReleaseRepository.recoveries(), agentVersionReleaseRepository.notes(), agentVersionReleaseRepository.analytics(), agentVersionReleaseRepository.traceability(), agentVersionReleaseRepository.decisions(), agentVersionReleaseRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: {
        releaseOrchestrator: 'Running',
        versionRegistry: 'Healthy',
        activeReleases: summary.activeReleases ?? 0,
        releasesAwaitingApproval: summary.releasesAwaitingApproval ?? 0,
        productionHealth: pct(summary.productionDeploymentSuccess),
        rollbackReadiness: pct(summary.rollbackReadiness),
        deploymentSuccessRate: pct(summary.productionDeploymentSuccess),
        lastReleaseEvent: summary.lastReleaseEventAt,
        dataSource: 'database',
      },
      operationsStatus: {
        mode: 'Autonomous with Release Guardrails',
        versionRegistry: 'Healthy',
        configurationRegistry: 'Healthy',
        releasePackageBuilder: 'Running',
        dependencyAnalyzer: 'Running',
        compatibilityValidator: 'Healthy',
        simulationConnector: 'Healthy',
        benchmarkConnector: 'Healthy',
        regressionTestEngine: 'Healthy',
        securityTestEngine: 'Healthy',
        governanceCheckEngine: 'Healthy',
        databaseMigrationValidator: 'Healthy',
        environmentPromotionEngine: 'Running',
        deploymentOrchestrator: 'Running',
        canaryController: 'Active',
        blueGreenController: 'Active',
        progressiveRolloutController: 'Active',
        releaseHealthMonitor: 'Healthy',
        rollbackController: 'Ready',
        artifactIntegrityValidator: 'Verified',
        auditPipeline: 'Streaming',
        activeBuilds: packages.filter((p) => p.buildStatus === 'Built').length,
        activeValidations: gates.filter((g) => g.gateStatus !== 'Passed').length,
        activePromotions: promotions.filter((p) => p.status !== 'Completed').length,
        activeDeployments: deployments.filter((d) => ['Canary', 'Progressive Rollout', 'Monitoring', 'Deploying'].includes(String(d.status))).length,
        blockedReleases: summary.releasesBlockedByDependencies ?? 0,
        rollbacksInProgress: releases.filter((r) => r.status === 'Rolling Back').length,
        currentReleaseBottleneck: 'dependency impact analysis',
        currentHighestRiskRelease: risks[0]?.releaseCode ?? 'None',
        lastAutonomousReleaseDecision: decisions[0]?.decisionName ?? 'No decisions',
        humanAttentionRequired: summary.humanAttentionRequired ?? 0,
      },
      componentVersions, releases, domains, lifecycle, dependencies, packages, environments, promotions, deployments, featureFlags, migrations, drift, gates, risks, approvals, health, regressions, rollbacks, recoveries, notes, analytics, traceability, decisions, filters,
      selectedVersion: componentVersions[0] ?? {},
      selectedRelease: releases[0] ?? {},
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/version-releases/stream', queue: 'version-release-operations', autonomousMode: true },
      dataSource: 'database' as const,
    }
  },
  summary: agentVersionReleaseRepository.summary,
  componentVersions: agentVersionReleaseRepository.componentVersions,
  releases: agentVersionReleaseRepository.releases,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, queue: 'version-release-operations', dataSource: 'database', events: ['version.created','version.validated','release.validation_completed','release.deployment_progress','release.rollback_completed','release.final_output.updated','release.completed'] }
  },
}
