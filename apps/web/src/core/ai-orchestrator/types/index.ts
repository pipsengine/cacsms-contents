export type AgentStatus = 'active' | 'disabled' | 'deprecated'
export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'approval_required'
export type AgentExecutionMode = 'synchronous' | 'asynchronous' | 'sequential' | 'parallel' | 'fan-out' | 'fan-in' | 'conditional' | 'human-in-the-loop' | 'retryable' | 'resumable' | 'scheduled' | 'streaming'

export type AgentCapability = {
  capability: string
  inputType?: string | null
  outputType?: string | null
}

export type AgentManifest = {
  id: string
  code: string
  name: string
  description: string
  domain: string
  version: number
  status: AgentStatus
  capabilities: AgentCapability[]
  supportedInputTypes: string[]
  supportedOutputTypes: string[]
  requiredTools: string[]
  preferredModels: string[]
  fallbackModels: string[]
  requiredPermissions: string[]
  timeoutSeconds: number
  maxRetries: number
  costLimit: number
  concurrencyLimit: number
  approvalRequired: boolean
  outputSchema: Record<string, unknown>
  validationRules: Record<string, unknown>
  owner?: string | null
  tags: string[]
}

export type AgentContext = {
  organization: Record<string, unknown>
  workflow: Record<string, unknown>
  brand?: Record<string, unknown>
  content?: Record<string, unknown>
  memory: Record<string, unknown>[]
  retrievedSources: RetrievedContextItem[]
}

export type RetrievedContextItem = {
  sourceId: string
  sourceType: string
  title: string
  excerpt: string
  relevanceScore: number
  provenance: string
  citationReference: string
  accessPermission: string
}

export type AgentInput = {
  taskId: string
  workflowInstanceId?: string | null
  workflowStageId?: string | null
  organizationId: string
  brandId?: string | null
  userId?: string | null
  agentCode: string
  objective: string
  context: Record<string, unknown>
  constraints: Record<string, unknown>
  sourceReferences: RetrievedContextItem[]
  outputRequirements: Record<string, unknown>
  correlationId: string
}

export type AgentExecutionOptions = {
  mode: AgentExecutionMode
  timeoutSeconds?: number
  maxRetries?: number
  requireApproval?: boolean
  allowDevelopmentFallback?: boolean
}

export type AgentTelemetry = {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  estimatedCost: number
  retries: number
  outcome: string
}

export type AgentResult = {
  success: boolean
  status: AgentRunStatus
  agentCode: string
  outputType: string
  output: Record<string, unknown>
  confidence: number
  warnings: string[]
  citations: Record<string, unknown>[]
  assets: Record<string, unknown>[]
  usage: AgentTelemetry
  metadata: Record<string, unknown>
  completedAt: string
}

export type AgentError = {
  code: string
  message: string
  retryable: boolean
  metadata?: Record<string, unknown>
}

export type ModelRoute = {
  providerId: string
  providerCode: string
  providerName: string
  modelId: string
  modelCode: string
  modelName: string
}

export type StageAgentMapping = {
  id: string
  workflowDefinitionId: string
  workflowStageId: string
  agentId: string
  agentCode: string
  agentName: string
  domain: string
  executionOrder: number
  executionMode: AgentExecutionMode
  required: boolean
  timeoutSeconds: number
  maxRetries: number
}

export type ExecutionPlan = {
  id: string
  organizationId: string
  workflowInstanceId?: string | null
  objective: string
  status: string
  correlationId: string
  steps: ExecutionPlanStep[]
}

export type ExecutionPlanStep = {
  id: string
  agentId: string
  agentCode: string
  workflowStageId?: string | null
  executionOrder: number
  executionMode: AgentExecutionMode
  status: string
}

export type OrchestrateInput = {
  organizationId: string
  workflowInstanceId?: string | null
  workflowStageId?: string | null
  objective: string
  context?: Record<string, unknown>
  constraints?: Record<string, unknown>
  requestedBy?: string
  agentCodes?: string[]
  executionMode?: AgentExecutionMode
  correlationId?: string
}

export type AgentRunRecord = {
  id: string
  organizationId: string
  agentId: string
  agentCode: string
  agentName: string
  agentVersion: number
  workflowInstanceId?: string | null
  workflowStageId?: string | null
  taskId: string
  status: AgentRunStatus
  progressPercent: number
  providerId?: string | null
  modelId?: string | null
  outputReference?: string | null
  confidenceScore?: number | null
  correlationId: string
  createdAt: string
}

export type OrchestrationResult = {
  plan: ExecutionPlan
  runs: AgentRunRecord[]
  outputs: Record<string, unknown>[]
  status: 'completed' | 'failed' | 'approval_required'
}
