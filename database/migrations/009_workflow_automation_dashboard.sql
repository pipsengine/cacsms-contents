SET NOCOUNT ON;

IF OBJECT_ID('workflow_dashboard_categories', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_dashboard_categories (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    category_name NVARCHAR(160) NOT NULL,
    workflow_type NVARCHAR(80) NOT NULL,
    owner_team NVARCHAR(160) NULL,
    health_percent DECIMAL(8,2) NOT NULL DEFAULT 100,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_autonomous_decisions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_autonomous_decisions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    workflow_instance_id UNIQUEIDENTIFIER NULL,
    decision_type NVARCHAR(120) NOT NULL,
    decision_title NVARCHAR(220) NOT NULL,
    confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    action_taken NVARCHAR(220) NULL,
    outcome NVARCHAR(120) NULL,
    risk_level NVARCHAR(60) NOT NULL DEFAULT 'Low',
    policy_used NVARCHAR(160) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_recovery_actions', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_recovery_actions (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
    failure_reason NVARCHAR(260) NOT NULL,
    recovery_strategy NVARCHAR(120) NOT NULL,
    recovery_stage NVARCHAR(120) NOT NULL,
    jobs_protected INT NOT NULL DEFAULT 0,
    checkpoint_used NVARCHAR(160) NULL,
    retry_count INT NOT NULL DEFAULT 0,
    alternative_provider NVARCHAR(160) NULL,
    expected_recovery_minutes INT NOT NULL DEFAULT 0,
    confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    final_outcome NVARCHAR(120) NULL,
    status NVARCHAR(60) NOT NULL DEFAULT 'in_progress',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_final_outputs', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_final_outputs (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    workflow_instance_id UNIQUEIDENTIFIER NOT NULL,
    output_type NVARCHAR(120) NOT NULL,
    output_reference NVARCHAR(300) NOT NULL,
    readiness_status NVARCHAR(80) NOT NULL DEFAULT 'Pending',
    validation_status NVARCHAR(80) NOT NULL DEFAULT 'Pending',
    publishing_status NVARCHAR(80) NULL,
    analytics_status NVARCHAR(80) NULL,
    learning_status NVARCHAR(80) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('vw_workflow_dashboard_summary', 'V') IS NOT NULL DROP VIEW vw_workflow_dashboard_summary;
EXEC('CREATE VIEW vw_workflow_dashboard_summary AS
SELECT
  wi.organization_id,
  COUNT(DISTINCT wd.id) AS total_definitions,
  COUNT(DISTINCT CASE WHEN wi.status IN (''queued'',''starting'',''running'',''waiting'',''awaiting_approval'',''paused'',''retrying'',''recovering'',''blocked'') THEN wi.id END) AS active_instances,
  COUNT(DISTINCT CASE WHEN CAST(wi.completed_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE) THEN wi.id END) AS completed_today,
  COUNT(DISTINCT CASE WHEN wi.status IN (''running'',''starting'') THEN wi.id END) AS in_progress,
  COUNT(DISTINCT CASE WHEN wi.status IN (''queued'',''waiting'') THEN wi.id END) AS pending,
  COUNT(DISTINCT CASE WHEN wi.status = ''failed'' THEN wi.id END) AS failed,
  COUNT(DISTINCT CASE WHEN ra.status IN (''completed'',''recovered'') THEN ra.workflow_instance_id END) AS automatically_recovered,
  CAST(CASE WHEN COUNT(DISTINCT wi.id) = 0 THEN 100 ELSE 100.0 * COUNT(DISTINCT CASE WHEN wi.status = ''completed'' THEN wi.id END) / COUNT(DISTINCT wi.id) END AS DECIMAL(8,2)) AS success_rate,
  AVG(CASE WHEN wi.completed_at IS NOT NULL AND wi.started_at IS NOT NULL THEN DATEDIFF(second, wi.started_at, wi.completed_at) END) AS avg_completion_seconds,
  COUNT(DISTINCT CASE WHEN wi.status IN (''awaiting_approval'',''blocked'') THEN wi.id END) AS human_input_required,
  MAX(COALESCE(wi.updated_at, wi.created_at)) AS last_workflow_event
FROM workflow_definitions wd
LEFT JOIN workflow_instances wi ON wi.workflow_definition_id = wd.id AND wi.is_deleted = 0
LEFT JOIN workflow_recovery_actions ra ON ra.workflow_instance_id = wi.id
WHERE wd.is_deleted = 0
GROUP BY wi.organization_id');

IF OBJECT_ID('vw_active_workflow_instances', 'V') IS NOT NULL DROP VIEW vw_active_workflow_instances;
EXEC('CREATE VIEW vw_active_workflow_instances AS
SELECT
  wi.id,
  wi.organization_id,
  wd.name AS workflow_name,
  wd.code AS workflow_code,
  COALESCE(wd.workflow_type, ''workflow'') AS workflow_type,
  COALESCE(wi.reference_type, ''autonomous_scheduler'') AS trigger_type,
  wi.reference_id,
  ws.name AS current_stage,
  wi.progress_percent,
  wi.status,
  CASE WHEN wi.status IN (''failed'',''blocked'') THEN ''Critical'' WHEN wi.status IN (''recovering'',''retrying'') THEN ''High'' ELSE ''Normal'' END AS priority,
  wi.started_at,
  DATEDIFF(second, COALESCE(wi.started_at, wi.created_at), COALESCE(wi.completed_at, SYSUTCDATETIME())) AS elapsed_seconds,
  DATEADD(second, 120 + (100 - CAST(wi.progress_percent AS INT)) * 5, SYSUTCDATETIME()) AS estimated_completion,
  (SELECT COUNT(*) FROM ai_agent_runs ar WHERE ar.workflow_instance_id = wi.id) AS ai_agents,
  (SELECT COUNT(*) FROM background_jobs bj WHERE bj.name LIKE ''%'' + CONVERT(NVARCHAR(36), wi.id) + ''%'') AS jobs,
  CASE WHEN wi.status = ''awaiting_approval'' THEN ''Awaiting autonomous rule'' ELSE ''Auto-approved'' END AS approval_state,
  (SELECT COUNT(*) FROM workflow_retries wr WHERE wr.workflow_instance_id = wi.id) AS retry_count,
  COALESCE((SELECT TOP 1 status FROM workflow_recovery_actions ra WHERE ra.workflow_instance_id = wi.id ORDER BY created_at DESC), ''not_required'') AS recovery_state,
  COALESCE((SELECT TOP 1 readiness_status FROM workflow_final_outputs fo WHERE fo.workflow_instance_id = wi.id ORDER BY created_at DESC), CASE WHEN wi.status = ''completed'' THEN ''Ready'' ELSE ''Pending'' END) AS final_output,
  wi.initiated_by AS owner,
  wi.correlation_id,
  wi.created_at,
  wi.updated_at
FROM workflow_instances wi
JOIN workflow_definitions wd ON wd.id = wi.workflow_definition_id
LEFT JOIN workflow_stages ws ON ws.id = wi.current_stage_id
WHERE wi.is_deleted = 0');

IF OBJECT_ID('vw_workflow_category_health', 'V') IS NOT NULL DROP VIEW vw_workflow_category_health;
EXEC('CREATE VIEW vw_workflow_category_health AS
SELECT
  c.id,
  c.organization_id,
  c.category_name,
  c.workflow_type,
  COUNT(DISTINCT wd.id) AS total_definitions,
  COUNT(DISTINCT CASE WHEN wi.status IN (''queued'',''starting'',''running'',''waiting'',''recovering'',''retrying'') THEN wi.id END) AS active_instances,
  CAST(CASE WHEN COUNT(DISTINCT wi.id) = 0 THEN c.health_percent ELSE 100.0 * COUNT(DISTINCT CASE WHEN wi.status = ''completed'' THEN wi.id END) / COUNT(DISTINCT wi.id) END AS DECIMAL(8,2)) AS success_rate,
  AVG(CASE WHEN wi.completed_at IS NOT NULL AND wi.started_at IS NOT NULL THEN DATEDIFF(second, wi.started_at, wi.completed_at) END) AS average_duration_seconds,
  COUNT(DISTINCT CASE WHEN wi.status = ''failed'' THEN wi.id END) AS failed_instances,
  COUNT(DISTINCT CASE WHEN ra.status IN (''completed'',''recovered'') THEN ra.workflow_instance_id END) AS auto_recovered_instances,
  COUNT(DISTINCT CASE WHEN bj.status IN (''queued'',''pending'') THEN bj.id END) AS queue_depth,
  MAX(wi.created_at) AS last_execution,
  c.health_percent
FROM workflow_dashboard_categories c
LEFT JOIN workflow_definitions wd ON wd.organization_id = c.organization_id AND COALESCE(wd.workflow_type, ''workflow'') = c.workflow_type AND wd.is_deleted = 0
LEFT JOIN workflow_instances wi ON wi.workflow_definition_id = wd.id AND wi.is_deleted = 0
LEFT JOIN workflow_recovery_actions ra ON ra.workflow_instance_id = wi.id
LEFT JOIN background_jobs bj ON bj.organization_id = c.organization_id AND bj.name LIKE ''%'' + c.workflow_type + ''%''
GROUP BY c.id, c.organization_id, c.category_name, c.workflow_type, c.health_percent');

IF OBJECT_ID('vw_workflow_queue_health', 'V') IS NOT NULL DROP VIEW vw_workflow_queue_health;
EXEC('CREATE VIEW vw_workflow_queue_health AS
SELECT
  q.id,
  q.organization_id,
  q.name AS queue_name,
  COUNT(CASE WHEN bj.status IN (''queued'',''pending'') THEN 1 END) AS waiting_jobs,
  COUNT(CASE WHEN bj.status = ''running'' THEN 1 END) AS active_jobs,
  COUNT(CASE WHEN bj.status = ''delayed'' THEN 1 END) AS delayed_jobs,
  COUNT(CASE WHEN bj.status = ''failed'' THEN 1 END) AS failed_jobs,
  COUNT(CASE WHEN bj.status = ''completed'' THEN 1 END) AS completed_jobs,
  CAST(COALESCE(q.health_percent, 100) AS DECIMAL(8,2)) AS health_percent,
  CASE WHEN COUNT(CASE WHEN bj.status = ''failed'' THEN 1 END) > 0 THEN ''at-risk'' WHEN COALESCE(q.health_percent, 100) < 90 THEN ''degraded'' ELSE ''healthy'' END AS queue_status,
  MAX(COALESCE(bj.updated_at, bj.created_at, q.updated_at, q.created_at)) AS last_activity
FROM job_queues q
LEFT JOIN background_jobs bj ON bj.job_queue_id = q.id AND bj.is_deleted = 0
WHERE q.is_deleted = 0
GROUP BY q.id, q.organization_id, q.name, q.health_percent');

IF OBJECT_ID('vw_workflow_final_output_readiness', 'V') IS NOT NULL DROP VIEW vw_workflow_final_output_readiness;
EXEC('CREATE VIEW vw_workflow_final_output_readiness AS
SELECT
  wi.organization_id,
  COUNT(DISTINCT wi.id) AS total_workflows,
  COUNT(DISTINCT CASE WHEN COALESCE(fo.readiness_status, CASE WHEN wi.status = ''completed'' THEN ''Ready'' END) = ''Ready'' THEN wi.id END) AS ready_outputs,
  COUNT(DISTINCT CASE WHEN fo.validation_status = ''Validated'' THEN wi.id END) AS validated_outputs,
  COUNT(DISTINCT CASE WHEN fo.analytics_status = ''Completed'' THEN wi.id END) AS analytics_completed,
  COUNT(DISTINCT CASE WHEN fo.learning_status = ''Completed'' THEN wi.id END) AS learning_completed,
  CAST(CASE WHEN COUNT(DISTINCT wi.id) = 0 THEN 0 ELSE 100.0 * COUNT(DISTINCT CASE WHEN COALESCE(fo.readiness_status, CASE WHEN wi.status = ''completed'' THEN ''Ready'' END) = ''Ready'' THEN wi.id END) / COUNT(DISTINCT wi.id) END AS DECIMAL(8,2)) AS readiness_percent
FROM workflow_instances wi
LEFT JOIN workflow_final_outputs fo ON fo.workflow_instance_id = wi.id
WHERE wi.is_deleted = 0
GROUP BY wi.organization_id');

IF OBJECT_ID('vw_workflow_recovery_status', 'V') IS NOT NULL DROP VIEW vw_workflow_recovery_status;
EXEC('CREATE VIEW vw_workflow_recovery_status AS
SELECT ra.*, wi.status AS workflow_status, wd.name AS workflow_name, wd.workflow_type
FROM workflow_recovery_actions ra
JOIN workflow_instances wi ON wi.id = ra.workflow_instance_id
JOIN workflow_definitions wd ON wd.id = wi.workflow_definition_id');
