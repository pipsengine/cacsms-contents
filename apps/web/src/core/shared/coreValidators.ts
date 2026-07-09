import { z } from 'zod'

export const coreEngineQuerySchema = z.object({
  organizationId: z.string().uuid().optional(),
})

