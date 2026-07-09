export type EntityId = string

export type TimestampedEntity = {
  id: EntityId
  createdAt: string
  updatedAt: string
}

export type TenantScopedEntity = TimestampedEntity & {
  organizationId: EntityId
}

export type EntityStatus = 'active' | 'inactive' | 'archived' | 'deleted'

