import { getConnectionPool, sql } from '@cacsms/database'
import type { AgentManifest, AgentResult, AgentRunRecord, ExecutionPlan, ModelRoute, OrchestrateInput, StageAgentMapping } from '../types'

function json<T>(value: unknown, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(String(value)) as T
  } catch {
    return fallback
  }
}

function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : new Date().toISOString()
}

function mapRun(row: Record<string, unknown>): AgentRunRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    agentId: String(row.agent_id),
    agentCode: String(row.agent_code ?? row.code),
    agentName: String(row.agent_name ?? row.name),
    agentVersion: Number(row.agent_version ?? 1),
    workflowInstanceId: row.workflow_instance_id ? String(row.workflow_instance_id) : null,
    workflowStageId: row.workflow_stage_id ? String(row.workflow_stage_id) : null,
    taskId: String(row.task_id),
    status: row.status as AgentRunRecord['status'],
    progressPercent: Number(row.progress_percent ?? 0),
    providerId: row.provider_id ? String(row.provider_id) : null,
    modelId: row.model_id ? String(row.model_id) : null,
    outputReference: row.output_reference ? String(row.output_reference) : null,
    confidenceScore: row.confidence_score === null || row.confidence_score === undefined ? null : Number(row.confidence_score),
    correlationId: String(row.correlation_id),
    createdAt: iso(row.created_at),
  }
}

