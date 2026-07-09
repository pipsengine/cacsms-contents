import type { CoreEngineName } from '@cacsms/database'
import { auditService } from '@/audit/auditService'
import { eventBus } from '@/events/eventBus'
import { logger } from '@/shared/logging/logger'
import { createCoreRepository } from './coreRepository'
import type { CoreEngineResult, CoreEngineSnapshot } from './coreTypes'

function fallbackSnapshot(engine: CoreEngineName, tables: string[]): CoreEngineSnapshot {
  return {
    engine,
    tables: tables.map((tableName) => ({
      table_name: tableName,
      total_records: 0,
      active_records: 0,
    })),
  }
}

export function createCoreService(engine: CoreEngineName) {
  const repository = createCoreRepository(engine)

  return {
    engine,
    async getSnapshot(): Promise<CoreEngineResult> {
      try {
        const snapshot = await repository.getSnapshot()
        await eventBus.publish('core.engine.snapshot.loaded', { engine })
        return { source: 'database', generatedAt: new Date().toISOString(), snapshot }
      } catch (error) {
        logger.warn({ error, engine }, 'Core engine snapshot fell back to empty mock data')
        return {
          source: 'mock',
          generatedAt: new Date().toISOString(),
          snapshot: fallbackSnapshot(engine, repository.getTables()),
        }
      }
    },

    async recordWrite(action: string, metadata: Record<string, unknown> = {}) {
      await auditService.log(action, `core.${engine}`, metadata)
      await eventBus.publish(`core.${engine}.${action}`, metadata)
    },
  }
}

