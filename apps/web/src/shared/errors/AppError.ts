export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = 'APP_ERROR',
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
