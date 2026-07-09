import { coreEngineRepository, type CoreEngineName } from '@cacsms/database'

export function createCoreRepository(engine: CoreEngineName) {
  return {
    engine,
    getTables() {
      return coreEngineRepository.getTables(engine)
    },
    async getSnapshot() {
      return coreEngineRepository.getSnapshot(engine)
    },
  }
}

