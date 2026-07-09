'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function useCurrentOrganization() {
  const { organization, loading, refresh } = useAuth()
  return { organization, loading, refresh }
}

