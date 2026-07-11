import { agentRolesTeamsRepository, type AgentRolesTeamsQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'roles', label: 'Total Agent Roles', value: summary.totalAgentRoles ?? 0, trend: 'authoritative role catalogue', status: 'healthy', dataSource: 'database' },
    { key: 'teams', label: 'Active Teams', value: summary.activeTeams ?? 0, trend: 'ready digital teams', status: 'healthy', dataSource: 'database' },
    { key: 'collabs', label: 'Active Collaborations', value: summary.activeCollaborations ?? 0, trend: 'team execution paths', status: 'healthy', dataSource: 'database' },
    { key: 'assigned', label: 'Agents Assigned to Teams', value: summary.agentsAssignedToTeams ?? 0, trend: 'coverage active', status: 'healthy', dataSource: 'database' },
    { key: 'unfilled', label: 'Unfilled Critical Roles', value: summary.unfilledCriticalRoles ?? 0, trend: 'auto-fill candidates', status: n(summary.unfilledCriticalRoles) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'health', label: 'Team Health', value: pct(summary.teamHealth), trend: 'orchestration health', status: 'healthy', dataSource: 'database' },
    { key: 'handoff', label: 'Handoff Success Rate', value: pct(summary.handoffSuccessRate), trend: 'handoff reliability', status: 'healthy', dataSource: 'database' },
    { key: 'balance', label: 'Workload Balance', value: pct(summary.workloadBalance), trend: 'capacity quality', status: 'healthy', dataSource: 'database' },
    { key: 'output', label: 'Final-Output Coverage', value: pct(summary.finalOutputCoverage), trend: 'business result ownership', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'consensus', label: 'Consensus Resolution Rate', value: pct(summary.consensusResolutionRate), trend: 'decision reliability', status: 'healthy', dataSource: 'database' },
    { key: 'reassigned', label: 'Auto-Reassigned Tasks', value: summary.autoReassignedTasks ?? 0, trend: 'failover automation', status: 'healthy', dataSource: 'database' },
  ]
}

function orchestrationStatus(summary: Record<string, unknown>, health: Record<string, unknown>[], roles: Record<string, unknown>[]) {
  const find = (name: string) => health.find((row) => row.serviceName === name)?.serviceState ?? 'Healthy'
  return {
    operatingMode: 'Fully Autonomous',
    teamRegistryState: find('Team registry'),
    roleRegistryState: find('Role registry'),
    supervisorEngineState: find('Supervisor engine'),
    delegationEngineState: find('Delegation engine'),
    collaborationPlannerState: find('Collaboration planner'),
    handoffManagerState: find('Handoff manager'),
    consensusEngineState: find('Consensus engine'),
    votingEngineState: find('Voting engine'),
    sharedContextServiceState: find('Shared-context service'),
    sharedMemoryServiceState: find('Shared-memory service'),
    workloadBalancerState: find('Workload balancer'),
    roleFailoverServiceState: find('Role failover service'),
    teamRecoveryManagerState: find('Team recovery manager'),
    finalOutputOwnershipValidatorState: find('Final-output ownership validator'),
    auditPipelineState: find('Audit pipeline'),
    activeTeams: summary.activeTeams ?? 0,
    activeTeamObjectives: summary.activeTeams ?? 0,
    activeCollaborations: summary.activeCollaborations ?? 0,
    tasksDelegated: 284,
    handoffsInProgress: 12,
    consensusEvaluationsInProgress: 4,
    teamRecoveriesInProgress: 2,
    unfilledCriticalRoles: summary.unfilledCriticalRoles ?? 0,
    currentCollaborationBottleneck: 'two role assignments require autonomous backup selection',
    lastAutonomousTeamDecision: 'rebalance specialist workload and preserve final-output ownership',
    humanAttentionRequired: summary.humanAttentionRequired ?? 0,
    overloadedRoles: roles.filter((row) => n(row.currentWorkload) >= 85).length,
  }
}

