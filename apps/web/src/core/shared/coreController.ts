import { apiDatabase, apiFallback } from '@/shared/api/apiResponse'
import type { CoreEngineName } from '@cacsms/database'
import { createCoreService } from './coreService'

export function createCoreController(engine: CoreEngineName) {
  const service = createCoreService(engine)

  return {
    async getSnapshot() {
      const result = await service.getSnapshot()
      if (result.source === 'database') {
        return apiDatabase(result, `${engine} engine loaded from database.`)
      }
      return apiFallback(result, `${engine} engine returned fallback data.`)
    },
  }
}

