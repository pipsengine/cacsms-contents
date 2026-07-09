import type { TenantScopedEntity } from './domain'

export type WorkflowDefinitionEntity = TenantScopedEntity & {
  name: string
  version: number
  isActive: boolean
}

export type WorkflowStageEntity = TenantScopedEntity & {
  workflowDefinitionId: string
  name: string
  displayOrder: number
  approvalRequired: boolean
}

export type WorkflowExecutionEntity = TenantScopedEntity & {
  workflowDefinitionId: string
  status: 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed'
  currentStageId?: string
  startedAt?: string
  completedAt?: string
}

