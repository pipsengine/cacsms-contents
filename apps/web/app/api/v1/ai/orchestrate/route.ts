import type { NextRequest } from 'next/server'
import { aiOrchestratorController } from '@/core/ai-orchestrator/controllers'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const POST = withErrorHandling((request: NextRequest) => aiOrchestratorController.orchestrate(request))
