export const standardStatuses = [
  'completed',
  'in_progress',
  'pending',
  'failed',
  'blocked',
  'not_required',
  'running',
  'stopped',
  'degraded',
  'operational',
  'scheduled',
  'published',
  'approved',
  'rejected',
  'draft',
] as const

export type StandardStatus = typeof standardStatuses[number]
