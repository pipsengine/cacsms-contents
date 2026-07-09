import { BaseRepository } from './baseRepository'
import { getConnectionPool, sql } from '../connection'

export const navigationRepository = new (class NavigationRepository extends BaseRepository {
  constructor() {
    super('sidebar_items')
  }

  async getNavigationTree(permissionCodes: string[] = []) {
    const pool = await getConnectionPool()
    const request = pool.request().input('hasWildcard', sql.Bit, permissionCodes.includes('*') ? 1 : 0)
    permissionCodes.forEach((permission, index) => {
      request.input(`permission${index}`, sql.NVarChar(120), permission)
    })
    const permissionValues = permissionCodes.map((_, index) => `@permission${index}`).join(', ')
    const permissionFilter = permissionCodes.length
      ? `AND (si.required_permission IS NULL OR @hasWildcard = 1 OR si.required_permission IN (${permissionValues}))`
      : ''

    const result = await request.query(`
      SELECT CONVERT(NVARCHAR(36), ss.id) AS section_id,
             ss.title AS section_title,
             ss.display_order AS section_order,
             CONVERT(NVARCHAR(36), si.id) AS item_id,
             si.title,
             si.href,
             si.icon,
             si.display_order,
             si.required_permission
      FROM sidebar_sections ss
      LEFT JOIN sidebar_items si ON si.sidebar_section_id = ss.id AND si.is_deleted = 0
        ${permissionFilter}
      WHERE ss.is_deleted = 0
      ORDER BY ss.display_order, si.display_order
    `)
    return result.recordset
  }
})()
