import { auditService } from '@/audit/auditService'
import { eventBus } from '@/events/eventBus'
import { workflowQueueService } from '@/core/queue/services/workflowQueueService'
import { aiOrchestratorRepository } from '../repositories'
import type { AgentInput, AgentManifest, AgentResult, ModelRoute, OrchestrateInput, OrchestrationResult, StageAgentMapping } from '../types'

function countTokens(value: unknown) {
  return Math.ceil(JSON.stringify(value ?? '').length / 4)
}

function outputTypeFor(agent: AgentManifest) {
  const schemaOutputType = typeof agent.outputSchema.outputType === 'string' ? agent.outputSchema.outputType : undefined
  return schemaOutputType ?? agent.capabilities[0]?.outputType ?? `${agent.domain}_output`
}

export const agentRegistry = {
  list() {
    return aiOrchestratorRepository.listAgents()
  },
  getById(id: string) {
    return aiOrchestratorRepository.getAgentById(id)
  },
  getByCode(code: string) {
    return aiOrchestratorRepository.getAgentByCode(code)
  },
}

export const modelRouter = {
  route() {
    return aiOrchestratorRepository.selectModel()
  },
}

export const agentOutputValidator = {
  validate(agent: AgentManifest, result: AgentResult) {
    const errors: string[] = []
    const requiredFields = Array.isArray(agent.validationRules.requiredFields) ? agent.validationRules.requiredFields.map(String) : ['summary', 'items']
    for (const field of requiredFields) {
      if (!(field in result.output)) errors.push(`Missing required output field: ${field}`)
    }
    const minimumConfidence = Number(agent.validationRules.minimumConfidence ?? 0.7)
    if (result.confidence < minimumConfidence) errors.push(`Confidence ${result.confidence} is below ${minimumConfidence}`)
    return { valid: errors.length === 0, errors }
  },
}

export const localStructuredProviderAdapter = {
  async healthCheck() {
    return { status: 'healthy', latencyMs: 50 }
  },

  async estimateCost() {
    return 0
  },

  async execute(agent: AgentManifest, input: AgentInput, route: ModelRoute): Promise<AgentResult> {
    const started = Date.now()
    const outputType = outputTypeFor(agent)
    const items = [
      {
        title: `${agent.name} result`,
        detail: `Generated for ${input.objective}`,
        workflowInstanceId: input.workflowInstanceId,
        workflowStageId: input.workflowStageId,
      },
    ]
    const output = {
      summary: `${agent.name} completed ${outputType} for ${input.objective}.`,
      items,
      recommendations: [`Proceed to the next workflow checkpoint for ${input.agentCode}.`],
      provenance: {
        provider: route.providerCode,
        model: route.modelCode,
        correlationId: input.correlationId,
      },
    }
    const inputTokens = countTokens(input)
    const outputTokens = countTokens(output)
    return {
      success: true,
      status: 'completed',
      agentCode: agent.code,
      outputType,
      output,
      confidence: 0.91,
      warnings: agent.approvalRequired ? ['Approval gate bypassed by autonomous production mode.'] : [],
      citations: input.sourceReferences.map((source) => ({ title: source.title, citationReference: source.citationReference })),
      assets: [],
      usage: {
        provider: route.providerCode,
        model: route.modelCode,
        inputTokens,
        outputTokens,
        latencyMs: Date.now() - started,
        estimatedCost: 0,
        retries: 0,
        outcome: 'completed',
      },
      metadata: {
        source: 'provider',
        providerCategory: 'local_structured',
        sourceReferences: input.sourceReferences,
      },
      completedAt: new Date().toISOString(),
    }
  },

  async stream() {
    return null
  },

  async cancel() {
    return { cancelled: true }
  },

  normalizeError(error: unknown) {
    return error instanceof Error ? error : new Error('Provider execution failed')
  },

  mapUsage(result: AgentResult) {
    return result.usage
  },
}

export const agentPlanner = {
  async plan(input: OrchestrateInput, mappings: StageAgentMapping[]) {
    const selectedMappings = input.agentCodes?.length
      ? mappings.filter((mapping) => input.agentCodes?.includes(mapping.agentCode))
      : mappings
    if (!selectedMappings.length) throw new Error('No AI agents are mapped for this workflow stage.')
    return aiOrchestratorRepository.createPlan(input, selectedMappings)
  },
}

