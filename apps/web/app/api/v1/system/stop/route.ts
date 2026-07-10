import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { systemControlController } from '@/core/system-control/controllers/systemControlController'

export const POST = withErrorHandling((request: NextRequest) => systemControlController.stop(request))