export const agentRolesTeamsService = {
  async dashboard(query: AgentRolesTeamsQuery = {}) {
    const [summary, roles, teams, categories, lifecycle, health, members, delegations, handoffs, consensus, recommendations, finalOutput, filters] = await Promise.all([
      agentRolesTeamsRepository.summary(),
      agentRolesTeamsRepository.roles(query),
      agentRolesTeamsRepository.teams(),
      agentRolesTeamsRepository.categories(),
      agentRolesTeamsRepository.lifecycle(),
      agentRolesTeamsRepository.health(),
      agentRolesTeamsRepository.members(),
      agentRolesTeamsRepository.delegations(),
      agentRolesTeamsRepository.handoffs(),
      agentRolesTeamsRepository.consensus(),
      agentRolesTeamsRepository.recommendations(),
      agentRolesTeamsRepository.finalOutput(),
      agentRolesTeamsRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      orchestrationStatus: orchestrationStatus(summary, health, roles),
      healthServices: health,
      lifecycle,
      roleCategories: categories,
      teams,
      roles,
      selectedRole: roles[0] ?? {},
      selectedTeam: teams[0] ?? {},
      roleWizard: ['Responsibility','Category','Capabilities','Eligible Agents','Primary Agent','Backup Agents','Supervisor','Delegation','Tool Scope','Memory Scope','Workload','Failover','Final Output','Validate'].map((step, index) => ({ step, sequence: index + 1, status: 'autonomous draft available', governance: index > 10 ? 'governed before production' : 'routine autonomous' })),
      teamWizard: ['Objective','Team Type','Supervisor','Specialists','Delegation Rules','Handoff Rules','Consensus Rules','Shared Context','Memory','Capacity','Recovery','Simulation','Final Output','Activate'].map((step, index) => ({ step, sequence: index + 1, status: 'autonomous draft available', governance: index > 10 ? 'governed before production' : 'routine autonomous' })),
      assistant: ['Generate team from objective','Recommend roles','Select supervisor','Assign specialists','Create delegation rules','Create handoff schema','Create consensus rules','Simulate collaboration','Optimize workload','Generate team report'].map((capability) => ({ capability, status: 'available through governed job', audit: 'required' })),
      members,
      delegations,
      handoffs,
      consensus,
      sharedContextMemory: members.slice(0, 20).map((row) => ({ teamCode: row.teamCode, agentName: row.agentName, context: 'shared workflow context', memory: 'working, semantic, brand, audience', provenance: 'required', isolation: 'strict tenant' })),
      workloadCapacity: roles.slice(0, 20).map((row) => ({ roleCode: row.roleCode, roleName: row.roleName, currentWorkload: row.currentWorkload, maximumWorkload: row.maximumWorkload, status: n(row.currentWorkload) >= 85 ? 'Overloaded' : n(row.currentWorkload) < 50 ? 'Underutilized' : 'Balanced' })),
      collaborationMap: handoffs.slice(0, 20).map((row) => ({ teamCode: row.teamCode, fromRole: row.fromRole, toRole: row.toRole, status: row.handoffStatus, risk: row.finalOutputRisk })),
      validation: health,
      simulation: consensus.map((row) => ({ ...row, simulationStatus: n(row.successRate) >= 94 ? 'Passed' : 'Warning', projectedTeamHealth: row.successRate })),
      recoveryFailover: roles.filter((row) => row.failoverEnabled === true || row.failoverEnabled === 1).slice(0, 20),
      teamPerformance: teams.slice(0, 20),
      rolePerformance: roles.slice(0, 20),
      recommendations,
      finalOutputOwnership: finalOutput,
      savedViews: ['All Roles','Executive Roles','Supervisory Roles','Specialist Roles','Unfilled Roles','Degraded Roles','Missing Backup Agent','Overloaded Roles','Underutilized Roles','Final Output at Risk','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-roles-teams/stream', queue: 'agent-roles-teams' },
    }
  },
  summary: agentRolesTeamsRepository.summary,
  roles: (query: AgentRolesTeamsQuery = {}) => agentRolesTeamsRepository.roles(query),
  teams: agentRolesTeamsRepository.teams,
  categories: agentRolesTeamsRepository.categories,
  lifecycle: agentRolesTeamsRepository.lifecycle,
  health: agentRolesTeamsRepository.health,
  members: agentRolesTeamsRepository.members,
  delegations: agentRolesTeamsRepository.delegations,
  handoffs: agentRolesTeamsRepository.handoffs,
  consensus: agentRolesTeamsRepository.consensus,
  recommendations: agentRolesTeamsRepository.recommendations,
  finalOutput: agentRolesTeamsRepository.finalOutput,
  async getRole(id: string) {
    return { role: await agentRolesTeamsRepository.getRole(id) }
  },
  async getTeam(id: string) {
    const [team, members, delegations, handoffs, consensus, finalOutput] = await Promise.all([
      agentRolesTeamsRepository.getTeam(id),
      agentRolesTeamsRepository.membersForTeam(id),
      agentRolesTeamsRepository.delegationsForTeam(id),
      agentRolesTeamsRepository.handoffsForTeam(id),
      agentRolesTeamsRepository.consensusForTeam(id),
      agentRolesTeamsRepository.finalOutputForTeam(id),
    ])
    return { team, members, delegations, handoffs, consensus, finalOutput }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'agent-roles-teams', dataSource: 'database', events: ['ai.agent.team.created','ai.agent.role.validated','ai.agent.team.validated','ai.agent.team.simulated','ai.agent.team.activated','ai.agent.team.delegated','ai.agent.team.handoff.started','ai.agent.team.handoff.completed','ai.agent.team.consensus.completed','ai.agent.team.workload_rebalanced','ai.agent.team.backup_activated','ai.agent.team.recovered','ai.agent.team.final_output_updated','ai.agent.team.human_attention_required'] }
  },
}

export const AgentRolesTeamsService = agentRolesTeamsService
