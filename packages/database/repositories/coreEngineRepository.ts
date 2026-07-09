import { getConnectionPool, sql } from '../connection'

export type CoreEngineName =
  | 'identity'
  | 'navigation'
  | 'permissions'
  | 'audit'
  | 'configuration'
  | 'monitoring'
  | 'workflow'
  | 'queue'
  | 'notifications'
  | 'events'
  | 'storage'
  | 'ai-orchestrator'

const engineTables: Record<CoreEngineName, string[]> = {
  identity: ['organizations', 'users', 'roles', 'permissions', 'sessions', 'login_history'],
  navigation: ['modules', 'sub_modules', 'pages', 'routes', 'sidebar_sections', 'sidebar_items'],
  permissions: ['permissions', 'role_permissions', 'user_roles', 'page_permissions', 'action_permissions', 'api_permissions'],
  audit: ['audit_logs', 'activity_logs'],
  configuration: ['system_settings', 'feature_flags', 'tenant_settings'],
  monitoring: ['system_services', 'api_endpoints', 'health_checks', 'queue_health', 'implementation_linkage_matrix'],
  workflow: ['workflow_definitions', 'workflow_stages', 'workflow_transitions', 'workflow_approvals', 'workflow_execution_logs'],
  queue: ['job_queues', 'background_jobs', 'workers', 'failed_jobs'],
  notifications: ['notifications', 'notification_templates'],
  events: ['event_logs', 'event_subscriptions'],
  storage: ['storage_providers', 'asset_storage'],
  'ai-orchestrator': ['ai_providers', 'ai_models', 'ai_agents', 'prompts', 'agent_runs', 'ai_usage_logs'],
}

function ensureEngine(engine: CoreEngineName) {
  const tables = engineTables[engine]
  if (!tables) throw new Error(`Unknown core engine: ${engine}`)
  return tables
}

export const coreEngineRepository = {
  getTables(engine: CoreEngineName) {
    return ensureEngine(engine)
  },

  async getSnapshot(engine: CoreEngineName) {
    const tables = ensureEngine(engine)
    const pool = await getConnectionPool()

    const snapshots = await Promise.all(
      tables.map(async (tableName) => {
        const result = await pool.request().query(`
          SELECT
            '${tableName}' AS table_name,
            COUNT(1) AS total_records,
            SUM(CASE WHEN is_active = 1 AND is_deleted = 0 THEN 1 ELSE 0 END) AS active_records
          FROM ${tableName}
        `)
        return result.recordset[0]
      })
    )

    return {
      engine,
      tables: snapshots,
    }
  },

  async logEvent(eventName: string, payload: Record<string, unknown>, organizationId?: string) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, organizationId ?? null)
      .input('eventName', sql.NVarChar(160), eventName)
      .input('payload', sql.NVarChar(sql.MAX), JSON.stringify(payload))
      .query(`
        INSERT INTO event_logs (organization_id, event_name, payload)
        OUTPUT INSERTED.*
        VALUES (@organizationId, @eventName, @payload)
      `)

    return result.recordset[0]
  },
}

