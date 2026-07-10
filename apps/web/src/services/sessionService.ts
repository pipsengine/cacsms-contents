import { auditService } from '@/audit/auditService'

export type CurrentOrganization = {
  id: string
  name: string
  slug: string
  brandName: string
  teamName: string
}

export type CurrentUser = {
  id: string
  name: string
  email: string
  avatarInitials: string
  roles: string[]
  roleLabel: string
  organizationId: string
}

export type CurrentSession = {
  user: CurrentUser
  organization: CurrentOrganization
  permissions: string[]
  sessionValid: boolean
}

export type AuditActivityInput = {
  userId?: string
  organizationId?: string
  action: string
  resource: string
  resourceId?: string
  permission?: string
  status: 'success' | 'denied' | 'blocked' | 'expired' | 'error'
  ipAddress?: string
  userAgent?: string
  timestamp?: string
}

export const buildModeOrganization: CurrentOrganization = {
  id: '9AF6E759-33AD-4BA0-A04E-83660C92E9F5',
  name: 'AI Media Group',
  slug: 'ai-media-group',
  brandName: 'AI Media Group',
  teamName: 'Build Team',
}

export const buildModeUser: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Build Mode User',
  email: 'build-mode@cacsms.local',
  avatarInitials: 'BM',
  roles: ['builder', 'super_admin'],
  roleLabel: 'Build Mode',
  organizationId: buildModeOrganization.id,
}

export const buildModePermissions = ['*']

export const sessionService = {
  async getCurrentSession() {
    return {
      user: buildModeUser,
      organization: buildModeOrganization,
      permissions: buildModePermissions,
      sessionValid: true,
    } satisfies CurrentSession
  },

  async getCurrentUser() {
    return buildModeUser
  },

  async getCurrentOrganization() {
    return buildModeOrganization
  },

  async getCurrentPermissions() {
    return {
      roles: buildModeUser.roles,
      roleLabel: buildModeUser.roleLabel,
      permissions: buildModePermissions,
    }
  },

  async logActivity(input: AuditActivityInput) {
    const payload = {
      ...input,
      userId: input.userId,
      organizationId: input.organizationId,
      timestamp: input.timestamp ?? new Date().toISOString(),
    }

    await auditService.log(payload.action, payload.resource, payload)
    return payload
  },
}
