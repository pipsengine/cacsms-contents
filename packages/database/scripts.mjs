import fs from 'node:fs/promises'
import path from 'node:path'
import sql from 'mssql'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

async function loadDotEnv() {
  const envPath = path.join(root, '.env')
  try {
    const content = await fs.readFile(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const separator = trimmed.indexOf('=')
      if (separator === -1) continue
      const key = trimmed.slice(0, separator).trim()
      const value = trimmed.slice(separator + 1).trim()
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    // .env is optional; CI and production can provide environment variables directly.
  }
}

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback
  return value.toLowerCase() === 'true'
}

function getDatabaseConfig() {
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

function getSqlConfig(databaseOverride) {
  const config = getDatabaseConfig()
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
  }
}

async function runSqlFiles(folder, databaseOverride) {
  const dir = path.join(root, 'database', folder)
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.sql')).sort()
  const pool = await sql.connect(getSqlConfig(databaseOverride))
  try {
    for (const file of files) {
      const script = await fs.readFile(path.join(dir, file), 'utf8')
      console.log(`Running ${folder}/${file}`)
      await pool.request().batch(script)
    }
  } finally {
    await pool.close()
  }
}

export async function createDatabase() {
  const config = getDatabaseConfig()
  const pool = await sql.connect(getSqlConfig('master'))
  try {
    await pool.request().input('database', sql.NVarChar, config.database).query(`
      IF DB_ID(@database) IS NULL
      BEGIN
        DECLARE @sql NVARCHAR(MAX) = N'CREATE DATABASE ' + QUOTENAME(@database);
        EXEC (@sql);
      END
    `)
    console.log(`Database ready: ${config.database}`)
  } finally {
    await pool.close()
  }
}

export async function migrate() {
  await runSqlFiles('migrations')
}

export async function seed() {
  await runSqlFiles('seeds')
}

export async function reset() {
  const config = getDatabaseConfig()
  const pool = await sql.connect(getSqlConfig('master'))
  try {
    await pool.request().input('database', sql.NVarChar, config.database).query(`
      IF DB_ID(@database) IS NOT NULL
      BEGIN
        DECLARE @sql NVARCHAR(MAX) =
          N'ALTER DATABASE ' + QUOTENAME(@database) + N' SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE ' + QUOTENAME(@database);
        EXEC (@sql);
      END
    `)
  } finally {
    await pool.close()
  }
  await createDatabase()
  await migrate()
  await seed()
}

export async function status() {
  const config = getDatabaseConfig()
  const pool = await sql.connect(getSqlConfig())
  try {
    const result = await pool.request().query('SELECT TOP 10 version, applied_at FROM schema_migrations ORDER BY applied_at DESC')
    console.table(result.recordset)
    console.log(`Connected to ${config.server}/${config.database}`)
  } finally {
    await pool.close()
  }
}

const command = process.argv[2]
const actions = { create: createDatabase, migrate, seed, reset, status }

if (command && actions[command]) {
  loadDotEnv().then(() => actions[command]()).catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
