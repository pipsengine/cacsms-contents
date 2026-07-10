SET NOCOUNT ON;

IF OBJECT_ID('workflow_schedule_types', 'U') IS NULL
  CREATE TABLE workflow_schedule_types (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, type_name NVARCHAR(160) NOT NULL, description NVARCHAR(500) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_missed_run_policies', 'U') IS NULL
  CREATE TABLE workflow_schedule_missed_run_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, policy_name NVARCHAR(160) NOT NULL, behavior NVARCHAR(160) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_concurrency_policies', 'U') IS NULL
  CREATE TABLE workflow_schedule_concurrency_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, policy_name NVARCHAR(160) NOT NULL, max_overlap INT NOT NULL DEFAULT 1, behavior NVARCHAR(160) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_capacity_classes', 'U') IS NULL
  CREATE TABLE workflow_schedule_capacity_classes (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, class_name NVARCHAR(160) NOT NULL, capacity_weight INT NOT NULL DEFAULT 1, resource_profile NVARCHAR(220) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('workflow_schedules', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_schedules (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    organization_id UNIQUEIDENTIFIER NOT NULL,
    schedule_code NVARCHAR(120) NOT NULL,
    schedule_name NVARCHAR(220) NOT NULL,
    description NVARCHAR(1000) NULL,
    workflow_definition_id UNIQUEIDENTIFIER NULL,
    workflow_version INT NOT NULL DEFAULT 1,
    schedule_type NVARCHAR(120) NOT NULL,
    frequency NVARCHAR(120) NULL,
    cron_expression NVARCHAR(160) NULL,
    timezone NVARCHAR(80) NOT NULL DEFAULT 'Africa/Lagos',
    start_at DATETIME2 NULL,
    end_at DATETIME2 NULL,
    status NVARCHAR(40) NOT NULL DEFAULT 'draft',
    priority NVARCHAR(40) NOT NULL DEFAULT 'medium',
    queue_name NVARCHAR(120) NOT NULL DEFAULT 'workflow-scheduler',
    worker_pool_id NVARCHAR(160) NULL,
    concurrency_policy_id UNIQUEIDENTIFIER NULL,
    missed_run_policy_id UNIQUEIDENTIFIER NULL,
    optimization_enabled BIT NOT NULL DEFAULT 1,
    capacity_class_id UNIQUEIDENTIFIER NULL,
    owner_id NVARCHAR(180) NULL,
    brand NVARCHAR(180) NULL,
    environment NVARCHAR(80) NOT NULL DEFAULT 'production',
    current_version INT NOT NULL DEFAULT 1,
    published_version INT NULL,
    next_run_at DATETIME2 NULL,
    previous_run_at DATETIME2 NULL,
    last_result NVARCHAR(80) NULL,
    sla_minutes INT NOT NULL DEFAULT 60,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0
  );
END
ELSE
BEGIN
  IF COL_LENGTH('workflow_schedules', 'organization_id') IS NULL ALTER TABLE workflow_schedules ADD organization_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_schedules', 'schedule_code') IS NULL ALTER TABLE workflow_schedules ADD schedule_code NVARCHAR(120) NULL;
  IF COL_LENGTH('workflow_schedules', 'schedule_name') IS NULL ALTER TABLE workflow_schedules ADD schedule_name NVARCHAR(220) NULL;
  IF COL_LENGTH('workflow_schedules', 'description') IS NULL ALTER TABLE workflow_schedules ADD description NVARCHAR(1000) NULL;
  IF COL_LENGTH('workflow_schedules', 'workflow_version') IS NULL ALTER TABLE workflow_schedules ADD workflow_version INT NOT NULL CONSTRAINT df_workflow_schedules_version DEFAULT 1;
  IF COL_LENGTH('workflow_schedules', 'schedule_type') IS NULL ALTER TABLE workflow_schedules ADD schedule_type NVARCHAR(120) NOT NULL CONSTRAINT df_workflow_schedules_type DEFAULT 'Cron Schedules';
  IF COL_LENGTH('workflow_schedules', 'frequency') IS NULL ALTER TABLE workflow_schedules ADD frequency NVARCHAR(120) NULL;
  IF COL_LENGTH('workflow_schedules', 'start_at') IS NULL ALTER TABLE workflow_schedules ADD start_at DATETIME2 NULL;
  IF COL_LENGTH('workflow_schedules', 'end_at') IS NULL ALTER TABLE workflow_schedules ADD end_at DATETIME2 NULL;
  IF COL_LENGTH('workflow_schedules', 'status') IS NULL ALTER TABLE workflow_schedules ADD status NVARCHAR(40) NOT NULL CONSTRAINT df_workflow_schedules_status DEFAULT 'active';
  IF COL_LENGTH('workflow_schedules', 'priority') IS NULL ALTER TABLE workflow_schedules ADD priority NVARCHAR(40) NOT NULL CONSTRAINT df_workflow_schedules_priority DEFAULT 'medium';
  IF COL_LENGTH('workflow_schedules', 'queue_name') IS NULL ALTER TABLE workflow_schedules ADD queue_name NVARCHAR(120) NOT NULL CONSTRAINT df_workflow_schedules_queue DEFAULT 'workflow-scheduler';
  IF COL_LENGTH('workflow_schedules', 'worker_pool_id') IS NULL ALTER TABLE workflow_schedules ADD worker_pool_id NVARCHAR(160) NULL;
  IF COL_LENGTH('workflow_schedules', 'concurrency_policy_id') IS NULL ALTER TABLE workflow_schedules ADD concurrency_policy_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_schedules', 'missed_run_policy_id') IS NULL ALTER TABLE workflow_schedules ADD missed_run_policy_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_schedules', 'optimization_enabled') IS NULL ALTER TABLE workflow_schedules ADD optimization_enabled BIT NOT NULL CONSTRAINT df_workflow_schedules_optimization DEFAULT 1;
  IF COL_LENGTH('workflow_schedules', 'capacity_class_id') IS NULL ALTER TABLE workflow_schedules ADD capacity_class_id UNIQUEIDENTIFIER NULL;
  IF COL_LENGTH('workflow_schedules', 'owner_id') IS NULL ALTER TABLE workflow_schedules ADD owner_id NVARCHAR(180) NULL;
  IF COL_LENGTH('workflow_schedules', 'brand') IS NULL ALTER TABLE workflow_schedules ADD brand NVARCHAR(180) NULL;
  IF COL_LENGTH('workflow_schedules', 'environment') IS NULL ALTER TABLE workflow_schedules ADD environment NVARCHAR(80) NOT NULL CONSTRAINT df_workflow_schedules_environment DEFAULT 'production';
  IF COL_LENGTH('workflow_schedules', 'current_version') IS NULL ALTER TABLE workflow_schedules ADD current_version INT NOT NULL CONSTRAINT df_workflow_schedules_current_version DEFAULT 1;
  IF COL_LENGTH('workflow_schedules', 'published_version') IS NULL ALTER TABLE workflow_schedules ADD published_version INT NULL;
  IF COL_LENGTH('workflow_schedules', 'previous_run_at') IS NULL ALTER TABLE workflow_schedules ADD previous_run_at DATETIME2 NULL;
  IF COL_LENGTH('workflow_schedules', 'last_result') IS NULL ALTER TABLE workflow_schedules ADD last_result NVARCHAR(80) NULL;
  IF COL_LENGTH('workflow_schedules', 'sla_minutes') IS NULL ALTER TABLE workflow_schedules ADD sla_minutes INT NOT NULL CONSTRAINT df_workflow_schedules_sla DEFAULT 60;
  IF COL_LENGTH('workflow_schedules', 'is_deleted') IS NULL ALTER TABLE workflow_schedules ADD is_deleted BIT NOT NULL CONSTRAINT df_workflow_schedules_deleted DEFAULT 0;
  EXEC('UPDATE workflow_schedules SET organization_id = COALESCE(organization_id, (SELECT TOP 1 id FROM organizations ORDER BY created_at)) WHERE organization_id IS NULL');
  EXEC('UPDATE workflow_schedules SET schedule_code = COALESCE(schedule_code, CONCAT(''SCH-LEGACY-'', RIGHT(CONVERT(NVARCHAR(36), id), 6))), schedule_name = COALESCE(schedule_name, ''Legacy Workflow Schedule''), previous_run_at = COALESCE(previous_run_at, last_run_at), status = CASE WHEN is_enabled = 1 THEN status ELSE ''disabled'' END WHERE schedule_code IS NULL OR schedule_name IS NULL OR previous_run_at IS NULL');
END;

IF OBJECT_ID('workflow_schedule_versions', 'U') IS NULL
  CREATE TABLE workflow_schedule_versions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, version_number INT NOT NULL, status NVARCHAR(40) NOT NULL DEFAULT 'draft', change_summary NVARCHAR(500) NULL, validation_status NVARCHAR(80) NULL, simulation_status NVARCHAR(80) NULL, published_environment NVARCHAR(80) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_calendars', 'U') IS NULL
  CREATE TABLE workflow_schedule_calendars (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, business_calendar NVARCHAR(160) NULL, publishing_calendar NVARCHAR(160) NULL, campaign_calendar NVARCHAR(160) NULL, holiday_policy NVARCHAR(160) NULL, weekend_policy NVARCHAR(160) NULL, fiscal_period NVARCHAR(80) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_exclusions', 'U') IS NULL
  CREATE TABLE workflow_schedule_exclusions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, excluded_at DATETIME2 NOT NULL, reason NVARCHAR(240) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_blackouts', 'U') IS NULL
  CREATE TABLE workflow_schedule_blackouts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, starts_at DATETIME2 NOT NULL, ends_at DATETIME2 NOT NULL, reason NVARCHAR(240) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_windows', 'U') IS NULL
  CREATE TABLE workflow_schedule_windows (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, window_name NVARCHAR(160) NOT NULL, starts_at DATETIME2 NOT NULL, ends_at DATETIME2 NOT NULL, capacity_risk NVARCHAR(80) NOT NULL DEFAULT 'low', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_policies', 'U') IS NULL
  CREATE TABLE workflow_schedule_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, policy_type NVARCHAR(120) NOT NULL, policy_value NVARCHAR(500) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_optimization_policies', 'U') IS NULL
  CREATE TABLE workflow_schedule_optimization_policies (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, optimize_for_audience BIT NOT NULL DEFAULT 1, optimize_for_cost BIT NOT NULL DEFAULT 1, optimize_for_capacity BIT NOT NULL DEFAULT 1, optimize_for_sla BIT NOT NULL DEFAULT 1, max_shift_minutes INT NOT NULL DEFAULT 30, confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_executions', 'U') IS NULL
  CREATE TABLE workflow_schedule_executions (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, organization_id UNIQUEIDENTIFIER NOT NULL, workflow_instance_id UNIQUEIDENTIFIER NULL, planned_start DATETIME2 NOT NULL, actual_start DATETIME2 NULL, delay_seconds INT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'Queued', duration_seconds INT NOT NULL DEFAULT 0, queue_name NVARCHAR(120) NULL, worker_name NVARCHAR(160) NULL, recovery_used BIT NOT NULL DEFAULT 0, sla_result NVARCHAR(80) NULL, output_result NVARCHAR(80) NULL, publishing_result NVARCHAR(80) NULL, analytics_result NVARCHAR(80) NULL, learning_result NVARCHAR(80) NULL, cost DECIMAL(18,4) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_execution_steps', 'U') IS NULL
  CREATE TABLE workflow_schedule_execution_steps (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_execution_id UNIQUEIDENTIFIER NOT NULL, step_name NVARCHAR(180) NOT NULL, status NVARCHAR(40) NOT NULL, duration_ms INT NOT NULL DEFAULT 0, evidence NVARCHAR(MAX) NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_failures', 'U') IS NULL
  CREATE TABLE workflow_schedule_failures (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_execution_id UNIQUEIDENTIFIER NULL, workflow_schedule_id UNIQUEIDENTIFIER NULL, failure_reason NVARCHAR(500) NOT NULL, recoverability NVARCHAR(80) NOT NULL DEFAULT 'recoverable', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_recoveries', 'U') IS NULL
  CREATE TABLE workflow_schedule_recoveries (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, workflow_schedule_execution_id UNIQUEIDENTIFIER NULL, strategy NVARCHAR(180) NOT NULL, progress_percent DECIMAL(8,2) NOT NULL DEFAULT 0, outcome NVARCHAR(120) NOT NULL DEFAULT 'in_progress', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_conflicts', 'U') IS NULL
  CREATE TABLE workflow_schedule_conflicts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, primary_schedule_id UNIQUEIDENTIFIER NOT NULL, conflicting_schedule_id UNIQUEIDENTIFIER NULL, time_window NVARCHAR(180) NOT NULL, conflict_type NVARCHAR(180) NOT NULL, impact NVARCHAR(220) NULL, capacity_impact NVARCHAR(120) NULL, sla_impact NVARCHAR(120) NULL, final_output_impact NVARCHAR(120) NULL, recommended_resolution NVARCHAR(500) NULL, auto_resolution_available BIT NOT NULL DEFAULT 0, governance_approval_required BIT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_forecasts', 'U') IS NULL
  CREATE TABLE workflow_schedule_forecasts (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, organization_id UNIQUEIDENTIFIER NOT NULL, forecast_window_start DATETIME2 NOT NULL, forecast_window_end DATETIME2 NOT NULL, scheduled_workflows INT NOT NULL DEFAULT 0, queue_depth INT NOT NULL DEFAULT 0, worker_demand INT NOT NULL DEFAULT 0, gpu_demand INT NOT NULL DEFAULT 0, ai_provider_demand INT NOT NULL DEFAULT 0, video_render_demand INT NOT NULL DEFAULT 0, storage_demand INT NOT NULL DEFAULT 0, publishing_demand INT NOT NULL DEFAULT 0, analytics_demand INT NOT NULL DEFAULT 0, expected_cost DECIMAL(18,4) NOT NULL DEFAULT 0, sla_risk NVARCHAR(80) NOT NULL DEFAULT 'low', capacity_gap INT NOT NULL DEFAULT 0, planned_scaling NVARCHAR(180) NULL, final_output_risk NVARCHAR(80) NOT NULL DEFAULT 'low', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_recommendations', 'U') IS NULL
  CREATE TABLE workflow_schedule_recommendations (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, recommendation_type NVARCHAR(120) NOT NULL, current_scheduled_time DATETIME2 NULL, suggested_scheduled_time DATETIME2 NULL, reason NVARCHAR(500) NULL, confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0, expected_engagement_improvement DECIMAL(8,2) NOT NULL DEFAULT 0, expected_cost_impact DECIMAL(18,4) NOT NULL DEFAULT 0, expected_capacity_impact NVARCHAR(120) NULL, expected_sla_impact NVARCHAR(120) NULL, auto_apply_eligible BIT NOT NULL DEFAULT 0, status NVARCHAR(40) NOT NULL DEFAULT 'open', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_metrics', 'U') IS NULL
  CREATE TABLE workflow_schedule_metrics (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, metric_date DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE), executions_today INT NOT NULL DEFAULT 0, success_rate DECIMAL(8,2) NOT NULL DEFAULT 0, missed_runs INT NOT NULL DEFAULT 0, recovery_count INT NOT NULL DEFAULT 0, average_delay_seconds INT NOT NULL DEFAULT 0, average_duration_seconds INT NOT NULL DEFAULT 0, sla_compliance DECIMAL(8,2) NOT NULL DEFAULT 0, queue_wait_seconds INT NOT NULL DEFAULT 0, worker_utilization DECIMAL(8,2) NOT NULL DEFAULT 0, cost_today DECIMAL(18,4) NOT NULL DEFAULT 0, final_output_readiness DECIMAL(8,2) NOT NULL DEFAULT 0, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_change_history', 'U') IS NULL
  CREATE TABLE workflow_schedule_change_history (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, change_type NVARCHAR(120) NOT NULL, change_summary NVARCHAR(500) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_documentation', 'U') IS NULL
  CREATE TABLE workflow_schedule_documentation (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, title NVARCHAR(220) NOT NULL, content_markdown NVARCHAR(MAX) NOT NULL, generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_tags', 'U') IS NULL
  CREATE TABLE workflow_schedule_tags (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, tag NVARCHAR(80) NOT NULL, created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
IF OBJECT_ID('workflow_schedule_final_output_links', 'U') IS NULL
  CREATE TABLE workflow_schedule_final_output_links (id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY, workflow_schedule_id UNIQUEIDENTIFIER NOT NULL, output_name NVARCHAR(180) NULL, workflow_state NVARCHAR(80) NULL, execution_state NVARCHAR(80) NULL, output_state NVARCHAR(80) NULL, approval_state NVARCHAR(80) NULL, publishing_state NVARCHAR(80) NULL, analytics_state NVARCHAR(80) NULL, learning_state NVARCHAR(80) NULL, business_result_state NVARCHAR(80) NULL, readiness_percent DECIMAL(8,2) NOT NULL DEFAULT 0, linkage_status NVARCHAR(120) NOT NULL DEFAULT 'incomplete', created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());

IF OBJECT_ID('vw_workflow_schedules_list', 'V') IS NOT NULL DROP VIEW vw_workflow_schedules_list;
EXEC('CREATE VIEW vw_workflow_schedules_list AS
SELECT s.id, s.organization_id, s.schedule_code, s.schedule_name, s.description, COALESCE(wd.name, ''Unmapped Workflow'') AS workflow,
  s.workflow_definition_id, s.workflow_version, s.schedule_type, s.frequency, s.cron_expression, s.timezone, s.status, s.priority,
  s.next_run_at, s.previous_run_at AS last_run, COALESCE(s.last_result, ''pending'') AS last_result,
  COALESCE(mrp.policy_name, ''recalculate'') AS missed_run_policy, COALESCE(cp.policy_name, ''prevent overlap'') AS concurrency_policy,
  COALESCE(cc.class_name, ''standard'') AS capacity_class, s.queue_name, COALESCE(s.worker_pool_id, ''scheduler-workers'') AS worker_pool,
  CONCAT(s.sla_minutes, '' min'') AS sla, s.optimization_enabled AS auto_optimization, COALESCE(m.executions_today, 0) AS executions_today,
  COALESCE(m.success_rate, 100) AS success_rate, COALESCE(m.missed_runs, 0) AS missed_runs, COALESCE(m.average_delay_seconds, 0) AS avg_delay_seconds,
  COALESCE(m.recovery_count, 0) AS recovery_count, COALESCE(m.cost_today, 0) AS cost_today, COALESCE(m.sla_compliance, 100) AS sla_compliance,
  COALESCE(m.final_output_readiness, 0) AS final_output_readiness, COALESCE(s.owner_id, ''scheduler-engine'') AS owner,
  org.name AS organization, COALESCE(s.brand, ''CACSMS Contents'') AS brand, s.environment, s.current_version, s.published_version,
  s.start_at, s.end_at, s.created_at, COALESCE(s.updated_at, s.created_at) AS updated_at
FROM workflow_schedules s
JOIN organizations org ON org.id = s.organization_id
LEFT JOIN workflow_definitions wd ON wd.id = s.workflow_definition_id
LEFT JOIN workflow_schedule_missed_run_policies mrp ON mrp.id = s.missed_run_policy_id
LEFT JOIN workflow_schedule_concurrency_policies cp ON cp.id = s.concurrency_policy_id
LEFT JOIN workflow_schedule_capacity_classes cc ON cc.id = s.capacity_class_id
LEFT JOIN workflow_schedule_metrics m ON m.workflow_schedule_id = s.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE)
WHERE s.is_deleted = 0');

IF OBJECT_ID('vw_scheduler_engine_summary', 'V') IS NOT NULL DROP VIEW vw_scheduler_engine_summary;
EXEC('CREATE VIEW vw_scheduler_engine_summary AS
SELECT organization_id, COUNT(*) AS total_schedules, COUNT(CASE WHEN status = ''active'' THEN 1 END) AS active_schedules,
  COUNT(CASE WHEN next_run_at BETWEEN SYSUTCDATETIME() AND DATEADD(hour, 1, SYSUTCDATETIME()) THEN 1 END) AS due_next_hour,
  SUM(executions_today) AS executions_today, CAST(AVG(success_rate) AS DECIMAL(8,2)) AS completed_successfully,
  SUM(missed_runs) AS missed_runs, SUM(recovery_count) AS auto_recovered_runs,
  COUNT(CASE WHEN status IN (''invalid'') THEN 1 END) AS human_attention_required, MAX(updated_at) AS last_scheduler_tick
FROM vw_workflow_schedules_list GROUP BY organization_id');

IF OBJECT_ID('vw_schedule_calendar', 'V') IS NOT NULL DROP VIEW vw_schedule_calendar;
EXEC('CREATE VIEW vw_schedule_calendar AS SELECT id, organization_id, schedule_code, schedule_name, workflow, next_run_at AS start_time, DATEADD(minute, 45, next_run_at) AS end_time, priority, status, queue_name, worker_pool, capacity_class, sla, CASE WHEN avg_delay_seconds > 300 THEN ''risk'' ELSE ''clear'' END AS capacity_risk, CASE WHEN sla_compliance < 95 THEN ''risk'' ELSE ''clear'' END AS sla_risk, CASE WHEN final_output_readiness < 80 THEN ''risk'' ELSE ''clear'' END AS final_output_risk, auto_optimization FROM vw_workflow_schedules_list');
IF OBJECT_ID('vw_schedule_conflicts', 'V') IS NOT NULL DROP VIEW vw_schedule_conflicts;
EXEC('CREATE VIEW vw_schedule_conflicts AS SELECT c.*, p.schedule_code AS primary_schedule_code, p.schedule_name AS primary_schedule, q.schedule_code AS conflicting_schedule_code, q.schedule_name AS conflicting_schedule FROM workflow_schedule_conflicts c JOIN workflow_schedules p ON p.id = c.primary_schedule_id LEFT JOIN workflow_schedules q ON q.id = c.conflicting_schedule_id');
IF OBJECT_ID('vw_schedule_capacity_forecast', 'V') IS NOT NULL DROP VIEW vw_schedule_capacity_forecast;
EXEC('CREATE VIEW vw_schedule_capacity_forecast AS SELECT f.*, org.name AS organization FROM workflow_schedule_forecasts f JOIN organizations org ON org.id = f.organization_id');
IF OBJECT_ID('vw_schedule_missed_runs', 'V') IS NOT NULL DROP VIEW vw_schedule_missed_runs;
EXEC('CREATE VIEW vw_schedule_missed_runs AS SELECT f.id, s.organization_id, f.workflow_schedule_id, s.schedule_code, s.schedule_name, COALESCE(wd.name, ''Unmapped Workflow'') AS workflow, DATEADD(minute, -30, f.created_at) AS expected_run_time, f.created_at AS detected_at, f.failure_reason, COALESCE(mrp.policy_name, ''recalculate'') AS missed_run_policy, COALESCE(r.strategy, ''diagnose and recover'') AS recovery_action, DATEADD(minute, 15, f.created_at) AS new_run_time, COALESCE(r.outcome, ''Detected'') AS status, CASE WHEN COALESCE(m.final_output_readiness, 0) < 80 THEN ''at risk'' ELSE ''protected'' END AS final_output_impact FROM workflow_schedule_failures f JOIN workflow_schedules s ON s.id = f.workflow_schedule_id LEFT JOIN workflow_definitions wd ON wd.id = s.workflow_definition_id LEFT JOIN workflow_schedule_missed_run_policies mrp ON mrp.id = s.missed_run_policy_id LEFT JOIN workflow_schedule_recoveries r ON r.workflow_schedule_id = s.id LEFT JOIN workflow_schedule_metrics m ON m.workflow_schedule_id = s.id AND m.metric_date = CAST(SYSUTCDATETIME() AS DATE) WHERE f.failure_reason LIKE ''%missed%''');
IF OBJECT_ID('vw_schedule_performance', 'V') IS NOT NULL DROP VIEW vw_schedule_performance;
EXEC('CREATE VIEW vw_schedule_performance AS SELECT m.*, s.organization_id, s.schedule_code, s.schedule_name, s.schedule_type, s.frequency, s.status, s.queue_name, s.worker_pool_id FROM workflow_schedule_metrics m JOIN workflow_schedules s ON s.id = m.workflow_schedule_id');
IF OBJECT_ID('vw_schedule_recommendations', 'V') IS NOT NULL DROP VIEW vw_schedule_recommendations;
EXEC('CREATE VIEW vw_schedule_recommendations AS SELECT r.*, s.organization_id, s.schedule_code, s.schedule_name FROM workflow_schedule_recommendations r JOIN workflow_schedules s ON s.id = r.workflow_schedule_id');
IF OBJECT_ID('vw_schedule_final_output_readiness', 'V') IS NOT NULL DROP VIEW vw_schedule_final_output_readiness;
EXEC('CREATE VIEW vw_schedule_final_output_readiness AS SELECT l.*, s.organization_id, s.schedule_code, s.schedule_name, COALESCE(wd.name, ''Unmapped Workflow'') AS workflow FROM workflow_schedule_final_output_links l JOIN workflow_schedules s ON s.id = l.workflow_schedule_id LEFT JOIN workflow_definitions wd ON wd.id = s.workflow_definition_id');
