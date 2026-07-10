import sql from 'mssql/msnodesqlv8.js'
import { getDatabaseConfig, hasDatabaseCredentials } from './config'

let poolPromise: Promise<sql.ConnectionPool> | null = null

export function getSqlConfig(databaseOverride?: string): sql.config {
  const config = getDatabaseConfig()

  if (config.trustedConnection) {
    return {
      connectionString: [
        'Driver={ODBC Driver 18 for SQL Server}',
        `Server=${config.port ? `${config.server},${config.port}` : config.server}`,
        `Database=${databaseOverride ?? config.database}`,
        'Trusted_Connection=Yes',
        `Encrypt=${config.encrypt ? 'Yes' : 'No'}`,
        `TrustServerCertificate=${config.trustServerCertificate ? 'Yes' : 'No'}`,
      ].join(';'),
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    } as unknown as sql.config
  }

  return {
    server: config.server,
    port: config.port,
    database: databaseOverride ?? config.database,
    user: config.user,
    password: config.password,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

export async function getConnectionPool() {
  if (!hasDatabaseCredentials()) {
    throw new Error('MSSQL credentials are not configured.')
  }

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getSqlConfig()).connect()
  }

  return poolPromise
}

export async function closeConnectionPool() {
  if (!poolPromise) return
  const pool = await poolPromise
  await pool.close()
  poolPromise = null
}

export { sql }
