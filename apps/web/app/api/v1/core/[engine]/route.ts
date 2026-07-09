import type { CoreEngineName } from '@cacsms/database'
import { apiResponse } from '@/shared/api/apiResponse'
import { createCoreController } from '@/core/shared/coreController'

const engines = new Set<CoreEngineName>([
  'identity',
  'navigation',
  'permissions',
  'audit',
  'configuration',
  'monitoring',
  'workflow',
  'queue',
  'notifications',
  'events',
  'storage',
  'ai-orchestrator',
])

export async function GET(_request: Request, context: { params: Promise<{ engine: string }> }) {
  const { engine } = await context.params

  if (!engines.has(engine as CoreEngineName)) {
    return apiResponse({
      data: null,
      message: `Unknown core engine: ${engine}`,
      status: 'error',
      httpStatus: 404,
      metadata: { source: 'core' },
    })
  }

  return createCoreController(engine as CoreEngineName).getSnapshot()
}

