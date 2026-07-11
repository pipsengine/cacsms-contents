import { agentCollaborationsRepository, type AgentCollaborationsQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Collaborations', value: summary.totalCollaborations ?? 0, trend: 'all collaboration records', status: 'healthy', dataSource: 'database' },
    { key: 'active', label: 'Active Collaborations', value: summary.activeCollaborations ?? 0, trend: 'currently coordinating', status: 'healthy', dataSource: 'database' },
    { key: 'parallel', label: 'Parallel Executions', value: summary.parallelExecutions ?? 0, trend: 'multi-agent work', status: 'healthy', dataSource: 'database' },
    { key: 'handoffs', label: 'Handoffs Today', value: summary.handoffsToday ?? 0, trend: 'handoff throughput', status: 'healthy', dataSource: 'database' },
    { key: 'consensus', label: 'Consensus Sessions', value: summary.consensusSessions ?? 0, trend: 'decision alignment', status: 'healthy', dataSource: 'database' },
    { key: 'conflicts', label: 'Conflict Resolutions', value: summary.conflictResolutions ?? 0, trend: 'autonomous resolution', status: 'watch', dataSource: 'database' },
    { key: 'memory', label: 'Shared Memory Usage', value: pct(summary.sharedMemoryUsage), trend: 'shared retrieval usage', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Collaboration Success Rate', value: pct(summary.collaborationSuccessRate), trend: 'coordination quality', status: 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final Output Completion', value: pct(summary.finalOutputCompletion), trend: 'business outcome', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

function engineStatus(health: Record<string, unknown>[]) {
  const find = (name: string) => health.find((row) => row.serviceName === name)?.serviceState ?? 'Healthy'
  return { operatingMode: 'Fully Autonomous', collaborationPlanner: find('Collaboration Planner'), sharedContext: find('Shared Context'), sharedMemory: find('Shared Memory'), consensusEngine: find('Consensus Engine'), negotiationEngine: find('Negotiation Engine'), delegationEngine: find('Delegation Engine'), handoffEngine: find('Handoff Engine'), conflictResolver: find('Conflict Resolver'), arbitrationEngine: find('Arbitration Engine'), learningSynchronizer: find('Learning Synchronizer'), recoveryCoordinator: find('Recovery Coordinator') }
}

export const agentCollaborationsService = {
  async dashboard(query: AgentCollaborationsQuery = {}) {
    const [summary, collaborations, types, health, pipeline, members, context, memory, messages, delegations, consensus, conflicts, handoffs, learning, recovery, finalOutput, filters] = await Promise.all([
      agentCollaborationsRepository.summary(), agentCollaborationsRepository.list(query), agentCollaborationsRepository.types(), agentCollaborationsRepository.health(), agentCollaborationsRepository.pipeline(), agentCollaborationsRepository.members(), agentCollaborationsRepository.context(), agentCollaborationsRepository.memory(), agentCollaborationsRepository.messages(), agentCollaborationsRepository.delegations(), agentCollaborationsRepository.consensus(), agentCollaborationsRepository.conflicts(), agentCollaborationsRepository.handoffs(), agentCollaborationsRepository.learning(), agentCollaborationsRepository.recovery(), agentCollaborationsRepository.finalOutput(), agentCollaborationsRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      engineStatus: engineStatus(health),
      healthServices: health,
      pipeline,
      collaborationTypes: types,
      collaborations,
      selectedCollaboration: collaborations[0] ?? {},
      collaborationGraph: handoffs.slice(0, 30).map((row) => ({ from: row.fromAgent, to: row.toAgent, state: row.handoffState, risk: row.finalOutputRisk })),
      members,
      sharedContext: context,
      sharedMemory: memory,
      communications: messages,
      delegations,
      negotiation: conflicts.map((row) => ({ ...row, negotiationState: row.resolved ? 'resolved' : 'collecting evidence' })),
      consensus,
      conflicts,
      handoffs,
      outputIntegration: finalOutput,
      learning,
      recovery,
      performance: collaborations.slice(0, 20).map((row) => ({ collaborationCode: row.collaborationCode, progress: row.progressPercent, duration: row.durationMinutes, cost: row.cost, risk: row.risk, finalOutput: row.finalOutputState })),
      savedViews: ['All Collaborations','Active Collaborations','Conflicts','Consensus Sessions','Handoffs','Shared Memory Risk','Final Output at Risk','Recovery Active','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-collaborations/stream', queue: 'agent-collaborations' },
    }
  },
  summary: agentCollaborationsRepository.summary,
  list: (query: AgentCollaborationsQuery = {}) => agentCollaborationsRepository.list(query),
  types: agentCollaborationsRepository.types,
  health: agentCollaborationsRepository.health,
  pipeline: agentCollaborationsRepository.pipeline,
  consensus: agentCollaborationsRepository.consensus,
  conflicts: agentCollaborationsRepository.conflicts,
  handoffs: agentCollaborationsRepository.handoffs,
  performance: async () => (await agentCollaborationsRepository.list()).slice(0, 50),
  finalOutput: agentCollaborationsRepository.finalOutput,
  async get(id: string) {
    const [collaboration, members, context, memory, messages, consensus, conflicts, handoffs, recovery] = await Promise.all([agentCollaborationsRepository.get(id), agentCollaborationsRepository.membersFor(id), agentCollaborationsRepository.contextFor(id), agentCollaborationsRepository.memoryFor(id), agentCollaborationsRepository.messagesFor(id), agentCollaborationsRepository.consensusFor(id), agentCollaborationsRepository.conflictsFor(id), agentCollaborationsRepository.handoffsFor(id), agentCollaborationsRepository.recoveryFor(id)])
    return { collaboration, members, context, memory, messages, consensus, conflicts, handoffs, recovery }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'agent-collaborations', dataSource: 'database', events: ['collaboration.created','collaboration.started','agent.joined','agent.left','task.delegated','handoff.started','handoff.completed','consensus.started','consensus.completed','conflict.detected','conflict.resolved','shared.memory.updated','shared.context.updated','learning.synchronized','collaboration.completed'] }
  },
}

export const AgentCollaborationsService = agentCollaborationsService
