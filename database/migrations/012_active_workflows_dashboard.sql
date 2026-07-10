SET NOCOUNT ON;

IF OBJECT_ID('active_workflow_operations', 'U') IS NULL
BEGIN
  CREATE TABLE active_workflow_operations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
    priority NVARCHAR(40) NOT NULL DEFAULT 'medium',
    trigger_name NVARCHAR(160) NULL,
    queue_name NVARCHAR(160) NULL,
    worker_name NVARCHAR(160) NULL,
    approval_state NVARCHAR(80) NOT NULL DEFAULT 'auto-approved',
    recovery_state NVARCHAR(80) NOT NULL DEFAULT 'none',
    bottleneck NVARCHAR(220) NULL,
    sla_status NVARCHAR(80) NOT NULL DEFAULT 'within_sla',
    final_output_state NVARCHAR(80) NOT NULL DEFAULT 'on_track',
    analytics_state NVARCHAR(80) NOT NULL DEFAULT 'pending',
    learning_state NVARCHAR(80) NOT NULL DEFAULT 'pending',
    organization_name NVARCHAR(180) NULL,
    brand_name NVARCHAR(180) NULL,
    owner_name NVARCHAR(180) NULL,
    estimated_completion_at DATETIME2 NULL,
    current_action NVARCHAR(220) NULL,
    guardrail_status NVARCHAR(80) NOT NULL DEFAULT 'within_guardrails',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_active_workflow_operations_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
  );
END;

IF OBJECT_ID('active_workflow_readiness', 'U') IS NULL
BEGIN
  CREATE TABLE active_workflow_readiness (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
    core_content_produced BIT NOT NULL DEFAULT 0,
    validation_completed BIT NOT NULL DEFAULT 0,
    approval_completed BIT NOT NULL DEFAULT 0,
    required_assets_created BIT NOT NULL DEFAULT 0,
    publishing_package_ready BIT NOT NULL DEFAULT 0,
    publishing_completed BIT NOT NULL DEFAULT 0,
    analytics_configured BIT NOT NULL DEFAULT 0,
    analytics_collected BIT NOT NULL DEFAULT 0,
    learning_feedback_completed BIT NOT NULL DEFAULT 0,
    business_result_generated BIT NOT NULL DEFAULT 0,
    readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    readiness_status NVARCHAR(80) NOT NULL DEFAULT 'Incomplete',
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_active_workflow_readiness_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
  );
END;

IF OBJECT_ID('active_workflow_recovery_operations', 'U') IS NULL
BEGIN
  CREATE TABLE active_workflow_recovery_operations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
    failure NVARCHAR(240) NOT NULL,
    recovery_strategy NVARCHAR(180) NOT NULL,
    policy_name NVARCHAR(180) NOT NULL,
    confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    jobs_protected INT NOT NULL DEFAULT 0,
    outputs_protected INT NOT NULL DEFAULT 0,
    expected_completion_at DATETIME2 NULL,
    outcome NVARCHAR(160) NOT NULL DEFAULT 'in_progress',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_active_workflow_recovery_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
  );
END;

IF OBJECT_ID('active_workflow_decisions', 'U') IS NULL
BEGIN
  CREATE TABLE active_workflow_decisions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_instance_id UNIQUEIDENTIFIER NULL,
    detection NVARCHAR(220) NOT NULL,
    decision NVARCHAR(260) NOT NULL,
    policy_name NVARCHAR(180) NOT NULL,
    confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    risk_level NVARCHAR(80) NOT NULL DEFAULT 'low',
    action_taken NVARCHAR(260) NOT NULL,
    outcome NVARCHAR(180) NOT NULL,
    human_input_required BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_active_workflow_decisions_instance FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
  );
END;

