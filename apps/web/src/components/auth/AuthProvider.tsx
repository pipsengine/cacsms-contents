'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CurrentOrganization, CurrentUser } from '@/services/sessionService'

type PermissionPayload = {
  roles: string[]
  roleLabel: string
  permissions: string[]
}

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
    status: 'success' | 'denied' | 'blocked' | 'expired' | 'fallback'
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readApi<T>(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Failed to load ${url}`)
  const payload = (await response.json()) as { data: T }
  return payload.data
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [organization, setOrganization] = useState<CurrentOrganization | null>(null)
  const [permissionPayload, setPermissionPayload] = useState<PermissionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionValid, setSessionValid] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [currentUser, currentOrganization, currentPermissions] = await Promise.all([
        readApi<CurrentUser>('/api/v1/auth/me'),
        readApi<CurrentOrganization>('/api/v1/organizations/current'),
        readApi<PermissionPayload>('/api/v1/permissions/me'),
      ])
      setUser(currentUser)
      setOrganization(currentOrganization)
      setPermissionPayload(currentPermissions)
      setSessionValid(true)
    } catch {
      setSessionValid(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [refresh])

  const permissions = useMemo(() => permissionPayload?.permissions ?? [], [permissionPayload?.permissions])
  const roles = useMemo(() => permissionPayload?.roles ?? [], [permissionPayload?.roles])
  const roleLabel = permissionPayload?.roleLabel ?? user?.roleLabel ?? 'Unknown Role'

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
            userId: user?.id,
            organizationId: organization?.id,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch {
        // Audit should never break UI flows.
      }
    },
    [organization, user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      roles,
      roleLabel,
      permissions,
      loading,
      sessionValid,
      refresh,
      canAccess,
      audit,
    }),
    [audit, canAccess, loading, organization, permissions, refresh, roleLabel, roles, sessionValid, user]
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
