import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const systemRepository = new (class SystemRepository extends BaseRepository {
  constructor() {
    super('system_settings')
  }

  async getSetting(settingKey: string) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('settingKey', sql.NVarChar(150), settingKey)
      .query('SELECT TOP 1 * FROM system_settings WHERE setting_key = @settingKey AND is_deleted = 0')

    return result.recordset[0] ?? null
  }
})()