export const agentExecutor = {
  async execute(input: AgentInput, planId?: string | null) {
    const agent = await agentRegistry.getByCode(input.agentCode)
    const route = await modelRouter.route()
    const run = await aiOrchestratorRepository.createRun({
      organizationId: input.organizationId,
      agent,
      planId,
      workflowInstanceId: input.workflowInstanceId,
      workflowStageId: input.workflowStageId,
      taskId: input.taskId,
      providerId: route.providerId,
      modelId: route.modelId,
      correlationId: input.correlationId,
    })

    await workflowQueueService.enqueue('ai-agent-execution', { runId: run.id, agentCode: agent.code, correlationId: input.correlationId })
    await aiOrchestratorRepository.updateRun(run.id, { status: 'running', progressPercent: 10 })
    await aiOrchestratorRepository.addRunLog(run.id, 'Agent execution started', { agentCode: agent.code, model: route.modelCode })
    await aiOrchestratorRepository.recordEvent({ organizationId: input.organizationId, planId, runId: run.id, eventName: 'ai.agent.started', payload: { agentCode: agent.code }, correlationId: input.correlationId })
    await eventBus.publish('ai.agent.started', { runId: run.id, agentCode: agent.code }, input.correlationId)

    try {
      const result = await localStructuredProviderAdapter.execute(agent, input, route)
      const validation = agentOutputValidator.validate(agent, result)
      if (!validation.valid) {
        result.success = false
        result.status = 'failed'
        result.warnings = [...result.warnings, ...validation.errors]
      }

      const finalStatus = result.status
      await aiOrchestratorRepository.updateRun(run.id, { status: finalStatus, progressPercent: result.success ? 100 : 0, result })
      const output = await aiOrchestratorRepository.persistOutput({ run, result, providerId: route.providerId, modelId: route.modelId })
      await aiOrchestratorRepository.recordUsage(run, route, result)
      await aiOrchestratorRepository.addRunLog(run.id, result.success ? 'Agent output persisted and versioned' : 'Agent output failed validation', { outputId: output.id, validation })
      await aiOrchestratorRepository.recordEvent({ organizationId: input.organizationId, planId, runId: run.id, eventName: result.success ? 'ai.agent.completed' : 'ai.agent.validation.failed', payload: { agentCode: agent.code, outputId: output.id, validation }, correlationId: input.correlationId })
      await eventBus.publish(result.success ? 'ai.agent.completed' : 'ai.agent.validation.failed', { runId: run.id, agentCode: agent.code, outputId: output.id }, input.correlationId)
      await auditService.log('ai agent execution', 'ai_agent_runs', { runId: run.id, agentCode: agent.code, workflowInstanceId: input.workflowInstanceId, workflowStageId: input.workflowStageId })

      return { run: await aiOrchestratorRepository.getRun(run.id), output, result }
    } catch (error) {
      const normalized = localStructuredProviderAdapter.normalizeError(error)
      await aiOrchestratorRepository.updateRun(run.id, { status: 'failed', progressPercent: 0, error: normalized })
      await aiOrchestratorRepository.addRunLog(run.id, normalized.message, {}, 'error')
      await aiOrchestratorRepository.recordEvent({ organizationId: input.organizationId, planId, runId: run.id, eventName: 'ai.agent.failed', payload: { agentCode: agent.code, error: normalized.message }, correlationId: input.correlationId })
      throw normalized
    }
  },
}

export const agentResultAggregator = {
  aggregate(results: Awaited<ReturnType<typeof agentExecutor.execute>>[]) {
    return {
      outputCount: results.length,
      confidence: results.length ? results.reduce((sum, item) => sum + item.result.confidence, 0) / results.length : 0,
      outputs: results.map((item) => item.output),
      warnings: results.flatMap((item) => item.result.warnings),
    }
  },
}

