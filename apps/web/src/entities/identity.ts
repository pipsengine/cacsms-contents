import type { EntityId, TenantScopedEntity, TimestampedEntity } from './domain'

export type UserEntity = TenantScopedEntity & {
  email: string
  displayName: string
  status: 'active' | 'invited' | 'suspended'
  lastLoginAt?: string
}

export type RoleEntity = TenantScopedEntity & {
  name: string
  description?: string
}

export type PermissionEntity = TimestampedEntity & {
  code: string
  description?: string
}

export type SessionEntity = TimestampedEntity & {
  userId: EntityId
  refreshTokenHash: string
  ipAddress?: string
  userAgent?: string
  expiresAt: string
  revokedAt?: string
}

