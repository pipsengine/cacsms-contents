export type WorkflowStatus =
  | 'not_started'
  | 'queued'
  | 'starting'
  | 'running'
  | 'completed'
  | 'degraded'
  | 'failed'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'cancelled'
  | 'blocked'

export type WorkflowDefinition = {
  id: string
  organizationId: string
  code: string
  name: string
  workflowType: string
  currentVersion: number
  status: string
}

export type WorkflowStage = {
  id: string
  workflowDefinitionId: string
  stageCode: string
  name: string
  sequenceNo: number
  weightPercent: number
  requiredPermission?: string | null
}

export type WorkflowStep = {
  id: string
  workflowInstanceId: string
  workflowStageId: string
  stageName: string
  status: WorkflowStatus
  progressPercent: number
  startedAt?: string | null
  completedAt?: string | null
  errorMessage?: string | null
  retryCount: number
  outputReference?: string | null
}

export type WorkflowInstance = {
  id: string
  organizationId: string
  workflowDefinitionId: string
  workflowCode: string
  workflowName: string
  workflowVersion: number
  referenceType?: string | null
  referenceId?: string | null
  status: WorkflowStatus
  currentStageId?: string | null
  currentStage?: string | null
  progressPercent: number
  startedAt?: string | null
  completedAt?: string | null
  stoppedAt?: string | null
  pausedAt?: string | null
  initiatedBy?: string | null
  correlationId: string
  context?: Record<string, unknown>
  createdAt: string
  updatedAt?: string | null
}

export type WorkflowLog = {
  id: string
  workflowInstanceId: string
  workflowStageId?: string | null
  severity: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export type WorkflowSnapshot = {
  instance: WorkflowInstance
  steps: WorkflowStep[]
  logs: WorkflowLog[]
}

export type StartWorkflowInput = {
  workflowCode: string
  referenceType?: string
  referenceId?: string
  context?: Record<string, unknown>
  requestedBy: string
  organizationId?: string
}

export type WorkflowStreamEvent = {
  event: string
  instanceId: string
  payload: WorkflowSnapshot
  createdAt: string
}
