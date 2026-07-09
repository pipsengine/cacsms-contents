'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function usePermissions() {
  const { permissions, roles, roleLabel, loading, canAccess } = useAuth()
  return { permissions, roles, roleLabel, loading, canAccess }
}

