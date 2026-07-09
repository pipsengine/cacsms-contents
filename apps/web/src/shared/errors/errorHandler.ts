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

  logger.error(error, 'Unhandled API error')
  return apiResponse({
    data: null,
    message: 'Internal server error',
    status: 'error',
    httpStatus: 500,
  })
}
