import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { aiOrchestratorService } from '../services'
import type { OrchestrateInput } from '../types'

async function readBody(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

function orchestrationInput(body: Record<string, unknown>): OrchestrateInput {
  if (!body.organizationId || !body.objective) {
    throw new Error('organizationId and objective are required for AI orchestration.')
  }
  return {
    organizationId: String(body.organizationId),
    workflowInstanceId: body.workflowInstanceId ? String(body.workflowInstanceId) : null,
    workflowStageId: body.workflowStageId ? String(body.workflowStageId) : null,
    objective: String(body.objective),
    context: typeof body.context === 'object' && body.context ? (body.context as Record<string, unknown>) : {},
    constraints: typeof body.constraints === 'object' && body.constraints ? (body.constraints as Record<string, unknown>) : {},
    requestedBy: body.requestedBy ? String(body.requestedBy) : 'api',
    agentCodes: Array.isArray(body.agentCodes) ? body.agentCodes.map(String) : undefined,
    executionMode: body.executionMode ? (String(body.executionMode) as OrchestrateInput['executionMode']) : undefined,
    correlationId: body.correlationId ? String(body.correlationId) : undefined,
  }
}

export const aiOrchestratorController = {
  async listAgents() {
    return apiDatabase(await aiOrchestratorService.listAgents(), 'AI agents loaded.')
  },

  async getAgent(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await aiOrchestratorService.getAgent(id), 'AI agent loaded.')
  },

  async listAgentRuns(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const runs = (await aiOrchestratorService.listRuns()).filter((run) => run.agentId === id)
    return apiDatabase(runs, 'AI agent runs loaded.')
  },

  async listRuns() {
    return apiDatabase(await aiOrchestratorService.listRuns(), 'AI runs loaded.')
  },

  async getRun(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await aiOrchestratorService.getRun(id), 'AI run loaded.')
  },

  async runLogs(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await aiOrchestratorService.listRunLogs(id), 'AI run logs loaded.')
  },

  async runOutputs(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await aiOrchestratorService.listRunOutputs(id), 'AI run outputs loaded.')
  },

  async providers() {
    return apiDatabase(await aiOrchestratorService.listProviders(), 'AI providers loaded.')
  },

  async models() {
    return apiDatabase(await aiOrchestratorService.listModels(), 'AI models loaded.')
  },

  async health() {
    return apiDatabase(await aiOrchestratorService.health(), 'AI health loaded.')
  },

  async usage() {
    return apiDatabase(await aiOrchestratorService.usage(), 'AI usage loaded.')
  },

  async costs() {
    return apiDatabase(await aiOrchestratorService.costs(), 'AI costs loaded.')
  },

  async orchestrate(request: NextRequest) {
    const result = await aiOrchestratorService.orchestrate(orchestrationInput(await readBody(request)))
    return apiResponse({ data: result, message: 'AI orchestration completed.', httpStatus: 201, metadata: { source: 'database' } })
  },

  async runAgent(request: NextRequest, context: { params: Promise<{ agentCode: string }> }) {
    const { agentCode } = await context.params
    const body = await readBody(request)
    const result = await aiOrchestratorService.runAgent(agentCode, orchestrationInput({ ...body, agentCodes: [agentCode] }))
    return apiResponse({ data: result, message: 'AI agent run completed.', httpStatus: 201, metadata: { source: 'database' } })
  },

  async transitionRun(_request: NextRequest, context: { params: Promise<{ id: string; action?: string }> }, action: 'cancel' | 'retry' | 'rerun' | 'approve' | 'reject' | 'request-changes') {
    const { id } = await context.params
    if (['approve', 'reject', 'request-changes'].includes(action)) {
      return apiResponse({
        data: null,
        status: 'error',
        httpStatus: 405,
        message: 'Manual AI approval transitions are disabled. AI runs complete autonomously inside the workflow engine.',
      })
    }
    return apiDatabase(await aiOrchestratorService.transitionRun(id, action), `AI run ${action} recorded.`)
  },
}
