import { NextResponse } from 'next/server'

export type ApiSource = 'database' | 'mock'
export type ApiStatus = 'success' | 'fallback' | 'error'

export function dashboardResponse(source: ApiSource, data: unknown, status: ApiStatus = 'success') {
  return NextResponse.json({
    source,
    status,
    generatedAt: new Date().toISOString(),
    data,
  })
}

export function logDatabaseFallback(route: string, error: unknown) {
  console.error(`[database-fallback] ${route}`, error)
}
