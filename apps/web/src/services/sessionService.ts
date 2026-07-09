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

export const mockPermissions = [
  '*',
  'module.view',
  'module.create',
  'module.edit',
  'module.delete',
  'module.approve',
  'module.publish',
  'module.export',
  'module.run',
  'module.manage',
  'system_monitoring.view',
  'system_monitoring.run_validation',
  'system_monitoring.export_report',
  'system_monitoring.restart_service',
  'workflow_automation.view',
  'workflow_automation.execute',
  'workflow_automation.approve',
  'ai_agents.view',
  'ai_agents.run',
  'ai_agents.configure',
  'content_production.view',
  'content_production.generate',
  'content_production.approve',
  'publishing_center.view',
  'publishing_center.publish',
]

export const mockSession: CurrentSession = {
  sessionValid: true,
  user: {
    id: 'mock-user-john-doe',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarInitials: 'JD',
    roles: ['super_administrator'],
    roleLabel: 'Super Administrator',
    organizationId: 'mock-org-ai-media-group',
  },
  organization: {
    id: 'mock-org-ai-media-group',
    name: 'AI Media Group',
    slug: 'ai-media-group',
    brandName: 'CACSMS Contents',
    teamName: 'Enterprise Plan',
  },
  permissions: mockPermissions,
}

export type AuditActivityInput = {
  userId?: string
  organizationId?: string
  action: string
  resource: string
  resourceId?: string
  permission?: string
  status: 'success' | 'denied' | 'blocked' | 'expired' | 'fallback'
  ipAddress?: string
  userAgent?: string
  timestamp?: string
}

export const sessionService = {
  async getCurrentSession() {
    return { source: 'mock' as const, data: mockSession }
  },

  async getCurrentUser() {
    const session = await this.getCurrentSession()
    return { source: session.source, data: session.data.user }
  },

  async getCurrentOrganization() {
    const session = await this.getCurrentSession()
    return { source: session.source, data: session.data.organization }
  },

  async getCurrentPermissions() {
    const session = await this.getCurrentSession()
    return {
      source: session.source,
      data: {
        userId: session.data.user.id,
        organizationId: session.data.organization.id,
        roles: session.data.user.roles,
        roleLabel: session.data.user.roleLabel,
        permissions: session.data.permissions,
      },
    }
  },

  async logActivity(input: AuditActivityInput) {
    const payload = {
      ...input,
      userId: input.userId ?? mockSession.user.id,
      organizationId: input.organizationId ?? mockSession.organization.id,
      timestamp: input.timestamp ?? new Date().toISOString(),
    }

    await auditService.log(payload.action, payload.resource, payload)
    return payload
  },
}

