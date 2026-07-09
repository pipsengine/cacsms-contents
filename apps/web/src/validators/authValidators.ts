import { z } from 'zod'

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(20),
})

export type LoginRequestInput = z.infer<typeof loginRequestSchema>
export type RefreshTokenRequestInput = z.infer<typeof refreshTokenRequestSchema>

