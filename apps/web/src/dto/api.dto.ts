export type PaginatedRequestDto = {
  page?: number
  pageSize?: number
}

export type PaginatedResponseDto<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

