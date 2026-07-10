import { apiResponse } from '@/shared/api/apiResponse'
import { AppError } from './AppError'
import { logger } from '@/shared/logging/logger'

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    logger.error({ code: error.code, details: error.details }, error.message)
    return apiResponse({
      data: null,
      message: error.message,
      status: 'error',
      httpStatus: error.statusCode,
      metadata: { code: error.code },
    })
  }

  if (error instanceof Error && error.message.includes('MSSQL credentials are not configured')) {
    logger.error(error, 'Database credentials missing')
    return apiResponse({
      data: null,
      message: 'Live database is not configured. Set MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, and MSSQL_PASSWORD for production data.',
      status: 'error',
      httpStatus: 503,
      metadata: { code: 'DATABASE_NOT_CONFIGURED' },
    })
  }

  logger.error(error, 'Unhandled API error')
  return apiResponse({
    data: null,
    message: 'Internal server error',
    status: 'error',
    httpStatus: 500,
  })
}
