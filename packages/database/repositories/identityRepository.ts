import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const identityRepository = new (class IdentityRepository extends BaseRepository {
  constructor() {
    super('users')
  }

  async findUserByEmail(email: string) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('email', sql.NVarChar(320), email)
      .query('SELECT TOP 1 * FROM users WHERE email = @email AND is_deleted = 0')

    return result.recordset[0] ?? null
  }

  async getUserPermissions(userId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('userId', sql.UniqueIdentifier, userId).query(`
      SELECT DISTINCT p.code
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE u.id = @userId AND u.is_deleted = 0
    `)

    return result.recordset
  }
})()