IF OBJECT_ID('active_workflow_stage_metrics', 'U') IS NULL
BEGIN
  CREATE TABLE active_workflow_stage_metrics (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    stage_name NVARCHAR(180) NOT NULL,
    stage_order INT NOT NULL,
    active_instances INT NOT NULL DEFAULT 0,
    completed_today INT NOT NULL DEFAULT 0,
    failed INT NOT NULL DEFAULT 0,
    recovering INT NOT NULL DEFAULT 0,
    avg_duration_seconds INT NOT NULL DEFAULT 0,
    queue_depth INT NOT NULL DEFAULT 0,
    stage_health NVARCHAR(80) NOT NULL DEFAULT 'healthy',
    sla_risk NVARCHAR(80) NOT NULL DEFAULT 'low',
    autonomous_actions INT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('vw_active_workflows', 'V') IS NOT NULL DROP VIEW vw_active_workflows;
EXEC('CREATE VIEW vw_active_workflows AS
SELECT
  wi.id,
  wi.organization_id,
  wd.name AS workflow_name,
  COALESCE(wd.workflow_type, ''workflow'') AS workflow_type,
  COALESCE(op.trigger_name, wi.reference_type, ''system'') AS trigger_name,
  COALESCE(wi.reference_id, wi.correlation_id) AS reference,
  COALESCE(op.priority, ''medium'') AS priority,
  wi.status,
  COALESCE(ws.name, ''Queued'') AS current_stage,
  CAST(wi.progress_percent AS DECIMAL(8,2)) AS progress_percent,
  CAST(COALESCE(step.progress_percent, wi.progress_percent, 0) AS DECIMAL(8,2)) AS stage_progress_percent,
  wi.started_at,
  DATEDIFF(second, COALESCE(wi.started_at, wi.created_at), SYSUTCDATETIME()) AS elapsed_seconds,
  COALESCE(op.estimated_completion_at, DATEADD(minute, 30, COALESCE(wi.started_at, wi.created_at))) AS estimated_completion_at,
  COALESCE(op.sla_status, ''within_sla'') AS sla_status,
  (SELECT COUNT(*) FROM ai_agent_runs ar WHERE ar.workflow_instance_id = wi.id AND ar.status IN (''queued'',''running'',''retrying'')) AS ai_agents,
  (SELECT COUNT(*) FROM background_jobs bj WHERE bj.organization_id = wi.organization_id AND bj.is_deleted = 0 AND bj.status IN (''queued'',''running'',''retrying'')) AS background_jobs,
  COALESCE(op.queue_name, ''workflow-execution'') AS queue_name,
  COALESCE(op.worker_name, step.worker_id, ''auto-worker'') AS worker_name,
  COALESCE(op.approval_state, ''auto-approved'') AS approval_state,
  COALESCE(op.recovery_state, ''none'') AS recovery_state,
  COALESCE(step.retry_count, 0) AS retry_count,
  COALESCE(op.bottleneck, ''none detected'') AS current_bottleneck,
  COALESCE(op.final_output_state, ''on_track'') AS final_output,
  COALESCE(op.analytics_state, ''pending'') AS analytics_state,
  COALESCE(op.learning_state, ''pending'') AS learning_state,
  COALESCE(op.organization_name, org.name) AS organization,
  COALESCE(op.brand_name, ''CACSMS Contents'') AS brand,
  COALESCE(op.owner_name, wd.owner_id, ''workflow-engine'') AS owner,
  COALESCE(op.current_action, ''autonomous supervision'') AS action_state,
  COALESCE(op.guardrail_status, ''within_guardrails'') AS guardrail_status,
  wi.workflow_definition_id,
  wi.workflow_version,
  wi.correlation_id,
  wi.created_at,
  wi.updated_at
FROM workflow_instances wi
JOIN workflow_definitions wd ON wd.id = wi.workflow_definition_id
JOIN organizations org ON org.id = wi.organization_id
LEFT JOIN workflow_stages ws ON ws.id = wi.current_stage_id
LEFT JOIN active_workflow_operations op ON op.workflow_instance_id = wi.id
OUTER APPLY (
  SELECT TOP 1 s.* FROM workflow_instance_steps s
  WHERE s.workflow_instance_id = wi.id
  ORDER BY CASE WHEN s.status IN (''running'',''retrying'',''recovering'') THEN 0 ELSE 1 END, COALESCE(s.updated_at, s.created_at) DESC
) step
WHERE wi.is_deleted = 0
  AND wi.status IN (''queued'',''starting'',''running'',''waiting'',''awaiting_approval'',''paused'',''retrying'',''recovering'',''blocked'',''degraded'',''completing'')
  AND wi.completed_at IS NULL
  AND wi.stopped_at IS NULL');

IF OBJECT_ID('vw_active_workflow_stages', 'V') IS NOT NULL DROP VIEW vw_active_workflow_stages;
EXEC('CREATE VIEW vw_active_workflow_stages AS
SELECT stage_name, stage_order, active_instances, completed_today, failed, recovering, avg_duration_seconds, queue_depth, stage_health, sla_risk, autonomous_actions, updated_at
FROM active_workflow_stage_metrics');

IF OBJECT_ID('vw_active_workflow_agents', 'V') IS NOT NULL DROP VIEW vw_active_workflow_agents;
EXEC('CREATE VIEW vw_active_workflow_agents AS
SELECT ar.id, ar.organization_id, ar.workflow_instance_id, COALESCE(ag.name, ''AI Agent'') AS agent, aw.workflow_name, COALESCE(ws.name, aw.current_stage) AS stage, COALESCE(ar.input_reference, ''Autonomous workflow task'') AS task,
  COALESCE(p.name, p.provider_name, ''default-provider'') AS provider, COALESCE(m.name, m.model_name, ''default-model'') AS model, ar.status, ar.progress_percent, ar.confidence_score * 100 AS confidence_percent,
  ar.latency_ms, ar.estimated_cost, ar.retry_count, COALESCE(ar.output_reference, ''pending'') AS output_state, aw.worker_name, aw.action_state, ar.started_at, ar.updated_at
FROM ai_agent_runs ar
JOIN vw_active_workflows aw ON aw.id = ar.workflow_instance_id
LEFT JOIN ai_agents ag ON ag.id = ar.agent_id
LEFT JOIN workflow_stages ws ON ws.id = ar.workflow_stage_id
LEFT JOIN ai_providers p ON p.id = ar.provider_id
LEFT JOIN ai_models m ON m.id = ar.model_id');

IF OBJECT_ID('vw_active_workflow_jobs', 'V') IS NOT NULL DROP VIEW vw_active_workflow_jobs;
EXEC('CREATE VIEW vw_active_workflow_jobs AS
SELECT bj.id, aw.organization_id, aw.id AS workflow_instance_id, aw.workflow_name, aw.current_stage AS stage, COALESCE(jq.name, aw.queue_name) AS queue_name, aw.worker_name, bj.progress_percent, bj.status, bj.started_at,
  DATEADD(minute, 20, COALESCE(bj.started_at, bj.created_at)) AS eta, 0 AS retry_count, ''checkpointed'' AS checkpoint_state, aw.recovery_state
FROM vw_active_workflows aw
JOIN background_jobs bj ON bj.organization_id = aw.organization_id AND bj.is_deleted = 0 AND bj.name LIKE ''%'' + aw.correlation_id + ''%''
LEFT JOIN job_queues jq ON jq.id = bj.job_queue_id
WHERE bj.status IN (''queued'',''running'',''retrying'')');

IF OBJECT_ID('vw_active_workflow_recoveries', 'V') IS NOT NULL DROP VIEW vw_active_workflow_recoveries;
EXEC('CREATE VIEW vw_active_workflow_recoveries AS
SELECT r.*, aw.organization_id, aw.workflow_name, aw.current_stage, aw.recovery_state FROM active_workflow_recovery_operations r JOIN vw_active_workflows aw ON aw.id = r.workflow_instance_id');

IF OBJECT_ID('vw_active_workflow_sla_risk', 'V') IS NOT NULL DROP VIEW vw_active_workflow_sla_risk;
EXEC('CREATE VIEW vw_active_workflow_sla_risk AS
SELECT aw.id, aw.organization_id, aw.workflow_name, aw.current_stage, aw.sla_status, DATEDIFF(minute, SYSUTCDATETIME(), aw.estimated_completion_at) AS time_remaining_minutes, aw.current_bottleneck,
  aw.estimated_completion_at AS predicted_completion, CASE WHEN aw.sla_status = ''breached'' THEN 95 WHEN aw.sla_status = ''at_risk'' THEN 72 ELSE 18 END AS risk_percent,
  aw.action_state AS autonomous_mitigation, CASE WHEN aw.sla_status IN (''at_risk'',''breached'') THEN ''15 minute recovery gain expected'' ELSE ''On schedule'' END AS expected_improvement,
  aw.final_output, aw.analytics_state, aw.learning_state
FROM vw_active_workflows aw');

IF OBJECT_ID('vw_active_workflow_final_output', 'V') IS NOT NULL DROP VIEW vw_active_workflow_final_output;
EXEC('CREATE VIEW vw_active_workflow_final_output AS
SELECT aw.id, aw.organization_id, aw.workflow_name, aw.current_stage, aw.final_output, aw.analytics_state, aw.learning_state,
  COALESCE(r.core_content_produced, 0) AS core_content_produced, COALESCE(r.validation_completed, 0) AS validation_completed, COALESCE(r.approval_completed, 0) AS approval_completed,
  COALESCE(r.required_assets_created, 0) AS required_assets_created, COALESCE(r.publishing_package_ready, 0) AS publishing_package_ready, COALESCE(r.publishing_completed, 0) AS publishing_completed,
  COALESCE(r.analytics_configured, 0) AS analytics_configured, COALESCE(r.analytics_collected, 0) AS analytics_collected, COALESCE(r.learning_feedback_completed, 0) AS learning_feedback_completed,
  COALESCE(r.business_result_generated, 0) AS business_result_generated, COALESCE(r.readiness_percent, aw.progress_percent) AS readiness_percent, COALESCE(r.readiness_status, aw.final_output) AS readiness_status
FROM vw_active_workflows aw LEFT JOIN active_workflow_readiness r ON r.workflow_instance_id = aw.id');

IF OBJECT_ID('vw_active_workflow_bottlenecks', 'V') IS NOT NULL DROP VIEW vw_active_workflow_bottlenecks;
EXEC('CREATE VIEW vw_active_workflow_bottlenecks AS
SELECT aw.id, aw.organization_id, aw.workflow_name, aw.current_stage AS stage, aw.current_bottleneck AS root_cause,
  CASE WHEN aw.current_bottleneck = ''none detected'' THEN 20 ELSE 88 END AS confidence_percent,
  CASE WHEN aw.sla_status = ''breached'' THEN ''45m'' WHEN aw.sla_status = ''at_risk'' THEN ''20m'' ELSE ''0m'' END AS estimated_delay,
  aw.sla_status AS sla_impact, aw.final_output AS final_output_impact, aw.action_state AS autonomous_action_selected,
  aw.estimated_completion_at AS expected_recovery_time, aw.recovery_state AS current_outcome
FROM vw_active_workflows aw
WHERE aw.current_bottleneck <> ''none detected'' OR aw.sla_status IN (''at_risk'',''breached'') OR aw.recovery_state <> ''none''');
