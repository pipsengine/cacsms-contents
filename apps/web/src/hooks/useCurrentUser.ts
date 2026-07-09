'use client'

import { useAuth } from '@/components/auth/AuthProvider'

export function useCurrentUser() {
  const { user, loading, sessionValid, refresh } = useAuth()
  return { user, loading, sessionValid, refresh }
}

