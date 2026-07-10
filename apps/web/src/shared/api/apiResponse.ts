import { NextResponse } from 'next/server'
import { createRequestId } from '@/shared/utils/requestId'

export type ApiResponseStatus = 'success' | 'error'

export type ApiResponseEnvelope<T> = {
  success: boolean
  status: ApiResponseStatus
  message: string
  data: T
  metadata: Record<string, unknown>
  timestamp: string
  requestId: string
}

export function apiResponse<T>({
  data,
  message = 'OK',
  status = 'success',
  metadata = {},
  httpStatus = 200,
}: {
  data: T
  message?: string
  status?: ApiResponseStatus
  metadata?: Record<string, unknown>
  httpStatus?: number
}) {
  const body: ApiResponseEnvelope<T> = {
    success: status !== 'error',
    status,
    message,
    data,
    metadata,
    timestamp: new Date().toISOString(),
    requestId: createRequestId(),
  }

  return NextResponse.json(body, { status: httpStatus })
}

export function apiDatabase<T>(data: T, message = 'Loaded from database.') {
  return apiResponse({
    data,
    message,
    status: 'success',
    metadata: { source: 'database' },
  })
}
