import { getConnectionPool } from '../connection'
import { getDatabaseConfig } from '../config'

export async function getDatabaseHealth() {
  const started = Date.now()
  const config = getDatabaseConfig()
  const pool = await getConnectionPool()
  const versionResult = await pool.request().query(`
    SELECT TOP 1 version
    FROM schema_migrations
    ORDER BY applied_at DESC
  `)

  return {
    connected: true,
    server: config.server,
    database: config.database,
    latencyMs: Date.now() - started,
    lastCheckedAt: new Date().toISOString(),
    migrationVersion: versionResult.recordset[0]?.version ?? null,
  }
}
