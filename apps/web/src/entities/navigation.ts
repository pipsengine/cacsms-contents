import type { TenantScopedEntity } from './domain'

export type NavigationModuleEntity = TenantScopedEntity & {
  title: string
  slug: string
  icon?: string
  displayOrder: number
  requiredPermission?: string
}

export type NavigationPageEntity = TenantScopedEntity & {
  moduleId: string
  title: string
  route: string
  displayOrder: number
  requiredPermission?: string
}

