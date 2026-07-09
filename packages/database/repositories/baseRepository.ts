import { getConnectionPool, sql } from '../connection'

export type EntityData = Record<string, string | number | boolean | Date | null | undefined>

const safeTablePattern = /^[a-z_]+$/

export class BaseRepository<T extends EntityData = EntityData> {
  constructor(protected tableName: string) {
    if (!safeTablePattern.test(tableName)) {
      throw new Error(`Unsafe table name: ${tableName}`)
    }
  }

  async findAll() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`SELECT * FROM ${this.tableName} WHERE is_deleted = 0 ORDER BY created_at DESC`)
    return result.recordset as T[]
  }

  async findById(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`SELECT * FROM ${this.tableName} WHERE id = @id AND is_deleted = 0`)
    return (result.recordset[0] ?? null) as T | null
  }

  async create(data: EntityData) {
    const pool = await getConnectionPool()
    const keys = Object.keys(data).filter((key) => data[key] !== undefined)
    const request = pool.request()
    keys.forEach((key) => request.input(key, data[key] as never))
    const columns = keys.join(', ')
    const values = keys.map((key) => `@${key}`).join(', ')
    const result = await request.query(`INSERT INTO ${this.tableName} (${columns}) OUTPUT INSERTED.* VALUES (${values})`)
    return result.recordset[0] as T
  }

  async update(id: string, data: EntityData) {
    const pool = await getConnectionPool()
    const keys = Object.keys(data).filter((key) => data[key] !== undefined)
    const request = pool.request().input('id', sql.UniqueIdentifier, id)
    keys.forEach((key) => request.input(key, data[key] as never))
    const assignments = keys.map((key) => `${key} = @${key}`).join(', ')
    const result = await request.query(`UPDATE ${this.tableName} SET ${assignments}, updated_at = SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id = @id`)
    return result.recordset[0] as T
  }

  async softDelete(id: string) {
    const pool = await getConnectionPool()
    await pool.request().input('id', sql.UniqueIdentifier, id).query(`UPDATE ${this.tableName} SET is_deleted = 1, is_active = 0, updated_at = SYSUTCDATETIME() WHERE id = @id`)
    return { id, deleted: true }
  }
}
