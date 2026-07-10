import { activeWorkflowRepository, type ActiveWorkflowsQuery } from './repositories'

function number(value: unknown) {
  return Number(value ?? 0)
}

function pct(value: unknown) {
  return `${number(value).toFixed(1)}%`
}

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'active', label: 'Active Workflows', value: summary.activeWorkflows ?? 0, trend: 'live', status: 'operational', note: 'Currently executing', dataSource: 'database' },
    { key: 'running', label: 'Running', value: summary.running ?? 0, trend: 'stable', status: 'healthy', note: 'In active execution', dataSource: 'database' },
    { key: 'waiting', label: 'Waiting', value: summary.waiting ?? 0, trend: 'watch', status: 'watch', note: 'Queue or dependency wait', dataSource: 'database' },
    { key: 'approval', label: 'Awaiting Approval', value: summary.awaitingApproval ?? 0, trend: 'guarded', status: 'watch', note: 'Auto-approval evaluating', dataSource: 'database' },
    { key: 'recovering', label: 'Recovering', value: summary.recovering ?? 0, trend: 'automated', status: 'recovering', note: 'Autonomous recovery active', dataSource: 'database' },
    { key: 'blocked', label: 'Blocked', value: summary.blocked ?? 0, trend: 'risk', status: 'critical', note: 'Guardrail or dependency block', dataSource: 'database' },
    { key: 'complete', label: 'Expected to Complete', value: summary.expectedToComplete ?? 0, trend: 'predicted', status: 'healthy', note: 'ETA model prediction', dataSource: 'database' },
    { key: 'sla', label: 'SLA at Risk', value: summary.slaAtRisk ?? 0, trend: 'risk', status: 'watch', note: 'At-risk or breached', dataSource: 'database' },
    { key: 'output', label: 'Final Output on Track', value: pct(summary.finalOutputOnTrack), trend: 'readiness', status: 'healthy', note: 'Output readiness model', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'guardrails', status: number(summary.humanAttentionRequired) ? 'critical' : 'healthy', note: 'Outside autonomous guardrails', dataSource: 'database' },
  ]
}

function overview(summary: Record<string, unknown>) {
  return {
    operatingMode: number(summary.humanAttentionRequired) ? 'Autonomous with Guardrails' : 'Fully Autonomous',
    runningWorkflowCount: summary.activeWorkflows ?? 0,
    runningStageCount: summary.runningStageCount ?? 0,
    activeAiAgents: summary.activeAiAgents ?? 0,
    activeBackgroundJobs: summary.activeBackgroundJobs ?? 0,
    assignedWorkers: summary.assignedWorkers ?? 0,
    currentQueueDepth: summary.queueDepth ?? 0,
    averageProgress: summary.averageProgress ?? 0,
    averageElapsedSeconds: summary.averageElapsedSeconds ?? 0,
    averageEtaSeconds: summary.averageEtaSeconds ?? 0,
    currentBottleneck: summary.currentBottleneck ?? 'none detected',
    recoveryActionsInProgress: summary.recoveryActionsInProgress ?? 0,
    expectedFinalOutputRate: summary.expectedFinalOutputRate ?? 0,
  }
}

export const activeWorkflowService = {
  async dashboard(query: ActiveWorkflowsQuery = {}) {
    const [summary, activeWorkflows, pipeline, agents, jobs, recoveries, risks, outputReadiness, bottlenecks, decisions, filters] = await Promise.all([
      activeWorkflowRepository.summary(),
      activeWorkflowRepository.list(query),
      activeWorkflowRepository.pipeline(),
      activeWorkflowRepository.agents(),
      activeWorkflowRepository.jobs(),
      activeWorkflowRepository.recoveries(),
      activeWorkflowRepository.risks(),
      activeWorkflowRepository.outputReadiness(),
      activeWorkflowRepository.bottlenecks(),
      activeWorkflowRepository.decisions(),
      activeWorkflowRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      overview: overview(summary),
      pipeline,
      activeWorkflows,
      bottlenecks,
      recoveries,
      slaRisks: risks,
      outputReadiness,
      agentActivity: agents,
      jobActivity: jobs,
      autonomousDecisions: decisions,
      filters,
      savedViews: ['All Active Workflows', 'Running', 'Recovering', 'Awaiting Approval', 'Blocked', 'SLA at Risk', 'Long Running', 'Publishing', 'Analytics Pending', 'Learning Pending', 'Final Output at Risk', 'Human Attention Required'],
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 8, stream: '/api/v1/workflows/active/stream' },
    }
  },
  summary: activeWorkflowRepository.summary,
  pipeline: activeWorkflowRepository.pipeline,
  bottlenecks: activeWorkflowRepository.bottlenecks,
  risks: activeWorkflowRepository.risks,
  decisions: activeWorkflowRepository.decisions,
  async get(id: string) {
    const [workflow, stages, agents, jobs, recovery, outputReadiness, map] = await Promise.all([
      activeWorkflowRepository.get(id),
      activeWorkflowRepository.stages(id),
      activeWorkflowRepository.byInstance(id, 'vw_active_workflow_agents', 'updated_at DESC'),
      activeWorkflowRepository.byInstance(id, 'vw_active_workflow_jobs', 'started_at DESC'),
      activeWorkflowRepository.byInstance(id, 'vw_active_workflow_recoveries', 'created_at DESC'),
      activeWorkflowRepository.outputReadinessForInstance(id),
      activeWorkflowRepository.map(id),
    ])
    return { workflow, stages, agents, jobs, recovery, outputReadiness, map, dataSource: 'database' as const }
  },
  stages: activeWorkflowRepository.stages,
  agents: (id: string) => activeWorkflowRepository.byInstance(id, 'vw_active_workflow_agents', 'updated_at DESC'),
  jobs: (id: string) => activeWorkflowRepository.byInstance(id, 'vw_active_workflow_jobs', 'started_at DESC'),
  recovery: (id: string) => activeWorkflowRepository.byInstance(id, 'vw_active_workflow_recoveries', 'created_at DESC'),
  outputReadiness: activeWorkflowRepository.outputReadinessForInstance,
  map: activeWorkflowRepository.map,
  streamDescriptor() {
    return {
      stream: 'polling-ready',
      heartbeatSeconds: 8,
      events: ['workflow.active.created', 'workflow.active.started', 'workflow.active.stage.started', 'workflow.active.stage.progress', 'workflow.active.stage.completed', 'workflow.active.stage.failed', 'workflow.active.retrying', 'workflow.active.recovering', 'workflow.active.recovered', 'workflow.active.blocked', 'workflow.active.awaiting_approval', 'workflow.active.approved', 'workflow.active.publishing', 'workflow.active.analytics', 'workflow.active.learning', 'workflow.active.output.ready', 'workflow.active.completed', 'workflow.active.cancelled', 'workflow.active.human_attention_required'],
      autonomousMode: true,
      dataSource: 'database',
    }
  },
}

export const ActiveWorkflowService = activeWorkflowService
export const WorkflowExecutionTrackingService = activeWorkflowService
export const WorkflowBottleneckService = activeWorkflowService
export const WorkflowEtaService = activeWorkflowService
export const WorkflowRiskService = activeWorkflowService
export const WorkflowRecoveryTrackingService = activeWorkflowService
export const WorkflowFinalOutputService = activeWorkflowService
export const WorkflowDecisionFeedService = activeWorkflowService
export const WorkflowExecutionMapService = activeWorkflowService
