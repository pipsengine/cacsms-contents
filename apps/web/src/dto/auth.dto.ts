export type LoginRequestDto = {
  email: string
  password: string
}

export type LoginResponseDto = {
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
}

export type RefreshTokenRequestDto = {
  refreshToken: string
}

