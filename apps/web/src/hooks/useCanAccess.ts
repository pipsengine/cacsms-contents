'use client'

import { usePermissions } from './usePermissions'

export function useCanAccess(permission?: string) {
  const { canAccess, loading } = usePermissions()
  return { allowed: canAccess(permission), loading }
}

