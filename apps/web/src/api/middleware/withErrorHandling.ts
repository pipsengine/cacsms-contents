import { handleApiError } from '@/shared/errors/errorHandler'

export function withErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<Response>) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