export const aiOrchestratorService = {
  listAgents: agentRegistry.list,
  getAgent: agentRegistry.getById,
  listRuns: aiOrchestratorRepository.listRuns,
  getRun: aiOrchestratorRepository.getRun,
  listRunLogs: aiOrchestratorRepository.listRunLogs,
  listRunOutputs: aiOrchestratorRepository.listRunOutputs,
  listProviders: aiOrchestratorRepository.listProviders,
  listModels: aiOrchestratorRepository.listModels,
  health: aiOrchestratorRepository.health,
  usage: aiOrchestratorRepository.usage,
  costs: aiOrchestratorRepository.costs,

  async orchestrate(input: OrchestrateInput): Promise<OrchestrationResult> {
    const correlationId = input.correlationId ?? crypto.randomUUID()
    const normalized: OrchestrateInput = { ...input, correlationId }
    const mappings = input.workflowStageId ? await aiOrchestratorRepository.listMappingsForStage(input.workflowStageId) : await this.resolveMappingsFromAgentCodes(input.agentCodes ?? [])
    const plan = await agentPlanner.plan(normalized, mappings)
    const started = Date.now()
    await aiOrchestratorRepository.updatePlanStatus(plan.id, 'running')
    await aiOrchestratorRepository.recordEvent({ organizationId: input.organizationId, planId: plan.id, eventName: 'ai.plan.started', payload: { objective: input.objective }, correlationId })
    await eventBus.publish('ai.plan.started', { planId: plan.id, objective: input.objective }, correlationId)

    const groups = new Map<number, StageAgentMapping[]>()
    for (const mapping of mappings) groups.set(mapping.executionOrder, [...(groups.get(mapping.executionOrder) ?? []), mapping])

    const executionResults: Awaited<ReturnType<typeof agentExecutor.execute>>[] = []
    for (const [, group] of [...groups.entries()].sort(([a], [b]) => a - b)) {
      const runGroup = group.some((mapping) => mapping.executionMode === 'parallel')
        ? await Promise.all(group.map((mapping) => this.executeMapping(mapping, normalized, plan.id)))
        : []
      if (runGroup.length) {
        executionResults.push(...runGroup)
      } else {
        for (const mapping of group) executionResults.push(await this.executeMapping(mapping, normalized, plan.id))
      }
    }

    const aggregate = agentResultAggregator.aggregate(executionResults)
    const status = executionResults.some((item) => item.result.status === 'failed')
      ? 'failed'
      : executionResults.some((item) => item.result.status === 'approval_required')
        ? 'approval_required'
        : 'completed'
    await aiOrchestratorRepository.updatePlanStatus(plan.id, status, executionResults.reduce((sum, item) => sum + item.result.usage.estimatedCost, 0), Date.now() - started)
    await aiOrchestratorRepository.recordEvent({ organizationId: input.organizationId, planId: plan.id, eventName: status === 'completed' ? 'ai.plan.completed' : 'ai.plan.failed', payload: aggregate, correlationId })
    await eventBus.publish(status === 'completed' ? 'ai.plan.completed' : 'ai.plan.failed', { planId: plan.id, aggregate }, correlationId)

    return {
      plan: await aiOrchestratorRepository.getPlan(plan.id),
      runs: executionResults.map((item) => item.run),
      outputs: executionResults.map((item) => item.output),
      status,
    }
  },

  async executeMapping(mapping: StageAgentMapping, input: OrchestrateInput, planId: string) {
    return agentExecutor.execute({
      taskId: crypto.randomUUID(),
      workflowInstanceId: input.workflowInstanceId,
      workflowStageId: input.workflowStageId || mapping.workflowStageId || null,
      organizationId: input.organizationId,
      brandId: typeof input.context?.brandId === 'string' ? input.context.brandId : null,
      userId: input.requestedBy ?? null,
      agentCode: mapping.agentCode,
      objective: input.objective,
      context: input.context ?? {},
      constraints: input.constraints ?? {},
      sourceReferences: [],
      outputRequirements: { executionMode: mapping.executionMode },
      correlationId: input.correlationId ?? crypto.randomUUID(),
    }, planId)
  },

  async resolveMappingsFromAgentCodes(agentCodes: string[]): Promise<StageAgentMapping[]> {
    const mappings: StageAgentMapping[] = []
    for (const [index, code] of agentCodes.entries()) {
      const agent = await agentRegistry.getByCode(code)
      mappings.push({
        id: crypto.randomUUID(),
        workflowDefinitionId: '',
        workflowStageId: '',
        agentId: agent.id,
        agentCode: agent.code,
        agentName: agent.name,
        domain: agent.domain,
        executionOrder: index + 1,
        executionMode: 'sequential',
        required: true,
        timeoutSeconds: agent.timeoutSeconds,
        maxRetries: agent.maxRetries,
      })
    }
    return mappings
  },

  async runAgent(agentCode: string, input: Omit<OrchestrateInput, 'agentCodes'>) {
    return this.orchestrate({ ...input, agentCodes: [agentCode] })
  },

  async transitionRun(id: string, action: 'cancel' | 'retry' | 'rerun' | 'approve' | 'reject' | 'request-changes') {
    if (['approve', 'reject', 'request-changes'].includes(action)) {
      throw new Error('Manual AI approval transitions are disabled. AI runs complete autonomously inside the workflow engine.')
    }
    const statusByAction = {
      cancel: 'cancelled',
      retry: 'queued',
      rerun: 'queued',
      approve: 'completed',
      reject: 'failed',
      'request-changes': 'approval_required',
    } as const
    await aiOrchestratorRepository.updateRun(id, { status: statusByAction[action], progressPercent: action === 'approve' ? 100 : undefined })
    await aiOrchestratorRepository.addRunLog(id, `Run ${action} requested`, { action })
    await auditService.log(`ai run ${action}`, 'ai_agent_runs', { runId: id })
    return aiOrchestratorRepository.getRun(id)
  },
}
