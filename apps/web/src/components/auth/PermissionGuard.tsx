'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { AccessDenied } from './AccessDenied'

export function PermissionGuard({
  permission,
  children,
  fallback,
}: {
  permission?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { canAccess, loading, audit } = useAuth()
  const allowed = canAccess(permission)

  useEffect(() => {
    if (!loading && permission) {
      void audit({
        action: allowed ? 'permission.allowed' : 'permission.denied',
        resource: 'permission_guard',
        permission,
        status: allowed ? 'success' : 'denied',
      })
    }
  }, [allowed, audit, loading, permission])

  if (loading) return <div className="auth-skeleton" />
  if (!allowed) return fallback ?? <AccessDenied permission={permission} />
  return <>{children}</>
}

