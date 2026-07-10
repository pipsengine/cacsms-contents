import type { CoreEngineName } from '@cacsms/database'
import { auditService } from '@/audit/auditService'
import { eventBus } from '@/events/eventBus'
import { createCoreRepository } from './coreRepository'
import type { CoreEngineResult } from './coreTypes'

export function createCoreService(engine: CoreEngineName) {
  const repository = createCoreRepository(engine)

  return {
    engine,
    async getSnapshot(): Promise<CoreEngineResult> {
      const snapshot = await repository.getSnapshot()
      await eventBus.publish('core.engine.snapshot.loaded', { engine })
      return { source: 'database', generatedAt: new Date().toISOString(), snapshot }
    },

    async recordWrite(action: string, metadata: Record<string, unknown> = {}) {
      await auditService.log(action, `core.${engine}`, metadata)
      await eventBus.publish(`core.${engine}.${action}`, metadata)
    },
  }
}
