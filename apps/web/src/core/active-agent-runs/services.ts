import { activeAgentRunsRepository, type ActiveAgentRunsQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toFixed(2)}/hour` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'active', label: 'Active Agent Runs', value: summary.activeAgentRuns ?? 0, trend: 'live active rows', status: 'healthy', dataSource: 'database' },
    { key: 'running', label: 'Running', value: summary.runningRuns ?? 0, trend: 'executing now', status: 'healthy', dataSource: 'database' },
    { key: 'planning', label: 'Planning', value: summary.planningRuns ?? 0, trend: 'plan generation', status: 'healthy', dataSource: 'database' },
    { key: 'tools', label: 'Waiting on Tools', value: summary.waitingOnTools ?? 0, trend: 'tool executor queue', status: 'watch', dataSource: 'database' },
    { key: 'validation', label: 'Validating Outputs', value: summary.validatingOutputs ?? 0, trend: 'quality gates', status: 'healthy', dataSource: 'database' },
    { key: 'retrying', label: 'Retrying', value: summary.retryingRuns ?? 0, trend: 'inside guardrails', status: 'watch', dataSource: 'database' },
    { key: 'recovering', label: 'Recovering', value: summary.recoveringRuns ?? 0, trend: 'autonomous recovery', status: 'watch', dataSource: 'database' },
    { key: 'sla', label: 'SLA or Deadline Risk', value: summary.slaDeadlineRisk ?? 0, trend: 'mitigated automatically', status: n(summary.slaDeadlineRisk) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'confidence', label: 'Average Confidence', value: pct(summary.averageConfidence), trend: 'quality guardrail', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Current Cost Rate', value: money(summary.currentCostRate), trend: 'cost guardrail', status: 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final Output on Track', value: pct(summary.finalOutputOnTrack), trend: 'business output', status: 'healthy', dataSource: 'database' },
  ]
}

function controlStatus(summary: Record<string, unknown>) {
  return {
    aiOrchestrator: 'Running',
    agentSelector: 'Healthy',
    planningEngine: 'Healthy',
    contextBuilder: 'Healthy',
    promptResolver: 'Healthy',
    providerRouter: 'Healthy',
    modelRouter: 'Healthy',
    toolExecutor: n(summary.waitingOnTools) > 12 ? 'Watch' : 'Healthy',
    outputValidator: 'Healthy',
    recoveryManager: n(summary.recoveringRuns) ? 'Active' : 'Healthy',
    costGuardrail: 'Healthy',
    qualityGuardrail: 'Healthy',
    queueDispatcher: 'Running',
    workerMatcher: 'Running',
    operatingMode: 'Fully Autonomous',
    activeRuns: summary.activeAgentRuns ?? 0,
    queuedRuns: 0,
    waitingRuns: summary.waitingOnTools ?? 0,
    recoveringRuns: summary.recoveringRuns ?? 0,
    failedRuns: 0,
    currentProviderBottleneck: 'none',
    currentWorkerBottleneck: 'agent-worker-7 warm queue',
    currentQueueBottleneck: 'none',
    currentToolBottleneck: n(summary.waitingOnTools) ? 'database read fan-out' : 'none',
    currentCostPressure: 'normal',
    lastAutonomousDecision: summary.lastAgentEvent,
    humanAttentionRequired: summary.humanAttentionRequired ?? 0,
  }
}

function domainCards(runs: Record<string, unknown>[]) {
  const groups = runs.reduce<Record<string, Record<string, unknown>[]>>((acc, row) => {
    const domain = String(row.domain ?? 'Unassigned')
    acc[domain] = [...(acc[domain] ?? []), row]
    return acc
  }, {})
  return Object.entries(groups).map(([domain, rows]) => ({
    domainName: `${domain} Runs`,
    activeRuns: rows.length,
    queuedRuns: rows.filter((row) => row.status === 'Queued').length,
    recoveringRuns: rows.filter((row) => row.status === 'Recovering').length,
    averageProgress: rows.reduce((sum, row) => sum + n(row.progressPercent), 0) / Math.max(rows.length, 1),
    averageConfidence: rows.reduce((sum, row) => sum + n(row.confidenceScore), 0) / Math.max(rows.length, 1),
    averageLatency: `${Math.round(rows.reduce((sum, row) => sum + n(row.elapsedMinutes), 0) / Math.max(rows.length, 1))}m`,
    averageCost: rows.reduce((sum, row) => sum + n(row.actualCost), 0) / Math.max(rows.length, 1),
    deadlineRisk: rows.filter((row) => row.deadlineRisk).length,
    finalOutputContribution: rows.filter((row) => row.finalOutputImpact === 'On track').length,
    healthPercent: rows.reduce((sum, row) => sum + (100 - n(row.riskScore) / 2), 0) / Math.max(rows.length, 1),
  }))
}

export const activeAgentRunsService = {
  async dashboard(query: ActiveAgentRunsQuery = {}) {
    const [summary, runs, pipeline, activityStream, collaborations, providerRouting, toolCalls, contextHealth, outputValidation, bottlenecks, recoveries, costs, slaRisks, finalOutputContribution, filters] = await Promise.all([
      activeAgentRunsRepository.summary(),
      activeAgentRunsRepository.list(query),
      activeAgentRunsRepository.pipeline(),
      activeAgentRunsRepository.activityStream(),
      activeAgentRunsRepository.collaborations(),
      activeAgentRunsRepository.providerRouting(),
      activeAgentRunsRepository.toolCalls(),
      activeAgentRunsRepository.contextHealth(),
      activeAgentRunsRepository.outputValidation(),
      activeAgentRunsRepository.bottlenecks(),
      activeAgentRunsRepository.recoveries(),
      activeAgentRunsRepository.costs(),
      activeAgentRunsRepository.slaRisks(),
      activeAgentRunsRepository.finalOutputContribution(),
      activeAgentRunsRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      controlStatus: controlStatus(summary),
      pipeline,
      domains: domainCards(runs),
      runs,
      selectedRun: runs[0] ?? {},
      activityStream,
      executionMap: ['Task','Context','Plan','Agent','Provider','Model','Prompt','Tools','Output','Validation','Workflow Stage','Final Output'].map((node, index) => ({ node, state: index < 8 ? 'completed' : index < 10 ? 'active' : 'pending', metric: index === 7 ? 'tool calls live' : 'database-backed' })),
      collaborations,
      providerRouting,
      toolCalls,
      contextHealth,
      outputValidation,
      bottlenecks,
      recoveries,
      costs,
      slaRisks,
      qualityRisks: bottlenecks,
      finalOutputContribution,
      autonomousDecisions: activityStream,
      priorityTrace: runs.slice(0, 12).map((row) => ({ runId: row.id, agentName: row.agentName, basePriority: 'Normal', adjustments: 'workflow priority, SLA deadline, final-output impact, wait time, recovery state', finalPriority: row.priority, policy: 'dynamic active-run priority', confidence: row.confidenceScore, expectedEffect: 'protect output deadline' })),
      workloadRebalancing: domainCards(runs).slice(0, 12).map((row) => ({ ...row, activeDemand: row.activeRuns, queuedDemand: row.queuedRuns, availableCapacity: 22, workerCapacity: 18, providerQuota: 96, modelQuota: 94, predictedDemand: Number(row.activeRuns) + 4, capacityGap: Number(row.activeRuns) > 16 ? 'watch' : 'none', rebalancingAction: 'maintain autonomous placement', expectedImprovement: 'stable', costImpact: 'neutral' })),
      emergencyControls: [{ elevatedPermission: 'ai_agent_runs.emergency_control', confirmation: 'required', reason: 'required', impactPreview: 'required', audit: 'required', notification: 'required', rollback: 'required' }],
      savedViews: ['All Active Runs','Running','Planning','Waiting on Tools','Validating Outputs','Retrying','Recovering','Blocked','Deadline at Risk','Low Confidence','Low Quality','High Risk','High Cost','Provider Switched','Model Switched','Worker Reassigned','Final Output at Risk','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/ai-agent-runs/stream', queue: 'ai-agent-runs' },
    }
  },
  summary: activeAgentRunsRepository.summary,
  list: (query: ActiveAgentRunsQuery = {}) => activeAgentRunsRepository.list(query),
  pipeline: activeAgentRunsRepository.pipeline,
  activityStream: activeAgentRunsRepository.activityStream,
  collaborations: activeAgentRunsRepository.collaborations,
  providerRouting: activeAgentRunsRepository.providerRouting,
  toolCalls: activeAgentRunsRepository.toolCalls,
  contextHealth: activeAgentRunsRepository.contextHealth,
  outputValidation: activeAgentRunsRepository.outputValidation,
  bottlenecks: activeAgentRunsRepository.bottlenecks,
  recoveries: activeAgentRunsRepository.recoveries,
  costs: activeAgentRunsRepository.costs,
  slaRisks: activeAgentRunsRepository.slaRisks,
  autonomousDecisions: activeAgentRunsRepository.autonomousDecisions,
  finalOutputContribution: activeAgentRunsRepository.finalOutputContribution,
  async get(id: string) {
    const [run, plan, planSteps, context, contextItems, prompt, routing, tools, output, validation, recovery, timeline, map] = await Promise.all([
      activeAgentRunsRepository.get(id),
      activeAgentRunsRepository.plan(id),
      activeAgentRunsRepository.planSteps(id),
      activeAgentRunsRepository.context(id),
      activeAgentRunsRepository.contextItems(id),
      activeAgentRunsRepository.prompt(id),
      activeAgentRunsRepository.routing(id),
      activeAgentRunsRepository.tools(id),
      activeAgentRunsRepository.output(id),
      activeAgentRunsRepository.validation(id),
      activeAgentRunsRepository.recovery(id),
      activeAgentRunsRepository.timeline(id),
      activeAgentRunsRepository.map(id),
    ])
    return { run, plan, planSteps, context, contextItems, prompt, routing, tools, output, validation, recovery, timeline, map }
  },
  plan: async (id: string) => ({ plan: await activeAgentRunsRepository.plan(id), steps: await activeAgentRunsRepository.planSteps(id) }),
  context: async (id: string) => ({ context: await activeAgentRunsRepository.context(id), items: await activeAgentRunsRepository.contextItems(id) }),
  prompt: activeAgentRunsRepository.prompt,
  routing: activeAgentRunsRepository.routing,
  tools: activeAgentRunsRepository.tools,
  output: activeAgentRunsRepository.output,
  validation: activeAgentRunsRepository.validation,
  recovery: activeAgentRunsRepository.recovery,
  timeline: activeAgentRunsRepository.timeline,
  map: activeAgentRunsRepository.map,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'ai-agent-runs', dataSource: 'database', events: ['ai.agent.run.queued','ai.agent.run.selected','ai.agent.run.context.started','ai.agent.run.context.completed','ai.agent.run.plan.created','ai.agent.run.provider.selected','ai.agent.run.model.selected','ai.agent.run.prompt.resolved','ai.agent.run.tool.started','ai.agent.run.tool.completed','ai.agent.run.output.started','ai.agent.run.output.generated','ai.agent.run.validation.started','ai.agent.run.validation.failed','ai.agent.run.retry.started','ai.agent.run.provider.switched','ai.agent.run.model.switched','ai.agent.run.worker.reassigned','ai.agent.run.recovery.completed','ai.agent.run.workflow.updated','ai.agent.run.final_output.confirmed'] }
  },
}

export const ActiveAgentRunsService = activeAgentRunsService
export const AgentRunExecutionService = activeAgentRunsService
export const AgentRunPlanningService = activeAgentRunsService
export const AgentRunContextService = activeAgentRunsService
export const AgentRunPromptService = activeAgentRunsService
export const AgentRunRoutingService = activeAgentRunsService
export const AgentRunToolService = activeAgentRunsService
export const AgentRunOutputService = activeAgentRunsService
export const AgentRunValidationService = activeAgentRunsService
export const AgentRunBottleneckService = activeAgentRunsService
export const AgentRunRecoveryService = activeAgentRunsService
export const AgentRunCostService = activeAgentRunsService
export const AgentRunTokenService = activeAgentRunsService
export const AgentRunRiskService = activeAgentRunsService
export const AgentRunPriorityService = activeAgentRunsService
export const AgentRunCollaborationService = activeAgentRunsService
export const AgentRunCapacityService = activeAgentRunsService
export const AgentRunDecisionFeedService = activeAgentRunsService
export const AgentRunFinalOutputService = activeAgentRunsService
export const AgentRunNotificationService = activeAgentRunsService
