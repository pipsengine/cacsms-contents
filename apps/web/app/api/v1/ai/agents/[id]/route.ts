import type { NextRequest } from 'next/server'
import { aiOrchestratorController } from '@/core/ai-orchestrator/controllers'
import { withErrorHandling } from '@/api/middleware/withErrorHandling'

export const GET = withErrorHandling((request: NextRequest, context: { params: Promise<{ id: string }> }) => aiOrchestratorController.getAgent(request, context))
