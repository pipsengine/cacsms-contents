import { handleApiError } from '@/shared/errors/errorHandler'

export function withErrorHandling(handler: () => Promise<Response>) {
  return async () => {
    try {
      return await handler()
    } catch (error) {
      return handleApiError(error)
    }
  }
}
