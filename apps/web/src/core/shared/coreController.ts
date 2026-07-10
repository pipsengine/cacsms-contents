import { apiDatabase } from '@/shared/api/apiResponse'
import type { CoreEngineName } from '@cacsms/database'
import { createCoreService } from './coreService'

export function createCoreController(engine: CoreEngineName) {
  const service = createCoreService(engine)

  return {
    async getSnapshot() {
      const result = await service.getSnapshot()
      return apiDatabase(result, `${engine} engine loaded from database.`)
    },
  }
}