export const aiOrchestratorRepository = {
  async listAgents() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT a.*, v.manifest_json, v.output_schema_json, v.validation_rules_json
      FROM ai_agents a
      OUTER APPLY (
        SELECT TOP 1 * FROM ai_agent_versions v
        WHERE v.agent_id = a.id AND v.version = a.current_version
      ) v
      ORDER BY a.domain, a.name
    `)
    return result.recordset.map((row) => this.mapAgentManifest(row))
  },

  async getAgentById(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT a.*, v.manifest_json, v.output_schema_json, v.validation_rules_json
      FROM ai_agents a
      OUTER APPLY (SELECT TOP 1 * FROM ai_agent_versions v WHERE v.agent_id = a.id AND v.version = a.current_version) v
      WHERE a.id = @id
    `)
    if (!result.recordset[0]) throw new Error(`AI agent not found: ${id}`)
    return this.mapAgentManifest(result.recordset[0])
  },

  async getAgentByCode(code: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('code', sql.NVarChar, code).query(`
      SELECT TOP 1 a.*, v.manifest_json, v.output_schema_json, v.validation_rules_json
      FROM ai_agents a
      OUTER APPLY (SELECT TOP 1 * FROM ai_agent_versions v WHERE v.agent_id = a.id AND v.version = a.current_version) v
      WHERE a.code = @code AND a.status = 'active'
      ORDER BY CASE WHEN a.organization_id IS NULL THEN 1 ELSE 0 END
    `)
    if (!result.recordset[0]) throw new Error(`AI agent not found in database: ${code}`)
    return this.mapAgentManifest(result.recordset[0])
  },

  mapAgentManifest(row: Record<string, unknown>): AgentManifest {
    const manifest = json<Record<string, unknown>>(row.manifest_json, {})
    const capabilities = json<AgentManifest['capabilities']>(manifest.capabilities, [])
    const tags = json<string[]>(row.tags, [])
    return {
      id: String(row.id),
      code: String(row.code),
      name: String(row.name),
      description: String(row.description ?? ''),
      domain: String(row.domain),
      version: Number(row.current_version ?? 1),
      status: row.status as AgentManifest['status'],
      capabilities,
      supportedInputTypes: json<string[]>(manifest.supportedInputTypes, ['workflow_stage']),
      supportedOutputTypes: json<string[]>(manifest.supportedOutputTypes, []),
      requiredTools: json<string[]>(manifest.requiredTools, []),
      preferredModels: json<string[]>(manifest.preferredModels, ['local-structured-v1']),
      fallbackModels: json<string[]>(manifest.fallbackModels, []),
      requiredPermissions: json<string[]>(manifest.requiredPermissions, ['ai.agents.execute']),
      timeoutSeconds: Number(row.timeout_seconds ?? manifest.timeoutSeconds ?? 120),
      maxRetries: Number(row.max_retries ?? manifest.maxRetries ?? 2),
      costLimit: Number(row.cost_limit ?? 0),
      concurrencyLimit: Number(row.concurrency_limit ?? 5),
      approvalRequired: Boolean(row.approval_required),
      outputSchema: json<Record<string, unknown>>(row.output_schema_json, {}),
      validationRules: json<Record<string, unknown>>(row.validation_rules_json, {}),
      owner: row.owner ? String(row.owner) : null,
      tags,
    }
  },

  async listMappingsForStage(workflowStageId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('workflowStageId', sql.UniqueIdentifier, workflowStageId).query(`
      SELECT m.*, a.code AS agent_code, a.name AS agent_name, a.domain
      FROM workflow_stage_agent_mappings m
      JOIN ai_agents a ON a.id = m.agent_id
      WHERE m.workflow_stage_id = @workflowStageId AND a.status = 'active'
      ORDER BY m.execution_order, a.name
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      workflowDefinitionId: String(row.workflow_definition_id),
      workflowStageId: String(row.workflow_stage_id),
      agentId: String(row.agent_id),
      agentCode: String(row.agent_code),
      agentName: String(row.agent_name),
      domain: String(row.domain),
      executionOrder: Number(row.execution_order),
      executionMode: row.execution_mode as StageAgentMapping['executionMode'],
      required: Boolean(row.required),
      timeoutSeconds: Number(row.timeout_seconds ?? 120),
      maxRetries: Number(row.max_retries ?? 2),
    })) satisfies StageAgentMapping[]
  },

  async createPlan(input: OrchestrateInput, mappings: StageAgentMapping[]) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, input.organizationId)
      .input('workflowInstanceId', sql.UniqueIdentifier, input.workflowInstanceId ?? null)
      .input('objective', sql.NVarChar, input.objective)
      .input('createdBy', sql.NVarChar, input.requestedBy ?? null)
      .input('correlationId', sql.NVarChar, input.correlationId ?? crypto.randomUUID())
      .query(`
        INSERT INTO ai_execution_plans (organization_id, workflow_instance_id, objective, status, estimated_cost, estimated_duration_ms, created_by, correlation_id)
        OUTPUT INSERTED.id, INSERTED.organization_id, INSERTED.workflow_instance_id, INSERTED.objective, INSERTED.status, INSERTED.correlation_id
        VALUES (@organizationId, @workflowInstanceId, @objective, 'planned', 0, ${Math.max(mappings.length, 1) * 250}, @createdBy, @correlationId)
      `)
    const planId = String(result.recordset[0].id)
    for (const mapping of mappings) {
      await pool
        .request()
        .input('planId', sql.UniqueIdentifier, planId)
        .input('agentId', sql.UniqueIdentifier, mapping.agentId)
        .input('workflowStageId', sql.UniqueIdentifier, mapping.workflowStageId || null)
        .input('executionOrder', sql.Int, mapping.executionOrder)
        .input('executionMode', sql.NVarChar, mapping.executionMode)
        .query(`
          INSERT INTO ai_execution_plan_steps (plan_id, agent_id, workflow_stage_id, execution_order, execution_mode, status)
          VALUES (@planId, @agentId, @workflowStageId, @executionOrder, @executionMode, 'planned')
        `)
    }
    return this.getPlan(planId)
  },

  async getPlan(planId: string): Promise<ExecutionPlan> {
    const pool = await getConnectionPool()
    const plan = await pool.request().input('planId', sql.UniqueIdentifier, planId).query('SELECT TOP 1 * FROM ai_execution_plans WHERE id = @planId')
    if (!plan.recordset[0]) throw new Error(`AI execution plan not found: ${planId}`)
    const steps = await pool.request().input('planId', sql.UniqueIdentifier, planId).query(`
      SELECT s.*, a.code AS agent_code
      FROM ai_execution_plan_steps s
      JOIN ai_agents a ON a.id = s.agent_id
      WHERE s.plan_id = @planId
      ORDER BY s.execution_order
    `)
    const row = plan.recordset[0]
    return {
      id: String(row.id),
      organizationId: String(row.organization_id),
      workflowInstanceId: row.workflow_instance_id ? String(row.workflow_instance_id) : null,
      objective: String(row.objective),
      status: String(row.status),
      correlationId: String(row.correlation_id),
      steps: steps.recordset.map((step) => ({
        id: String(step.id),
        agentId: String(step.agent_id),
        agentCode: String(step.agent_code),
        workflowStageId: step.workflow_stage_id ? String(step.workflow_stage_id) : null,
        executionOrder: Number(step.execution_order),
        executionMode: step.execution_mode,
        status: String(step.status),
      })),
    }
  },

  async updatePlanStatus(planId: string, status: string, actualCost = 0, actualDurationMs = 0) {
    const pool = await getConnectionPool()
    await pool.request().input('planId', sql.UniqueIdentifier, planId).input('status', sql.NVarChar, status).input('actualCost', sql.Decimal(18, 6), actualCost).input('actualDurationMs', sql.Int, actualDurationMs).query(`
      UPDATE ai_execution_plans
      SET status = @status, actual_cost = @actualCost, actual_duration_ms = @actualDurationMs, updated_at = SYSUTCDATETIME()
      WHERE id = @planId
    `)
  },

  async selectModel(): Promise<ModelRoute> {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT TOP 1 p.id AS provider_id, p.code AS provider_code, p.name AS provider_name, m.id AS model_id, m.code AS model_code, m.name AS model_name
      FROM ai_models m
      JOIN ai_providers p ON p.id = m.provider_id
      LEFT JOIN ai_model_health h ON h.model_id = m.id
      WHERE p.status = 'enabled' AND m.status = 'enabled'
      ORDER BY COALESCE(h.success_rate, 0) DESC, COALESCE(h.avg_latency_ms, 999999) ASC
    `)
    if (!result.recordset[0]) {
      throw new Error('AI provider unavailable. Configure a provider or enable development fallback.')
    }
    const row = result.recordset[0]
    return {
      providerId: String(row.provider_id),
      providerCode: String(row.provider_code),
      providerName: String(row.provider_name),
      modelId: String(row.model_id),
      modelCode: String(row.model_code),
      modelName: String(row.model_name),
    }
  },

  async createRun(input: {
    organizationId: string
    agent: AgentManifest
    planId?: string | null
    workflowInstanceId?: string | null
    workflowStageId?: string | null
    taskId: string
    providerId?: string | null
    modelId?: string | null
    correlationId: string
  }) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, input.organizationId)
      .input('agentId', sql.UniqueIdentifier, input.agent.id)
      .input('agentVersion', sql.Int, input.agent.version)
      .input('workflowInstanceId', sql.UniqueIdentifier, input.workflowInstanceId ?? null)
      .input('workflowStageId', sql.UniqueIdentifier, input.workflowStageId ?? null)
      .input('executionPlanId', sql.UniqueIdentifier, input.planId ?? null)
      .input('taskId', sql.UniqueIdentifier, input.taskId)
      .input('providerId', sql.UniqueIdentifier, input.providerId ?? null)
      .input('modelId', sql.UniqueIdentifier, input.modelId ?? null)
      .input('correlationId', sql.NVarChar, input.correlationId)
      .query(`
        INSERT INTO ai_agent_runs (organization_id, agent_id, agent_version, workflow_instance_id, workflow_stage_id, execution_plan_id, task_id, status, provider_id, model_id, correlation_id)
        OUTPUT INSERTED.*
        VALUES (@organizationId, @agentId, @agentVersion, @workflowInstanceId, @workflowStageId, @executionPlanId, @taskId, 'queued', @providerId, @modelId, @correlationId)
      `)
    const row = { ...result.recordset[0], agent_code: input.agent.code, agent_name: input.agent.name }
    return mapRun(row)
  },

  async updateRun(runId: string, patch: { status: string; progressPercent?: number; result?: AgentResult; error?: Error }) {
    const pool = await getConnectionPool()
    await pool
      .request()
      .input('runId', sql.UniqueIdentifier, runId)
      .input('status', sql.NVarChar, patch.status)
      .input('progressPercent', sql.Decimal(8, 2), patch.progressPercent ?? null)
      .input('confidence', sql.Decimal(8, 4), patch.result?.confidence ?? null)
      .input('latencyMs', sql.Int, patch.result?.usage.latencyMs ?? null)
      .input('inputTokens', sql.Int, patch.result?.usage.inputTokens ?? 0)
      .input('outputTokens', sql.Int, patch.result?.usage.outputTokens ?? 0)
      .input('estimatedCost', sql.Decimal(18, 6), patch.result?.usage.estimatedCost ?? 0)
      .input('errorCode', sql.NVarChar, patch.error ? 'AGENT_EXECUTION_FAILED' : null)
      .input('errorMessage', sql.NVarChar, patch.error?.message ?? null)
      .query(`
        UPDATE ai_agent_runs
        SET status = @status,
            progress_percent = COALESCE(@progressPercent, progress_percent),
            confidence_score = COALESCE(@confidence, confidence_score),
            latency_ms = COALESCE(@latencyMs, latency_ms),
            input_tokens = @inputTokens,
            output_tokens = @outputTokens,
            estimated_cost = @estimatedCost,
            error_code = @errorCode,
            error_message = @errorMessage,
            started_at = CASE WHEN @status = 'running' AND started_at IS NULL THEN SYSUTCDATETIME() ELSE started_at END,
            completed_at = CASE WHEN @status IN ('completed', 'failed', 'cancelled', 'approval_required') THEN SYSUTCDATETIME() ELSE completed_at END,
            updated_at = SYSUTCDATETIME()
        WHERE id = @runId
      `)
  },

  async addRunLog(runId: string, message: string, metadata: Record<string, unknown> = {}, severity = 'info') {
    const pool = await getConnectionPool()
    await pool.request().input('runId', sql.UniqueIdentifier, runId).input('severity', sql.NVarChar, severity).input('message', sql.NVarChar, message).input('metadata', sql.NVarChar, JSON.stringify(metadata)).query(`
      INSERT INTO ai_agent_run_logs (run_id, severity, message, metadata_json)
      VALUES (@runId, @severity, @message, @metadata)
    `)
  },

  async persistOutput(input: {
    run: AgentRunRecord
    result: AgentResult
    providerId?: string | null
    modelId?: string | null
  }) {
    const pool = await getConnectionPool()
    const output = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, input.run.organizationId)
      .input('runId', sql.UniqueIdentifier, input.run.id)
      .input('workflowInstanceId', sql.UniqueIdentifier, input.run.workflowInstanceId ?? null)
      .input('workflowStageId', sql.UniqueIdentifier, input.run.workflowStageId ?? null)
      .input('outputType', sql.NVarChar, input.result.outputType)
      .input('outputJson', sql.NVarChar, JSON.stringify(input.result.output))
      .input('confidence', sql.Decimal(8, 4), input.result.confidence)
      .input('validationStatus', sql.NVarChar, input.result.success ? 'passed' : 'failed')
      .input('citations', sql.NVarChar, JSON.stringify(input.result.citations))
      .input('assets', sql.NVarChar, JSON.stringify(input.result.assets))
      .input('sources', sql.NVarChar, JSON.stringify(input.result.metadata.sourceReferences ?? []))
      .input('providerId', sql.UniqueIdentifier, input.providerId ?? null)
      .input('modelId', sql.UniqueIdentifier, input.modelId ?? null)
      .query(`
        INSERT INTO ai_agent_outputs (organization_id, run_id, workflow_instance_id, workflow_stage_id, output_type, output_json, confidence_score, validation_status, citations_json, assets_json, source_references_json, provider_id, model_id, version)
        OUTPUT INSERTED.id
        VALUES (@organizationId, @runId, @workflowInstanceId, @workflowStageId, @outputType, @outputJson, @confidence, @validationStatus, @citations, @assets, @sources, @providerId, @modelId, 1)
      `)
    const outputId = String(output.recordset[0].id)
    await pool.request().input('outputId', sql.UniqueIdentifier, outputId).input('outputJson', sql.NVarChar, JSON.stringify(input.result.output)).query(`
      INSERT INTO ai_agent_output_versions(output_id, version, output_json, change_reason)
      VALUES (@outputId, 1, @outputJson, 'Initial agent output')
    `)
    await pool.request().input('runId', sql.UniqueIdentifier, input.run.id).input('reference', sql.NVarChar, `ai_agent_outputs:${outputId}`).query('UPDATE ai_agent_runs SET output_reference = @reference WHERE id = @runId')
    return { id: outputId, type: input.result.outputType, output: input.result.output, validationStatus: input.result.success ? 'passed' : 'failed' }
  },

  async recordUsage(run: AgentRunRecord, route: ModelRoute, result: AgentResult) {
    const pool = await getConnectionPool()
    await pool.request()
      .input('organizationId', sql.UniqueIdentifier, run.organizationId)
      .input('runId', sql.UniqueIdentifier, run.id)
      .input('providerId', sql.UniqueIdentifier, route.providerId)
      .input('modelId', sql.UniqueIdentifier, route.modelId)
      .input('inputTokens', sql.Int, result.usage.inputTokens)
      .input('outputTokens', sql.Int, result.usage.outputTokens)
      .input('latencyMs', sql.Int, result.usage.latencyMs)
      .input('estimatedCost', sql.Decimal(18, 6), result.usage.estimatedCost)
      .input('outcome', sql.NVarChar, result.status)
      .query(`
        INSERT INTO ai_usage_records (organization_id, run_id, provider_id, model_id, input_tokens, output_tokens, latency_ms, estimated_cost, outcome)
        VALUES (@organizationId, @runId, @providerId, @modelId, @inputTokens, @outputTokens, @latencyMs, @estimatedCost, @outcome)
      `)
  },

  async recordEvent(input: { organizationId?: string | null; planId?: string | null; runId?: string | null; eventName: string; payload?: Record<string, unknown>; correlationId?: string }) {
    const pool = await getConnectionPool()
    await pool.request()
      .input('organizationId', sql.UniqueIdentifier, input.organizationId ?? null)
      .input('planId', sql.UniqueIdentifier, input.planId ?? null)
      .input('runId', sql.UniqueIdentifier, input.runId ?? null)
      .input('eventName', sql.NVarChar, input.eventName)
      .input('payload', sql.NVarChar, JSON.stringify(input.payload ?? {}))
      .input('correlationId', sql.NVarChar, input.correlationId ?? null)
      .query(`
        INSERT INTO ai_orchestration_events (organization_id, execution_plan_id, run_id, event_name, payload_json, correlation_id)
        VALUES (@organizationId, @planId, @runId, @eventName, @payload, @correlationId)
      `)
  },

  async listRuns() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT r.*, a.code AS agent_code, a.name AS agent_name
      FROM ai_agent_runs r
      JOIN ai_agents a ON a.id = r.agent_id
      ORDER BY r.created_at DESC
    `)
    return result.recordset.map(mapRun)
  },

  async getRun(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query(`
      SELECT r.*, a.code AS agent_code, a.name AS agent_name
      FROM ai_agent_runs r
      JOIN ai_agents a ON a.id = r.agent_id
      WHERE r.id = @id
    `)
    if (!result.recordset[0]) throw new Error(`AI run not found: ${id}`)
    return mapRun(result.recordset[0])
  },

  async listRunLogs(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM ai_agent_run_logs WHERE run_id = @id ORDER BY created_at DESC')
    return result.recordset
  },

  async listRunOutputs(id: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('SELECT * FROM ai_agent_outputs WHERE run_id = @id ORDER BY created_at DESC')
    return result.recordset.map((row) => ({ ...row, output_json: json(row.output_json, {}) }))
  },

  async listProviders() {
    const pool = await getConnectionPool()
    return (await pool.request().query('SELECT id, code, name, provider_type, status, base_url, created_at, updated_at FROM ai_providers ORDER BY name')).recordset
  },

  async listModels() {
    const pool = await getConnectionPool()
    return (await pool.request().query(`
      SELECT m.id, m.code, m.name, m.model_type, m.context_window, m.status, p.code AS provider_code, p.name AS provider_name
      FROM ai_models m JOIN ai_providers p ON p.id = m.provider_id
      ORDER BY p.name, m.name
    `)).recordset
  },

  async health() {
    const pool = await getConnectionPool()
    return (await pool.request().query(`
      SELECT p.code AS provider_code, p.name AS provider_name, p.status AS provider_status, m.code AS model_code, m.status AS model_status, h.status AS health_status, h.success_rate, h.avg_latency_ms, h.checked_at
      FROM ai_models m
      JOIN ai_providers p ON p.id = m.provider_id
      LEFT JOIN ai_model_health h ON h.model_id = m.id
      ORDER BY p.name, m.name
    `)).recordset
  },

  async usage() {
    const pool = await getConnectionPool()
    return (await pool.request().query(`
      SELECT TOP 100 u.*, p.code AS provider_code, m.code AS model_code
      FROM ai_usage_records u
      LEFT JOIN ai_providers p ON p.id = u.provider_id
      LEFT JOIN ai_models m ON m.id = u.model_id
      ORDER BY u.recorded_at DESC
    `)).recordset
  },

  async costs() {
    const pool = await getConnectionPool()
    return (await pool.request().query(`
      SELECT organization_id, SUM(estimated_cost) AS total_cost, COUNT(*) AS usage_records
      FROM ai_usage_records
      GROUP BY organization_id
    `)).recordset
  },
}
