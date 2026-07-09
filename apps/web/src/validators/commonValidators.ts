import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
})

export function parseWithSchema<T>(schema: z.ZodSchema<T>, value: unknown) {
  return schema.parse(value)
}

