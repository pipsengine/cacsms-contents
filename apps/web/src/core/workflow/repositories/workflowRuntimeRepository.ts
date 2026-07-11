import { getConnectionPool, sql } from '@cacsms/database'
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowLog,
  WorkflowSnapshot,
  WorkflowStage,
  WorkflowStep,
} from '../types/runtime'

function mapDefinition(row: Record<string, unknown>): WorkflowDefinition {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    code: String(row.code ?? row.name),
    name: String(row.name),
    workflowType: String(row.workflow_type ?? 'workflow'),
    currentVersion: Number(row.current_version ?? 1),
    status: String(row.status ?? 'active'),
  }
}

function mapStage(row: Record<string, unknown>): WorkflowStage {
  return {
    id: String(row.id),
    workflowDefinitionId: String(row.workflow_definition_id),
    stageCode: String(row.stage_code ?? row.name),
    name: String(row.name),
    sequenceNo: Number(row.sequence_no ?? row.display_order ?? 0),
    weightPercent: Number(row.weight_percent ?? 1),
    requiredPermission: row.required_permission ? String(row.required_permission) : null,
  }
}

function mapInstance(row: Record<string, unknown>): WorkflowInstance {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    workflowDefinitionId: String(row.workflow_definition_id),
    workflowCode: String(row.code),
    workflowName: String(row.name),
    workflowVersion: Number(row.workflow_version),
    referenceType: row.reference_type ? String(row.reference_type) : null,
    referenceId: row.reference_id ? String(row.reference_id) : null,
    status: row.status as WorkflowInstance['status'],
    currentStageId: row.current_stage_id ? String(row.current_stage_id) : null,
    currentStage: row.current_stage_name ? String(row.current_stage_name) : null,
    progressPercent: Number(row.progress_percent ?? 0),
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
    stoppedAt: row.stopped_at ? new Date(String(row.stopped_at)).toISOString() : null,
    pausedAt: row.paused_at ? new Date(String(row.paused_at)).toISOString() : null,
    initiatedBy: row.initiated_by ? String(row.initiated_by) : null,
    correlationId: String(row.correlation_id),
    context: row.context_json ? JSON.parse(String(row.context_json)) : undefined,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  }
}

