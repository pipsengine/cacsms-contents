'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { AccessDenied } from './AccessDenied'

export function PageGuard({ permission, children }: { permission?: string; children: React.ReactNode }) {
  const { canAccess, loading, sessionValid, audit } = useAuth()
  const allowed = canAccess(permission)

  useEffect(() => {
    if (!loading && !sessionValid) {
      void audit({ action: 'session.expired', resource: 'page_guard', permission, status: 'expired' })
    }
  }, [audit, loading, permission, sessionValid])

  useEffect(() => {
    if (!loading && sessionValid && permission) {
      void audit({
        action: allowed ? 'page.accessed' : 'access.denied',
        resource: 'page',
        permission,
        status: allowed ? 'success' : 'denied',
      })
    }
  }, [allowed, audit, loading, permission, sessionValid])

  if (loading) return <div className="page-guard-skeleton" />
  if (!sessionValid) return <div className="page-guard-skeleton" />
  if (!allowed) return <AccessDenied permission={permission} />
  return <>{children}</>
}
