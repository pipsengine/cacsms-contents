import { activeAgentRunsService } from '@/core/active-agent-runs/services'
import { agentGovernanceService } from '@/core/agent-governance/services'
import { agentSecurityService } from '@/core/agent-security/services'
import { autonomousLearningService } from '@/core/autonomous-learning-engine/services'
import { systemControlService } from '@/core/system-control/services/systemControlService'
import { workflowDashboardService } from '@/core/workflow-dashboard/services'
import { operationsRepository, type Row } from './repositories'

function n(value: unknown) {
  return Number(value ?? 0)
}

function pct(value: unknown) {
  return `${n(value).toFixed(1)}%`
}

function avg(values: unknown[]) {
  const numbers = values.map(n).filter((value) => Number.isFinite(value))
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0
}

async function optional<T>(loader: () => Promise<T>, fallback: T) {
  try {
    return await loader()
  } catch {
    return fallback
  }
}

function kpi(label: string, value: unknown, trend: string, status = 'healthy') {
  return { label, value, trend, status, dataSource: 'database' }
}

function architectureNode(name: string, rows: Row[], health: unknown, latency: unknown, errors: unknown, queue: unknown, status = 'healthy') {
  return {
    name,
    healthPercent: n(health),
    latencyMs: Math.round(n(latency)),
    errors: n(errors),
    queue: n(queue),
    status,
    rows: rows.length,
  }
}

