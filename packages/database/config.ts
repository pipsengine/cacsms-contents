export type DatabaseConfig = {
  server: string
  port: number
  database: string
  user: string
  password: string
  encrypt: boolean
  trustServerCertificate: boolean
}

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true'
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    server: process.env.MSSQL_SERVER ?? 'localhost',
    port: Number(process.env.MSSQL_PORT ?? 1433),
    database: process.env.MSSQL_DATABASE ?? 'db_cacsms-contents',
    user: process.env.MSSQL_USER ?? '',
    password: process.env.MSSQL_PASSWORD ?? '',
    encrypt: bool(process.env.MSSQL_ENCRYPT, false),
    trustServerCertificate: bool(process.env.MSSQL_TRUST_SERVER_CERTIFICATE, true),
  }
}

export function hasDatabaseCredentials() {
  const config = getDatabaseConfig()
  return Boolean(config.server && config.database && config.user && config.password)
}
