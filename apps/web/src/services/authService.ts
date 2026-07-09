import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { env } from '@/config/env'
import type { Principal } from '@/permissions/rbac'

const encoder = new TextEncoder()

function getAccessSecret() {
  return encoder.encode(env.jwtSecret)
}

function getRefreshSecret() {
  return encoder.encode(env.jwtRefreshSecret)
}

export type AuthTokenPayload = Principal & {
  organizationId?: string
}

export const authService = {
  async hashPassword(password: string) {
    return bcrypt.hash(password, 12)
  },

  async verifyPassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash)
  },

  async issueAccessToken(payload: AuthTokenPayload, expiresIn = '15m') {
    return new SignJWT({ roles: payload.roles, permissions: payload.permissions, organizationId: payload.organizationId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(getAccessSecret())
  },

  async issueRefreshToken(payload: AuthTokenPayload, expiresIn = '30d') {
    return new SignJWT({ organizationId: payload.organizationId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(getRefreshSecret())
  },

  async verifyAccessToken(token: string): Promise<AuthTokenPayload> {
    const { payload } = await jwtVerify(token, getAccessSecret())
    return {
      userId: String(payload.sub),
      roles: Array.isArray(payload.roles) ? payload.roles.map(String) : [],
      permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
      organizationId: typeof payload.organizationId === 'string' ? payload.organizationId : undefined,
    }
  },
}

