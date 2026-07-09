import type { CoreEngineName } from '@cacsms/database'

export type CoreEngineSnapshot = {
  engine: CoreEngineName
  tables: Array<{
    table_name: string
    total_records: number
    active_records: number
  }>
}

export type CoreEngineResult = {
  source: 'database' | 'mock'
  generatedAt: string
  snapshot: CoreEngineSnapshot
}

