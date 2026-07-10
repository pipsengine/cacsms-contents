'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import type { CurrentOrganization, CurrentUser } from '@/services/sessionService'

type AuthContextValue = {
  user: CurrentUser | null
  organization: CurrentOrganization | null
  roles: string[]
  roleLabel: string
  permissions: string[]
  loading: boolean
  sessionValid: boolean
  refresh: () => Promise<void>
  canAccess: (permission?: string) => boolean
  audit: (input: {
    action: string
    resource: string
    resourceId?: string
    permission?: string
    status: 'success' | 'denied' | 'blocked' | 'expired' | 'error'
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const buildModeOrganization: CurrentOrganization = {
  id: '9AF6E759-33AD-4BA0-A04E-83660C92E9F5',
  name: 'AI Media Group',
  slug: 'ai-media-group',
  brandName: 'AI Media Group',
  teamName: 'Build Team',
}

const buildModeUser: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Build Mode User',
  email: 'build-mode@cacsms.local',
  avatarInitials: 'BM',
  roles: ['builder', 'super_admin'],
  roleLabel: 'Build Mode',
  organizationId: buildModeOrganization.id,
}

const buildModePermissions = ['*']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const refresh = useCallback(async () => {
    return Promise.resolve()
  }, [])

  const permissions = useMemo(() => buildModePermissions, [])
  const roles = useMemo(() => buildModeUser.roles, [])
  const roleLabel = buildModeUser.roleLabel

  const canAccess = useCallback(
    (permission?: string) => !permission || permissions.includes('*') || permissions.includes(permission),
    [permissions]
  )

  const audit: AuthContextValue['audit'] = useCallback(
    async (input) => {
      try {
        await fetch('/api/v1/audit/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            userId: buildModeUser.id,
            organizationId: buildModeOrganization.id,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch {
        // Audit should never break UI flows.
      }
    },
    []
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: buildModeUser,
      organization: buildModeOrganization,
      roles,
      roleLabel,
      permissions,
      loading: false,
      sessionValid: true,
      refresh,
      canAccess,
      audit,
    }),
    [audit, canAccess, permissions, refresh, roleLabel, roles]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
