import type { TenantScopedEntity, TimestampedEntity } from './domain'

export type AiProviderEntity = TimestampedEntity & {
  name: string
  status: 'active' | 'degraded' | 'disabled'
  defaultModel?: string
}

export type AiAgentEntity = TenantScopedEntity & {
  name: string
  purpose: string
  providerId: string
  model: string
  status: 'active' | 'paused' | 'disabled'
}

export type AiAgentRunEntity = TenantScopedEntity & {
  agentId: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  inputTokens: number
  outputTokens: number
  costUsd: number
}