export const workflowRuntimeRepository = {
  async listDefinitions() {
    const pool = await getConnectionPool()
    const result = await pool.request().query('SELECT * FROM workflow_definitions WHERE is_deleted = 0 ORDER BY name')
    return result.recordset.map(mapDefinition)
  },

  async getDefinitionByCode(code: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('code', sql.NVarChar, code).query('SELECT TOP 1 * FROM workflow_definitions WHERE code = @code AND is_deleted = 0')
    if (!result.recordset[0]) throw new Error(`Workflow definition not found in database: ${code}`)
    return mapDefinition(result.recordset[0])
  },

  async listStages(workflowDefinitionId: string) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('workflowDefinitionId', sql.UniqueIdentifier, workflowDefinitionId)
      .query('SELECT * FROM workflow_stages WHERE workflow_definition_id = @workflowDefinitionId AND is_deleted = 0 ORDER BY COALESCE(sequence_no, display_order), name')
    return result.recordset.map(mapStage)
  },

  async createInstance(input: {
    definition: WorkflowDefinition
    referenceType?: string
    referenceId?: string
    context?: Record<string, unknown>
    requestedBy: string
    correlationId: string
  }) {
    const pool = await getConnectionPool()
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, input.definition.organizationId)
      .input('workflowDefinitionId', sql.UniqueIdentifier, input.definition.id)
      .input('workflowVersion', sql.Int, input.definition.currentVersion)
      .input('referenceType', sql.NVarChar, input.referenceType ?? null)
      .input('referenceId', sql.NVarChar, input.referenceId ?? null)
      .input('initiatedBy', sql.NVarChar, input.requestedBy)
      .input('correlationId', sql.NVarChar, input.correlationId)
      .input('contextJson', sql.NVarChar, input.context ? JSON.stringify(input.context) : null)
      .query(`
        INSERT INTO workflow_instances (organization_id, workflow_definition_id, workflow_version, reference_type, reference_id, status, progress_percent, initiated_by, correlation_id, context_json)
        OUTPUT INSERTED.id
        VALUES (@organizationId, @workflowDefinitionId, @workflowVersion, @referenceType, @referenceId, 'queued', 0, @initiatedBy, @correlationId, @contextJson)
      `)
    const instanceId = String(result.recordset[0].id)
    const stageRows = await this.listStages(input.definition.id)
    for (const stage of stageRows) {
      await pool.request().input('instanceId', sql.UniqueIdentifier, instanceId).input('stageId', sql.UniqueIdentifier, stage.id).query(`
        INSERT INTO workflow_instance_steps (workflow_instance_id, workflow_stage_id, status, progress_percent)
        VALUES (@instanceId, @stageId, 'queued', 0)
      `)
    }
    return this.getInstance(instanceId)
  },

  async listInstances() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT wi.*, wd.code, wd.name, ws.name AS current_stage_name
      FROM workflow_instances wi
      JOIN workflow_definitions wd ON wd.id = wi.workflow_definition_id
      LEFT JOIN workflow_stages ws ON ws.id = wi.current_stage_id
      WHERE wi.is_deleted = 0
      ORDER BY wi.created_at DESC
    `)
    return result.recordset.map(mapInstance)
  },

  async getInstance(instanceId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('instanceId', sql.UniqueIdentifier, instanceId).query(`
      SELECT wi.*, wd.code, wd.name, ws.name AS current_stage_name
      FROM workflow_instances wi
      JOIN workflow_definitions wd ON wd.id = wi.workflow_definition_id
      LEFT JOIN workflow_stages ws ON ws.id = wi.current_stage_id
      WHERE wi.id = @instanceId AND wi.is_deleted = 0
    `)
    const row = result.recordset[0]
    if (!row) throw new Error(`Workflow instance not found in database: ${instanceId}`)
    return mapInstance(row)
  },

  async updateInstance(instanceId: string, patch: Partial<WorkflowInstance>) {
    const pool = await getConnectionPool()
    await pool
      .request()
      .input('instanceId', sql.UniqueIdentifier, instanceId)
      .input('status', sql.NVarChar, patch.status ?? null)
      .input('currentStageId', sql.UniqueIdentifier, patch.currentStageId ?? null)
      .input('progressPercent', sql.Decimal(8, 2), patch.progressPercent ?? null)
      .query(`
        UPDATE workflow_instances
        SET status = COALESCE(@status, status),
            current_stage_id = COALESCE(@currentStageId, current_stage_id),
            progress_percent = COALESCE(@progressPercent, progress_percent),
            started_at = CASE WHEN @status IN ('starting', 'running') AND started_at IS NULL THEN SYSUTCDATETIME() ELSE started_at END,
            completed_at = CASE WHEN @status = 'completed' THEN SYSUTCDATETIME() ELSE completed_at END,
            stopped_at = CASE WHEN @status = 'stopped' THEN SYSUTCDATETIME() ELSE stopped_at END,
            paused_at = CASE WHEN @status = 'paused' THEN SYSUTCDATETIME() ELSE paused_at END,
            updated_at = SYSUTCDATETIME()
        WHERE id = @instanceId
      `)
    return this.getInstance(instanceId)
  },

  async listSteps(instanceId: string) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('instanceId', sql.UniqueIdentifier, instanceId).query(`
      SELECT wis.*, ws.name AS stage_name
      FROM workflow_instance_steps wis
      JOIN workflow_stages ws ON ws.id = wis.workflow_stage_id
      WHERE wis.workflow_instance_id = @instanceId
      ORDER BY COALESCE(ws.sequence_no, ws.display_order), ws.name
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      workflowInstanceId: String(row.workflow_instance_id),
      workflowStageId: String(row.workflow_stage_id),
      stageName: String(row.stage_name),
      status: row.status,
      progressPercent: Number(row.progress_percent),
      startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      errorMessage: row.error_message,
      retryCount: Number(row.retry_count ?? 0),
      outputReference: row.output_reference,
    })) as WorkflowStep[]
  },

  async updateStep(instanceId: string, stageId: string, patch: Partial<WorkflowStep>) {
    const pool = await getConnectionPool()
    await pool
      .request()
      .input('instanceId', sql.UniqueIdentifier, instanceId)
      .input('stageId', sql.UniqueIdentifier, stageId)
      .input('status', sql.NVarChar, patch.status ?? null)
      .input('progressPercent', sql.Decimal(8, 2), patch.progressPercent ?? null)
      .input('errorMessage', sql.NVarChar, patch.errorMessage ?? null)
      .query(`
        UPDATE workflow_instance_steps
        SET status = COALESCE(@status, status),
            progress_percent = COALESCE(@progressPercent, progress_percent),
            error_message = COALESCE(@errorMessage, error_message),
            started_at = CASE WHEN @status = 'running' AND started_at IS NULL THEN SYSUTCDATETIME() ELSE started_at END,
            completed_at = CASE WHEN @status IN ('completed', 'failed', 'cancelled') THEN SYSUTCDATETIME() ELSE completed_at END,
            updated_at = SYSUTCDATETIME()
        WHERE workflow_instance_id = @instanceId AND workflow_stage_id = @stageId
      `)
  },

  async addLog(instanceId: string, message: string, metadata: Record<string, unknown> = {}, severity: WorkflowLog['severity'] = 'info', stageId?: string) {
    const instance = await this.getInstance(instanceId)
    const pool = await getConnectionPool()
    await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, instance.organizationId)
      .input('workflowDefinitionId', sql.UniqueIdentifier, instance.workflowDefinitionId)
      .input('stageId', sql.UniqueIdentifier, stageId ?? null)
      .input('status', sql.NVarChar, severity)
      .input('message', sql.NVarChar, message)
      .input('metadata', sql.NVarChar, JSON.stringify({ workflowInstanceId: instanceId, ...metadata }))
      .query('INSERT INTO workflow_execution_logs (organization_id, workflow_definition_id, stage_id, status, message, metadata) VALUES (@organizationId, @workflowDefinitionId, @stageId, @status, @message, @metadata)')
    return {
      id: crypto.randomUUID(),
      workflowInstanceId: instanceId,
      workflowStageId: stageId,
      severity,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    } satisfies WorkflowLog
  },

  async listLogs(instanceId: string) {
    const instance = await this.getInstance(instanceId)
    const pool = await getConnectionPool()
    const result = await pool.request().input('workflowDefinitionId', sql.UniqueIdentifier, instance.workflowDefinitionId).input('instanceId', sql.NVarChar, instanceId).query(`
      SELECT * FROM workflow_execution_logs
      WHERE workflow_definition_id = @workflowDefinitionId
        AND (metadata LIKE '%' + @instanceId + '%' OR metadata IS NULL)
      ORDER BY created_at DESC
    `)
    return result.recordset.map((row) => ({
      id: String(row.id),
      workflowInstanceId: instanceId,
      workflowStageId: row.stage_id,
      severity: row.status === 'error' ? 'error' : 'info',
      message: row.message ?? '',
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at).toISOString(),
    })) as WorkflowLog[]
  },

  async createQueueJob(queueName: string, name: string, instanceId: string) {
    const instance = await this.getInstance(instanceId)
    const pool = await getConnectionPool()
    const queue = await pool.request().input('organizationId', sql.UniqueIdentifier, instance.organizationId).input('queueName', sql.NVarChar, queueName).query(`
      SELECT TOP 1 id FROM job_queues WHERE organization_id = @organizationId AND name = @queueName AND is_deleted = 0
    `)
    const queueId = queue.recordset[0]?.id ?? null
    const result = await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, instance.organizationId)
      .input('queueId', sql.UniqueIdentifier, queueId)
      .input('name', sql.NVarChar, name)
      .query(`
        INSERT INTO background_jobs (organization_id, job_queue_id, name, status, priority, progress_percent, created_by)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.status, INSERTED.progress_percent
        VALUES (@organizationId, @queueId, @name, 'queued', 'medium', 0, NULL)
      `)
    const row = result.recordset[0]
    return { id: String(row.id), name: String(row.name), status: String(row.status), progressPercent: Number(row.progress_percent), workflowInstanceId: instanceId }
  },

  async updateQueueJob(jobId: string, status: string, progressPercent: number) {
    const pool = await getConnectionPool()
    const result = await pool.request().input('jobId', sql.UniqueIdentifier, jobId).input('status', sql.NVarChar, status).input('progressPercent', sql.Decimal(8, 2), progressPercent).query(`
      UPDATE background_jobs
      SET status = @status,
          progress_percent = @progressPercent,
          started_at = CASE WHEN @status = 'running' AND started_at IS NULL THEN SYSUTCDATETIME() ELSE started_at END,
          completed_at = CASE WHEN @status IN ('completed', 'failed', 'cancelled') THEN SYSUTCDATETIME() ELSE completed_at END,
          updated_at = SYSUTCDATETIME()
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.status, INSERTED.progress_percent
      WHERE id = @jobId
    `)
    const row = result.recordset[0]
    return row ? { id: String(row.id), name: String(row.name), status: String(row.status), progressPercent: Number(row.progress_percent) } : null
  },

  async listQueueJobs() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT id, name, status, progress_percent FROM background_jobs WHERE is_deleted = 0 ORDER BY created_at DESC
    `)
    return result.recordset.map((row) => ({ id: String(row.id), name: String(row.name), status: String(row.status), progressPercent: Number(row.progress_percent) }))
  },

  async getSnapshot(instanceId: string): Promise<WorkflowSnapshot> {
    return {
      instance: await this.getInstance(instanceId),
      steps: await this.listSteps(instanceId),
      logs: await this.listLogs(instanceId),
    }
  },

  async updateSystemRuntimeState(patch: Record<string, unknown>) {
    const pool = await getConnectionPool()
    const organizationId = String(patch.organizationId ?? '00000000-0000-0000-0000-000000000001')
    await pool
      .request()
      .input('organizationId', sql.UniqueIdentifier, organizationId)
      .input('status', sql.NVarChar, String(patch.status ?? 'stopped'))
      .input('startupWorkflowInstanceId', sql.UniqueIdentifier, patch.startupWorkflowInstanceId ?? null)
      .input('shutdownWorkflowInstanceId', sql.UniqueIdentifier, patch.shutdownWorkflowInstanceId ?? null)
      .input('healthPercent', sql.Decimal(8, 2), patch.healthPercent ?? 0)
      .input('readinessPercent', sql.Decimal(8, 2), patch.readinessPercent ?? 0)
      .input('currentStage', sql.NVarChar, patch.currentStage ? String(patch.currentStage) : null)
      .input('requestedBy', sql.NVarChar, patch.requestedBy ? String(patch.requestedBy) : null)
      .query(`
        MERGE system_runtime_state AS target
        USING (SELECT @organizationId AS organization_id) AS source
        ON target.organization_id = source.organization_id
        WHEN MATCHED THEN UPDATE SET
          status = @status,
          startup_workflow_instance_id = COALESCE(@startupWorkflowInstanceId, startup_workflow_instance_id),
          shutdown_workflow_instance_id = COALESCE(@shutdownWorkflowInstanceId, shutdown_workflow_instance_id),
          health_percent = @healthPercent,
          readiness_percent = @readinessPercent,
          current_stage = @currentStage,
          requested_by = @requestedBy,
          last_heartbeat_at = SYSUTCDATETIME(),
          updated_at = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT (organization_id, status, startup_workflow_instance_id, shutdown_workflow_instance_id, health_percent, readiness_percent, current_stage, requested_by, last_heartbeat_at, updated_at)
        VALUES (@organizationId, @status, @startupWorkflowInstanceId, @shutdownWorkflowInstanceId, @healthPercent, @readinessPercent, @currentStage, @requestedBy, SYSUTCDATETIME(), SYSUTCDATETIME());
      `)
    return this.getSystemRuntimeState()
  },

  async getSystemRuntimeState() {
    const pool = await getConnectionPool()
    const result = await pool.request().query(`
      SELECT TOP 1 * FROM system_runtime_state ORDER BY updated_at DESC
    `)
    return result.recordset[0] ?? null
  },
}
