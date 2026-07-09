export type AppEnvironment = {
  nodeEnv: string
  jwtSecret: string
  jwtRefreshSecret: string
  redisUrl?: string
  queuePrefix: string
  objectStorageProvider?: 'azure' | 'aws' | 'minio'
}

export const env: AppEnvironment = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'development-only-refresh-change-me',
  redisUrl: process.env.REDIS_URL,
  queuePrefix: process.env.QUEUE_PREFIX ?? 'cacsms',
  objectStorageProvider: process.env.OBJECT_STORAGE_PROVIDER as AppEnvironment['objectStorageProvider'],
}

export function isProduction() {
  return env.nodeEnv === 'production'
}
