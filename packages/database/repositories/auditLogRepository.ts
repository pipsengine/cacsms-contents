import { getConnectionPool, sql } from '../connection'

export const auditLogRepository = new (class AuditLogRepository {
  async log(action: string, entityName: string, data: Record<string, unknown> = {}) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, data.organizationId ?? null)
      .input('actorUserId', sql.UniqueIdentifier, data.actorUserId ?? null)
      .input('action', sql.NVarChar(120), action)
      .input('entityName', sql.NVarChar(120), entityName)
      .input('entityId', sql.UniqueIdentifier, data.entityId ?? null)
      .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(data))
      .query(`
        DECLARE @resolvedOrg UNIQUEIDENTIFIER = COALESCE(@organizationId, (SELECT TOP 1 id FROM organizations ORDER BY created_at));
        INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_name, entity_id, metadata)
        OUTPUT INSERTED.*
        VALUES (@resolvedOrg, @actorUserId, @action, @entityName, @entityId, @metadata)
      `)

    return result.recordset[0]
  }
})()
