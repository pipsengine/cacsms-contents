import { NextResponse } from 'next/server'

export type ApiSource = 'database'
export type ApiStatus = 'success' | 'error'

export function dashboardResponse(source: ApiSource, data: unknown, status: ApiStatus = 'success') {
  return NextResponse.json({
    source,
    status,
    generatedAt: new Date().toISOString(),
    data,
  })
}

export function logDatabaseFallback(route: string, error: unknown) {
  console.error(`[database-error] ${route}`, error)
}