export const operationsService = {
  async dashboard() {
    const [systemStatus, activeRuns, workflows, agentHealth, workers, queues, events, security, governance, learning] = await Promise.all([
      optional(() => systemControlService.status(), {}),
      optional(() => activeAgentRunsService.dashboard(), { summary: {}, runs: [], pipeline: [], activityStream: [], providerRouting: [], toolCalls: [], contextHealth: [], outputValidation: [], recoveries: [], costs: [], slaRisks: [], finalOutputContribution: [], realtime: {} } as Record<string, unknown>),
      optional(() => workflowDashboardService.dashboard(), { summary: {}, pipeline: [], activeInstances: [], queueHealth: [], recoveries: [], autonomousDecisions: [], finalOutputReadiness: {} } as Record<string, unknown>),
      optional(() => operationsRepository.agentHealth(), []),
      optional(() => operationsRepository.workers(), []),
      optional(() => operationsRepository.queueFacts(), []),
      optional(() => operationsRepository.recentEvents(), []),
      optional(() => agentSecurityService.dashboard(), { summary: {}, events: [], incidents: [], risks: [] } as Record<string, unknown>),
      optional(() => agentGovernanceService.dashboard(), { summary: {}, decisions: [], violations: [], approvals: [] } as Record<string, unknown>),
      optional(() => autonomousLearningService.dashboard(), { summary: {}, signals: [], insights: [], recommendations: [], experiments: [], businessImpact: [] } as Record<string, unknown>),
    ])

    const activeSummary = (activeRuns.summary ?? {}) as Row
    const workflowSummary = (workflows.summary ?? {}) as Row
    const securitySummary = (security.summary ?? {}) as Row
    const governanceSummary = (governance.summary ?? {}) as Row
    const learningSummary = (learning.summary ?? {}) as Row
    const runRows = ((activeRuns.runs as Row[] | undefined) ?? [])
    const workflowRows = ((workflows.activeInstances as Row[] | undefined) ?? [])
    const toolRows = ((activeRuns.toolCalls as Row[] | undefined) ?? [])
    const contextRows = ((activeRuns.contextHealth as Row[] | undefined) ?? [])
    const outputRows = ((activeRuns.outputValidation as Row[] | undefined) ?? [])
    const recoveryRows = ((activeRuns.recoveries as Row[] | undefined) ?? [])
    const totalQueued = queues.reduce((sum, row) => sum + n(row.waiting), 0)
    const totalRunningJobs = queues.reduce((sum, row) => sum + n(row.running), 0)
    const failedToday = n(workflowSummary.failed) + events.filter((row) => String(row.severity).toLowerCase() === 'error').length
    const completedToday = n(workflowSummary.completedToday)
    const avgAgentHealth = avg(agentHealth.map((row) => n(row.avgConfidence) || 100))
    const avgQueueHealth = avg(queues.map((row) => row.healthPercent))
    const overallHealth = avg([
      n((systemStatus as Row).health_percent ?? (systemStatus as Row).healthPercent ?? 100),
      avgAgentHealth,
      avgQueueHealth || 100,
      n(securitySummary.aiSecurityPosture ?? 100),
      n(governanceSummary.governanceCoverage ?? 100),
    ])

    return {
      headerIndicators: {
        operationsEngine: String((systemStatus as Row).status ?? 'unknown'),
        autonomousStatus: 'Fully Autonomous',
        productionHealth: pct(overallHealth),
        runningAgents: activeSummary.runningRuns ?? 0,
        runningWorkflows: workflowSummary.inProgress ?? 0,
        workers: workers.length,
        queues: queues.length,
        publishingStatus: n(workflowSummary.pending) > 0 ? 'active' : 'ready',
        dataSource: 'database',
      },
      globalStatus: {
        systemStatus: (systemStatus as Row).status ?? 'unknown',
        production: 'Production',
        running: n(activeSummary.runningRuns) + n(workflowSummary.inProgress),
        overallHealth,
        overallAiStatus: n(activeSummary.humanAttentionRequired) ? 'attention required' : 'autonomous',
        publishing: n(workflowSummary.pending) ? 'running' : 'ready',
        learning: n(learningSummary.newInsights) ? 'active' : 'monitoring',
        security: n(securitySummary.criticalThreats) ? 'watch' : 'healthy',
        governance: n(governanceSummary.activeViolations) ? 'watch' : 'healthy',
        businessReadiness: pct((workflows.finalOutputReadiness as Row | undefined)?.readinessPercent ?? activeSummary.finalOutputOnTrack ?? 0),
      },
      kpis: [
        kpi('Running Agents', activeSummary.runningRuns ?? 0, 'active ai_agent_runs'),
        kpi('Running Workflows', workflowSummary.inProgress ?? 0, 'workflow_instances in progress'),
        kpi('Queued Jobs', totalQueued, `background_jobs waiting / ${totalRunningJobs} running`, totalQueued ? 'watch' : 'healthy'),
        kpi('Workers', workers.length, 'worker ids from active runs'),
        kpi('Completed Today', completedToday, 'workflow completions today'),
        kpi('Failed Today', failedToday, 'workflow errors and failed rows', failedToday ? 'critical' : 'healthy'),
        kpi('Recovered Today', recoveryRows.length + n(workflowSummary.automaticallyRecovered), 'autonomous recovery rows'),
        kpi('Publishing Success', pct((workflows.finalOutputReadiness as Row | undefined)?.readinessPercent ?? 0), 'final output readiness'),
        kpi('Average Latency', `${Math.round(avg(runRows.map((row) => row.latencyMs ?? row.elapsedMinutes)))} ms`, 'agent/runtime latency'),
        kpi('Average Cost', `$${avg(runRows.map((row) => row.actualCost)).toFixed(2)}`, 'agent run actual cost'),
        kpi('Business Value Today', pct(learningSummary.finalOutputImprovement ?? activeSummary.finalOutputOnTrack ?? 0), 'business outcome signal'),
        kpi('Human Attention Required', n(activeSummary.humanAttentionRequired) + n(workflowSummary.humanInputRequired) + n(securitySummary.humanAttentionRequired) + n(governanceSummary.humanAttentionRequired), 'exception only', 'healthy'),
      ],
      architectureMap: [
        architectureNode('Users', [], 100, 0, 0, 0, 'ready'),
        architectureNode('Workflows', workflowRows, workflowSummary.successRate ?? 0, workflowSummary.avgCompletionSeconds ?? 0, workflowSummary.failed ?? 0, totalQueued, 'running'),
        architectureNode('Agents', agentHealth, avgAgentHealth, avg(runRows.map((row) => row.elapsedMinutes)), activeSummary.recoveringRuns ?? 0, activeSummary.waitingOnTools ?? 0, 'running'),
        architectureNode('Prompts', runRows, activeSummary.averageConfidence ?? 0, avg(runRows.map((row) => row.elapsedMinutes)), 0, 0, 'healthy'),
        architectureNode('Models', (activeRuns.providerRouting as Row[] | undefined) ?? [], activeSummary.averageConfidence ?? 0, avg(runRows.map((row) => row.elapsedMinutes)), 0, 0, 'healthy'),
        architectureNode('Providers', (activeRuns.providerRouting as Row[] | undefined) ?? [], 100, avg(runRows.map((row) => row.elapsedMinutes)), 0, 0, 'healthy'),
        architectureNode('Tools', toolRows, 100, avg(toolRows.map((row) => row.durationMs)), toolRows.filter((row) => String(row.status).toLowerCase() === 'failed').length, toolRows.filter((row) => String(row.status).toLowerCase() === 'running').length, 'running'),
        architectureNode('Memory', contextRows, avg(contextRows.map((row) => row.relevanceScore)), 0, 0, 0, 'healthy'),
        architectureNode('Knowledge', contextRows, avg(contextRows.map((row) => row.provenanceScore)), 0, 0, 0, 'healthy'),
        architectureNode('RAG', contextRows, avg(contextRows.map((row) => row.relevanceScore)), 0, 0, 0, 'healthy'),
        architectureNode('Publishing', outputRows, avg(outputRows.map((row) => row.finalOutputReadiness)), 0, outputRows.filter((row) => String(row.validationState).toLowerCase().includes('failed')).length, n(workflowSummary.pending), 'ready'),
        architectureNode('Analytics', events, 100, 0, failedToday, 0, 'monitoring'),
        architectureNode('Learning', ((learning.signals as Row[] | undefined) ?? []), learningSummary.improvementSuccessRate ?? 0, 0, learningSummary.improvementsRolledBack ?? 0, learningSummary.recommendationsReady ?? 0, 'active'),
        architectureNode('Business Outcomes', ((learning.businessImpact as Row[] | undefined) ?? []), learningSummary.finalOutputImprovement ?? 0, 0, 0, 0, 'monitoring'),
      ],
      agentGrid: agentHealth,
      workflowBoard: (workflows.pipeline as Row[] | undefined) ?? [],
      queues,
      workers,
      toolCalls: toolRows,
      modelRouting: (activeRuns.providerRouting as Row[] | undefined) ?? [],
      memory: contextRows,
      rag: contextRows,
      publishing: outputRows,
      socialMonitor: ((workflows.finalOutputReadiness as Row | undefined) ? [workflows.finalOutputReadiness as Row] : []),
      health: [
        { name: 'Overall Health', value: overallHealth },
        { name: 'Agent Health', value: avgAgentHealth },
        { name: 'Workflow Health', value: workflowSummary.successRate ?? 0 },
        { name: 'Queue Health', value: avgQueueHealth },
        { name: 'Security Health', value: securitySummary.aiSecurityPosture ?? 0 },
        { name: 'Governance Health', value: governanceSummary.governanceCoverage ?? 0 },
        { name: 'Learning Health', value: learningSummary.improvementSuccessRate ?? 0 },
      ],
      costs: (activeRuns.costs as Row[] | undefined) ?? [],
      latency: runRows.slice(0, 30),
      errorStream: events,
      incidents: (security.incidents as Row[] | undefined) ?? [],
      recovery: recoveryRows,
      security: (security.events as Row[] | undefined) ?? [],
      governance: (governance.decisions as Row[] | undefined) ?? [],
      learning: (learning.signals as Row[] | undefined) ?? [],
      business: (learning.businessImpact as Row[] | undefined) ?? [],
      notifications: events.slice(0, 12),
      timeline: ([
        ...events.map((row) => ({ ...row, kind: 'workflow' })),
        ...(((activeRuns.activityStream as Row[] | undefined) ?? []).map((row) => ({ ...row, kind: 'agent' }))),
      ] as Row[]).sort((a, b) => String(b.createdAt ?? b.eventTimestamp ?? '').localeCompare(String(a.createdAt ?? a.eventTimestamp ?? ''))).slice(0, 80),
      commandCenter: [
        { command: 'Emergency Stop', mode: 'global Start/Stop only', api: '/api/v1/system/stop', status: 'enabled' },
        { command: 'Pause Agent', mode: 'disabled in autonomous mode', api: '/api/v1/operations/pause', status: 'governed' },
        { command: 'Restart Worker', mode: 'disabled in autonomous mode', api: '/api/v1/operations/restart', status: 'governed' },
        { command: 'Recover', mode: 'automatic recovery workflow', api: '/api/v1/operations/recover', status: 'autonomous' },
      ],
      digitalTwin: [
        { action: 'Open Simulation', route: '/dashboard/ai-agents/simulation-studio', status: 'available' },
        { action: 'Clone Production', route: '/dashboard/ai-agents/simulation-studio', status: 'governed' },
        { action: 'Deploy', route: '/dashboard/ai-agents/version-release-management', status: 'governed release' },
      ],
      dataSource: 'database',
      realtime: operationsService.streamDescriptor(),
    }
  },

  async health() {
    const data = await operationsService.dashboard()
    return { globalStatus: data.globalStatus, health: data.health, headerIndicators: data.headerIndicators }
  },

  workers: operationsRepository.workers,
  queues: operationsRepository.queueFacts,
  events: operationsRepository.recentEvents,

  streamDescriptor() {
    return {
      stream: 'polling-ready',
      heartbeatSeconds: 5,
      autonomousMode: true,
      dataSource: 'database',
      queue: 'operations-center',
      events: ['agent.started', 'agent.finished', 'workflow.started', 'workflow.finished', 'job.completed', 'job.failed', 'queue.updated', 'worker.updated', 'incident.created', 'recovery.started', 'publishing.started', 'publishing.completed'],
    }
  },
}
