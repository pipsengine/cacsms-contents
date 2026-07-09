import type { NextRequest } from 'next/server'
import { authService } from '@/services/authService'
import type { Principal } from '@/permissions/rbac'

export async function getPrincipalFromRequest(request: NextRequest): Promise<Principal | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null

  if (!token) return null

  try {
    return await authService.verifyAccessToken(token)
  } catch {
    return null
  }
}

