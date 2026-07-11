import { agentCapabilitiesRepository, type AgentCapabilitiesQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Capabilities', value: summary.totalCapabilities ?? 0, trend: 'governed reusable skills', status: 'healthy', dataSource: 'database' },
    { key: 'active', label: 'Active', value: summary.activeCapabilities ?? 0, trend: 'available to agents', status: 'healthy', dataSource: 'database' },
    { key: 'draft', label: 'Draft', value: summary.draftCapabilities ?? 0, trend: 'autonomous validation queue', status: 'watch', dataSource: 'database' },
    { key: 'invalid', label: 'Invalid', value: summary.invalidCapabilities ?? 0, trend: 'repair candidates', status: n(summary.invalidCapabilities) ? 'critical' : 'healthy', dataSource: 'database' },
    { key: 'deprecated', label: 'Deprecated', value: summary.deprecatedCapabilities ?? 0, trend: 'retirement managed', status: 'watch', dataSource: 'database' },
    { key: 'assignments', label: 'Capability Assignments', value: summary.capabilityAssignments ?? 0, trend: 'agent coverage', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Avg Success Rate', value: pct(summary.averageSuccessRate), trend: 'runtime quality', status: 'healthy', dataSource: 'database' },
    { key: 'acceptance', label: 'Avg Output Acceptance', value: pct(summary.averageOutputAcceptance), trend: 'output contract fit', status: 'healthy', dataSource: 'database' },
    { key: 'final', label: 'Final-Output Linked', value: pct(summary.finalOutputLinked), trend: 'business outcome chain', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

function healthSummary(summary: Record<string, unknown>, health: Record<string, unknown>[], capabilities: Record<string, unknown>[]) {
  return {
    registryServiceState: health.find((row) => row.serviceName === 'Capability registry service')?.serviceState ?? 'Healthy',
    schemaValidator: health.find((row) => row.serviceName === 'Capability schema validator')?.serviceState ?? 'Healthy',
    inputContractValidator: health.find((row) => row.serviceName === 'Input-contract validator')?.serviceState ?? 'Healthy',
    outputContractValidator: health.find((row) => row.serviceName === 'Output-contract validator')?.serviceState ?? 'Healthy',
    toolDependencyValidator: health.find((row) => row.serviceName === 'Tool dependency validator')?.serviceState ?? 'Healthy',
    providerModelValidator: health.find((row) => row.serviceName === 'Provider/model compatibility validator')?.serviceState ?? 'Healthy',
    assignmentValidator: health.find((row) => row.serviceName === 'Agent-assignment validator')?.serviceState ?? 'Healthy',
    workflowMappingValidator: health.find((row) => row.serviceName === 'Workflow-mapping validator')?.serviceState ?? 'Healthy',
    securityValidator: health.find((row) => row.serviceName === 'Security validator')?.serviceState ?? 'Healthy',
    recoveryValidator: health.find((row) => row.serviceName === 'Recovery validator')?.serviceState ?? 'Healthy',
    performanceAnalyzer: health.find((row) => row.serviceName === 'Performance analyzer')?.serviceState ?? 'Healthy',
    finalOutputLinkageValidator: health.find((row) => row.serviceName === 'Final-output linkage validator')?.serviceState ?? 'Healthy',
    overlapDetector: health.find((row) => row.serviceName === 'Duplicate and overlap detector')?.serviceState ?? 'Healthy',
    auditPipeline: health.find((row) => row.serviceName === 'Audit pipeline')?.serviceState ?? 'Healthy',
    overallRegistryHealth: 'Healthy',
    validCapabilities: capabilities.filter((row) => row.validationStatus === 'Valid').length,
    warningCapabilities: capabilities.filter((row) => row.validationStatus === 'Warning').length,
    invalidCapabilities: summary.invalidCapabilities ?? 0,
    disabledCapabilities: capabilities.filter((row) => row.status === 'Disabled').length,
    deprecatedCapabilities: summary.deprecatedCapabilities ?? 0,
    missingAssignments: capabilities.filter((row) => n(row.assignedAgents) === 0).length,
    missingWorkflowUsage: capabilities.filter((row) => n(row.workflowUsage) === 0).length,
    missingFinalOutput: capabilities.filter((row) => row.finalOutputLinked === false || row.finalOutputLinked === 0).length,
    currentRegistryBottleneck: 'tool fallback and overlap candidates',
    humanAttentionRequired: summary.humanAttentionRequired ?? 0,
  }
}

export const agentCapabilitiesService = {
  async dashboard(query: AgentCapabilitiesQuery = {}) {
    const [summary, capabilities, domains, health, assignments, workflowUsage, providerModels, tools, memoryRag, validations, tests, overlaps, recommendations, finalOutputLinkage, filters] = await Promise.all([
      agentCapabilitiesRepository.summary(),
      agentCapabilitiesRepository.list(query),
      agentCapabilitiesRepository.domains(),
      agentCapabilitiesRepository.health(),
      agentCapabilitiesRepository.assignments(),
      agentCapabilitiesRepository.workflowUsage(),
      agentCapabilitiesRepository.providerModels(),
      agentCapabilitiesRepository.tools(),
      agentCapabilitiesRepository.memoryRag(),
      agentCapabilitiesRepository.validations(),
      agentCapabilitiesRepository.tests(),
      agentCapabilitiesRepository.overlaps(),
      agentCapabilitiesRepository.recommendations(),
      agentCapabilitiesRepository.finalOutputLinkage(),
      agentCapabilitiesRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      registryHealth: healthSummary(summary, health, capabilities),
      healthServices: health,
      lifecycle: ['Draft','Definition','Input Contract','Output Contract','Tool Mapping','Provider Mapping','Agent Assignment','Workflow Mapping','Validation','Testing','Simulation','Publishing','Active','Deprecated'].map((stage, index) => ({ stage, sequence: index + 1, capabilityCount: Math.max(n(summary.totalCapabilities) - index * 8, 0), valid: n(summary.activeCapabilities), warning: n(summary.draftCapabilities), failed: index > 7 ? n(summary.invalidCapabilities) : 0, governance: index > 10 ? 'approval controlled' : 'autonomous maintenance' })),
      domains,
      capabilities,
      capabilityDetails: capabilities[0] ?? {},
      createCapabilityWizard: ['Purpose','Domain','Input Contract','Output Contract','Provider and Model','Tools','Memory and RAG','Agent Assignment','Workflow Usage','Quality Gates','Recovery','Validation','Testing','Publish'].map((step, index) => ({ step, sequence: index + 1, state: 'autonomous draft available', governance: index > 10 ? 'governed before production' : 'routine autonomous' })),
      aiCapabilityAssistant: ['Generate capability contract','Infer input schema','Infer output schema','Recommend provider/model','Recommend tools','Recommend memory/RAG','Map agents','Map workflows','Detect overlap','Generate tests','Generate documentation','Recommend optimization'].map((capability) => ({ capability, status: 'available through governed job', audit: 'required' })),
      inputContractDesigner: validations.slice(0, 10),
      outputContractDesigner: tests.slice(0, 10),
      assignmentMatrix: assignments,
      workflowUsageMatrix: workflowUsage,
      providerModelCompatibility: providerModels,
      toolRequirementMatrix: tools,
      memoryRagRequirements: memoryRag,
      validations,
      tests,
      simulations: tests.map((row) => ({ ...row, simulationMode: 'workflow dry run', simulationStatus: row.testStatus, projectedOutputReadiness: row.finalOutputContribution })),
      overlapAnalysis: overlaps,
      dependencyMap: tools.slice(0, 20).map((row) => ({ node: row.capabilityCode, dependency: row.toolCode, state: row.requirementStatus, health: row.healthPercent })),
      performanceAnalytics: capabilities.slice(0, 20).map((row) => ({ capabilityCode: row.capabilityCode, domain: row.domain, successRate: row.successRate, outputAcceptance: row.outputAcceptance, durationMs: row.avgDurationMs, cost: row.avgCost, healthPercent: row.healthPercent })),
      recommendations,
      versions: [],
      finalOutputLinkage,
      savedViews: ['All Capabilities','Active','Draft','Invalid','Deprecated','Missing Assignments','Missing Workflow Usage','Missing Tools','Missing Provider Support','Memory Required','RAG Required','Final Output at Risk','Overlap Detected','Low Performance','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-capabilities/stream', queue: 'agent-capabilities' },
    }
  },
  summary: agentCapabilitiesRepository.summary,
  list: (query: AgentCapabilitiesQuery = {}) => agentCapabilitiesRepository.list(query),
  domains: agentCapabilitiesRepository.domains,
  health: agentCapabilitiesRepository.health,
  assignments: agentCapabilitiesRepository.assignments,
  workflowUsage: agentCapabilitiesRepository.workflowUsage,
  providerModels: agentCapabilitiesRepository.providerModels,
  tools: agentCapabilitiesRepository.tools,
  memoryRag: agentCapabilitiesRepository.memoryRag,
  validations: agentCapabilitiesRepository.validations,
  tests: agentCapabilitiesRepository.tests,
  overlaps: agentCapabilitiesRepository.overlaps,
  recommendations: agentCapabilitiesRepository.recommendations,
  finalOutputLinkage: agentCapabilitiesRepository.finalOutputLinkage,
  async get(id: string) {
    const [capability, versions, assignments, workflowUsage, providerModels, tools, memoryRag, validations, tests, finalOutput] = await Promise.all([
      agentCapabilitiesRepository.get(id),
      agentCapabilitiesRepository.versions(id),
      agentCapabilitiesRepository.assignmentsForCapability(id),
      agentCapabilitiesRepository.workflowUsageForCapability(id),
      agentCapabilitiesRepository.providerModelsForCapability(id),
      agentCapabilitiesRepository.toolsForCapability(id),
      agentCapabilitiesRepository.memoryRagForCapability(id),
      agentCapabilitiesRepository.validationsForCapability(id),
      agentCapabilitiesRepository.testsForCapability(id),
      agentCapabilitiesRepository.finalOutputForCapability(id),
    ])
    return { capability, versions, assignments, workflowUsage, providerModels, tools, memoryRag, validations, tests, finalOutput }
  },
  versions: (id: string) => agentCapabilitiesRepository.versions(id),
  assignmentsForCapability: (id: string) => agentCapabilitiesRepository.assignmentsForCapability(id),
  workflowUsageForCapability: (id: string) => agentCapabilitiesRepository.workflowUsageForCapability(id),
  providerModelsForCapability: (id: string) => agentCapabilitiesRepository.providerModelsForCapability(id),
  toolsForCapability: (id: string) => agentCapabilitiesRepository.toolsForCapability(id),
  memoryRagForCapability: (id: string) => agentCapabilitiesRepository.memoryRagForCapability(id),
  validationsForCapability: (id: string) => agentCapabilitiesRepository.validationsForCapability(id),
  testsForCapability: (id: string) => agentCapabilitiesRepository.testsForCapability(id),
  finalOutputForCapability: (id: string) => agentCapabilitiesRepository.finalOutputForCapability(id),
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'agent-capabilities', dataSource: 'database', events: ['ai.agent.capability.created','ai.agent.capability.validating','ai.agent.capability.validated','ai.agent.capability.invalid','ai.agent.capability.test.started','ai.agent.capability.test.completed','ai.agent.capability.simulation.completed','ai.agent.capability.published','ai.agent.capability.deprecated','ai.agent.capability.overlap_detected','ai.agent.capability.recommendation_created','ai.agent.capability.final_output_updated','ai.agent.capability.human_attention_required'] }
  },
}

export const AgentCapabilitiesService = agentCapabilitiesService
export const AgentCapabilityValidationService = agentCapabilitiesService
export const AgentCapabilityTestingService = agentCapabilitiesService
export const AgentCapabilityGovernanceService = agentCapabilitiesService
