type CacheValue = {
  value: unknown
  expiresAt?: number
}

const memoryCache = new Map<string, CacheValue>()

export const cacheClient = {
  async get<T>(key: string): Promise<T | null> {
    const record = memoryCache.get(key)
    if (!record) return null
    if (record.expiresAt && record.expiresAt < Date.now()) {
      memoryCache.delete(key)
      return null
    }
    return record.value as T
  },

  async set<T>(key: string, value: T, ttlSeconds?: number) {
    memoryCache.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  },

  async del(key: string) {
    memoryCache.delete(key)
  },
}
