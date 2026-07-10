SET NOCOUNT ON;

IF OBJECT_ID('active_workflow_operations', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @content UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_LIFECYCLE');
DECLARE @publishing UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_PUBLISHING');
DECLARE @analytics UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'ANALYTICS_COLLECTION');
DECLARE @approval UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_APPROVAL');
DECLARE @learning UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'LEARNING_FEEDBACK');

DECLARE @researchStage UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content AND stage_code = 'research'), (SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content ORDER BY sequence_no));
DECLARE @approvalStage UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content AND stage_code = 'approval'), (SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @approval ORDER BY sequence_no));
DECLARE @publishingStage UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content AND stage_code = 'publishing'), (SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @publishing ORDER BY sequence_no));
DECLARE @analyticsStage UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content AND stage_code = 'analytics_collection'), (SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @analytics ORDER BY sequence_no));
DECLARE @learningStage UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @content AND stage_code = 'learning_feedback'), (SELECT TOP 1 id FROM workflow_stages WHERE workflow_definition_id = @learning ORDER BY sequence_no));

DECLARE @queue UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM job_queues WHERE organization_id = @org AND name = 'workflow-execution');
DECLARE @publishQueue UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM job_queues WHERE organization_id = @org AND name = 'publishing');
DECLARE @analyticsQueue UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM job_queues WHERE organization_id = @org AND name = 'analytics');
DECLARE @agent UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM ai_agents WHERE organization_id = @org ORDER BY created_at);
IF @agent IS NULL
BEGIN
  SET @agent = NEWID();
  INSERT INTO ai_agents(id, organization_id, name, status) VALUES (@agent, @org, 'Autonomous Content Agent', 'operational');
END;

DECLARE @active TABLE (
  code NVARCHAR(40),
  definition_id UNIQUEIDENTIFIER,
  stage_id UNIQUEIDENTIFIER,
  status NVARCHAR(40),
  progress DECIMAL(8,2),
  stage_progress DECIMAL(8,2),
  priority NVARCHAR(40),
  trigger_name NVARCHAR(160),
  reference_id NVARCHAR(120),
  queue_name NVARCHAR(160),
  worker_name NVARCHAR(160),
  approval_state NVARCHAR(80),
  recovery_state NVARCHAR(80),
  bottleneck NVARCHAR(220),
  sla_status NVARCHAR(80),
  final_output_state NVARCHAR(80),
  analytics_state NVARCHAR(80),
  learning_state NVARCHAR(80),
  eta_minutes INT,
  action_state NVARCHAR(220),
  guardrail_status NVARCHAR(80)
);

INSERT INTO @active VALUES
('AW-001', @content, @researchStage, 'running', 32, 67, 'high', 'content_brief.created', 'BRIEF-1001', 'workflow-execution', 'worker-lagos-01', 'auto-approved', 'none', 'none detected', 'within_sla', 'on_track', 'configured', 'pending', 34, 'continuing research synthesis', 'within_guardrails'),
('AW-002', @content, @approvalStage, 'awaiting_approval', 71, 45, 'high', 'quality_gate.completed', 'CONTENT-2044', 'workflow-execution', 'worker-lagos-02', 'auto-approval-evaluating', 'none', 'approval delay', 'at_risk', 'at_risk', 'pending', 'pending', 52, 'evaluating auto-approval guardrails', 'within_guardrails'),
('AW-003', @content, @publishingStage, 'recovering', 84, 40, 'critical', 'schedule.window.opened', 'POST-8801', 'publishing', 'publisher-02', 'auto-approved', 'provider_switch', 'publishing delay', 'at_risk', 'recovering', 'pending', 'pending', 24, 'switched publishing provider after timeout', 'within_guardrails'),
('AW-004', @analytics, @analyticsStage, 'running', 62, 73, 'medium', 'publish.completed', 'PUB-5112', 'analytics', 'analytics-01', 'auto-approved', 'none', 'analytics delay', 'within_sla', 'on_track', 'collecting', 'pending', 41, 'triggering analytics collection', 'within_guardrails'),
('AW-005', @learning, @learningStage, 'waiting', 91, 18, 'medium', 'analytics.ready', 'AN-7710', 'learning', 'learning-01', 'auto-approved', 'none', 'dependency wait', 'within_sla', 'ready', 'collected', 'pending', 18, 'waiting for learning dependency', 'within_guardrails'),
('AW-006', @content, @researchStage, 'retrying', 28, 31, 'high', 'campaign.requested', 'CMP-3100', 'workflow-execution', 'worker-lagos-03', 'auto-approved', 'stage_retry', 'AI provider latency', 'at_risk', 'at_risk', 'pending', 'pending', 66, 'retrying with lower-latency provider', 'within_guardrails'),
('AW-007', @content, @publishingStage, 'blocked', 76, 0, 'critical', 'publish.package.ready', 'PKG-1880', 'publishing', 'publisher-01', 'auto-approved', 'incident_escalation', 'storage delay', 'breached', 'blocked', 'pending', 'pending', 88, 'created incident after recovery paths failed', 'exceeds_guardrails'),
('AW-008', @content, @analyticsStage, 'completing', 96, 82, 'low', 'analytics.finalized', 'AN-9002', 'analytics', 'analytics-02', 'auto-approved', 'none', 'none detected', 'within_sla', 'ready', 'collected', 'learning_triggered', 9, 'triggered learning feedback', 'within_guardrails');

DECLARE @code NVARCHAR(40), @definition UNIQUEIDENTIFIER, @stage UNIQUEIDENTIFIER, @status NVARCHAR(40), @progress DECIMAL(8,2), @stageProgress DECIMAL(8,2), @priority NVARCHAR(40), @trigger NVARCHAR(160), @reference NVARCHAR(120), @queueName NVARCHAR(160), @worker NVARCHAR(160), @approvalState NVARCHAR(80), @recoveryState NVARCHAR(80), @bottleneck NVARCHAR(220), @sla NVARCHAR(80), @output NVARCHAR(80), @analyticsState NVARCHAR(80), @learningState NVARCHAR(80), @eta INT, @action NVARCHAR(220), @guardrail NVARCHAR(80);
DECLARE active_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @active;
OPEN active_cursor;
FETCH NEXT FROM active_cursor INTO @code, @definition, @stage, @status, @progress, @stageProgress, @priority, @trigger, @reference, @queueName, @worker, @approvalState, @recoveryState, @bottleneck, @sla, @output, @analyticsState, @learningState, @eta, @action, @guardrail;
WHILE @@FETCH_STATUS = 0
BEGIN
  DECLARE @instance UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_instances WHERE organization_id = @org AND correlation_id = @code);
  IF @instance IS NULL
  BEGIN
    SET @instance = NEWID();
    INSERT INTO workflow_instances(id, organization_id, workflow_definition_id, workflow_version, reference_type, reference_id, status, current_stage_id, progress_percent, started_at, initiated_by, correlation_id, context_json, created_at, updated_at, is_active, is_deleted)
    VALUES (@instance, @org, @definition, 1, @trigger, @reference, @status, @stage, @progress, DATEADD(minute, -(@eta + 25), SYSUTCDATETIME()), 'autonomous-engine', @code, '{"mode":"fully_autonomous"}', DATEADD(minute, -(@eta + 25), SYSUTCDATETIME()), SYSUTCDATETIME(), 1, 0);
  END
  ELSE
  BEGIN
    UPDATE workflow_instances SET workflow_definition_id = @definition, status = @status, current_stage_id = @stage, progress_percent = @progress, reference_type = @trigger, reference_id = @reference, completed_at = NULL, stopped_at = NULL, updated_at = SYSUTCDATETIME(), is_active = 1, is_deleted = 0 WHERE id = @instance;
  END;

  IF NOT EXISTS (SELECT 1 FROM workflow_instance_steps WHERE workflow_instance_id = @instance AND workflow_stage_id = @stage)
    INSERT INTO workflow_instance_steps(workflow_instance_id, workflow_stage_id, status, progress_percent, started_at, retry_count, worker_id, created_at, updated_at)
    VALUES (@instance, @stage, @status, @stageProgress, DATEADD(minute, -20, SYSUTCDATETIME()), CASE WHEN @status IN ('retrying','recovering') THEN 1 ELSE 0 END, @worker, DATEADD(minute, -20, SYSUTCDATETIME()), SYSUTCDATETIME());
  ELSE
    UPDATE workflow_instance_steps SET status = @status, progress_percent = @stageProgress, retry_count = CASE WHEN @status IN ('retrying','recovering') THEN 1 ELSE retry_count END, worker_id = @worker, updated_at = SYSUTCDATETIME() WHERE workflow_instance_id = @instance AND workflow_stage_id = @stage;

  MERGE active_workflow_operations AS target
  USING (SELECT @instance AS workflow_instance_id) AS source
  ON target.workflow_instance_id = source.workflow_instance_id
  WHEN MATCHED THEN UPDATE SET priority = @priority, trigger_name = @trigger, queue_name = @queueName, worker_name = @worker, approval_state = @approvalState, recovery_state = @recoveryState, bottleneck = @bottleneck, sla_status = @sla, final_output_state = @output, analytics_state = @analyticsState, learning_state = @learningState, estimated_completion_at = DATEADD(minute, @eta, SYSUTCDATETIME()), current_action = @action, guardrail_status = @guardrail, organization_name = 'AI Media Group', brand_name = 'CACSMS Contents', owner_name = 'workflow-engine', updated_at = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (workflow_instance_id, priority, trigger_name, queue_name, worker_name, approval_state, recovery_state, bottleneck, sla_status, final_output_state, analytics_state, learning_state, organization_name, brand_name, owner_name, estimated_completion_at, current_action, guardrail_status)
  VALUES (@instance, @priority, @trigger, @queueName, @worker, @approvalState, @recoveryState, @bottleneck, @sla, @output, @analyticsState, @learningState, 'AI Media Group', 'CACSMS Contents', 'workflow-engine', DATEADD(minute, @eta, SYSUTCDATETIME()), @action, @guardrail);

  MERGE active_workflow_readiness AS target
  USING (SELECT @instance AS workflow_instance_id) AS source
  ON target.workflow_instance_id = source.workflow_instance_id
  WHEN MATCHED THEN UPDATE SET core_content_produced = CASE WHEN @progress >= 25 THEN 1 ELSE 0 END, validation_completed = CASE WHEN @progress >= 45 THEN 1 ELSE 0 END, approval_completed = CASE WHEN @progress >= 70 AND @approvalState NOT LIKE '%evaluating%' THEN 1 ELSE 0 END, required_assets_created = CASE WHEN @progress >= 60 THEN 1 ELSE 0 END, publishing_package_ready = CASE WHEN @progress >= 75 THEN 1 ELSE 0 END, publishing_completed = CASE WHEN @progress >= 90 THEN 1 ELSE 0 END, analytics_configured = CASE WHEN @analyticsState IN ('configured','collecting','collected') THEN 1 ELSE 0 END, analytics_collected = CASE WHEN @analyticsState = 'collected' THEN 1 ELSE 0 END, learning_feedback_completed = CASE WHEN @learningState = 'completed' THEN 1 ELSE 0 END, business_result_generated = CASE WHEN @output = 'ready' THEN 1 ELSE 0 END, readiness_percent = @progress, readiness_status = @output, updated_at = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (workflow_instance_id, core_content_produced, validation_completed, approval_completed, required_assets_created, publishing_package_ready, publishing_completed, analytics_configured, analytics_collected, learning_feedback_completed, business_result_generated, readiness_percent, readiness_status)
  VALUES (@instance, CASE WHEN @progress >= 25 THEN 1 ELSE 0 END, CASE WHEN @progress >= 45 THEN 1 ELSE 0 END, CASE WHEN @progress >= 70 AND @approvalState NOT LIKE '%evaluating%' THEN 1 ELSE 0 END, CASE WHEN @progress >= 60 THEN 1 ELSE 0 END, CASE WHEN @progress >= 75 THEN 1 ELSE 0 END, CASE WHEN @progress >= 90 THEN 1 ELSE 0 END, CASE WHEN @analyticsState IN ('configured','collecting','collected') THEN 1 ELSE 0 END, CASE WHEN @analyticsState = 'collected' THEN 1 ELSE 0 END, CASE WHEN @learningState = 'completed' THEN 1 ELSE 0 END, CASE WHEN @output = 'ready' THEN 1 ELSE 0 END, @progress, @output);

  IF @recoveryState <> 'none' AND NOT EXISTS (SELECT 1 FROM active_workflow_recovery_operations WHERE workflow_instance_id = @instance)
    INSERT INTO active_workflow_recovery_operations(workflow_instance_id, failure, recovery_strategy, policy_name, confidence_percent, progress_percent, jobs_protected, outputs_protected, expected_completion_at, outcome)
    VALUES (@instance, @bottleneck, @recoveryState, 'approved autonomous recovery guardrails', 86, CASE WHEN @status = 'blocked' THEN 35 ELSE 68 END, 2, 3, DATEADD(minute, @eta, SYSUTCDATETIME()), CASE WHEN @status = 'blocked' THEN 'guardrail_exceeded' ELSE 'in_progress' END);

  IF NOT EXISTS (SELECT 1 FROM active_workflow_decisions WHERE workflow_instance_id = @instance AND decision = @action)
    INSERT INTO active_workflow_decisions(workflow_instance_id, detection, decision, policy_name, confidence_percent, risk_level, action_taken, outcome, human_input_required)
    VALUES (@instance, @bottleneck, @action, 'autonomous workflow operations policy', 88, CASE WHEN @sla = 'breached' THEN 'high' WHEN @sla = 'at_risk' THEN 'medium' ELSE 'low' END, @action, @recoveryState, CASE WHEN @guardrail = 'exceeds_guardrails' THEN 1 ELSE 0 END);

  IF NOT EXISTS (SELECT 1 FROM background_jobs WHERE organization_id = @org AND name = CONCAT(@queueName, '-', @code))
    INSERT INTO background_jobs(organization_id, job_queue_id, name, status, priority, progress_percent, started_at, created_at, updated_at)
    VALUES (@org, CASE WHEN @queueName = 'publishing' THEN @publishQueue WHEN @queueName = 'analytics' THEN @analyticsQueue ELSE @queue END, CONCAT(@queueName, '-', @code), CASE WHEN @status IN ('blocked','waiting') THEN 'queued' ELSE 'running' END, @priority, @stageProgress, DATEADD(minute, -15, SYSUTCDATETIME()), DATEADD(minute, -16, SYSUTCDATETIME()), SYSUTCDATETIME());

  IF @agent IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ai_agent_runs WHERE workflow_instance_id = @instance)
    INSERT INTO ai_agent_runs(organization_id, agent_id, workflow_instance_id, workflow_stage_id, task_id, status, progress_percent, input_reference, output_reference, confidence_score, started_at, latency_ms, input_tokens, output_tokens, estimated_cost, retry_count, correlation_id, created_at, updated_at)
    VALUES (@org, @agent, @instance, @stage, NEWID(), CASE WHEN @status IN ('blocked','waiting') THEN 'queued' ELSE 'running' END, @stageProgress, @trigger, @output, 0.86, DATEADD(minute, -12, SYSUTCDATETIME()), 2400, 1600, 900, 0.014, CASE WHEN @status = 'retrying' THEN 1 ELSE 0 END, @code, DATEADD(minute, -12, SYSUTCDATETIME()), SYSUTCDATETIME());

  INSERT INTO workflow_events(organization_id, workflow_instance_id, event_name, payload_json, correlation_id)
  SELECT @org, @instance, 'workflow.active.stage.progress', CONCAT('{"stage":"', COALESCE((SELECT TOP 1 name FROM workflow_stages WHERE id = @stage), 'Active Stage'), '","progress":', @progress, '}'), @code
  WHERE NOT EXISTS (SELECT 1 FROM workflow_events WHERE workflow_instance_id = @instance AND event_name = 'workflow.active.stage.progress');

  FETCH NEXT FROM active_cursor INTO @code, @definition, @stage, @status, @progress, @stageProgress, @priority, @trigger, @reference, @queueName, @worker, @approvalState, @recoveryState, @bottleneck, @sla, @output, @analyticsState, @learningState, @eta, @action, @guardrail;
END
CLOSE active_cursor;
DEALLOCATE active_cursor;

DELETE FROM active_workflow_stage_metrics;
INSERT INTO active_workflow_stage_metrics(stage_name, stage_order, active_instances, completed_today, failed, recovering, avg_duration_seconds, queue_depth, stage_health, sla_risk, autonomous_actions)
VALUES
('Triggered', 1, 2, 18, 0, 0, 42, 3, 'healthy', 'low', 4),
('Validating', 2, 1, 16, 0, 0, 96, 2, 'healthy', 'low', 3),
('Planning', 3, 1, 14, 0, 0, 140, 2, 'healthy', 'low', 5),
('AI Execution', 4, 3, 21, 1, 1, 680, 8, 'watch', 'medium', 7),
('Content Production', 5, 2, 13, 0, 0, 540, 4, 'healthy', 'low', 2),
('Review', 6, 1, 11, 0, 0, 260, 2, 'healthy', 'low', 2),
('Approval', 7, 1, 8, 0, 0, 720, 3, 'watch', 'medium', 3),
('Scheduling', 8, 1, 7, 0, 0, 180, 2, 'healthy', 'low', 2),
('Publishing', 9, 2, 9, 1, 1, 840, 6, 'degraded', 'high', 6),
('Analytics', 10, 2, 10, 0, 0, 360, 4, 'watch', 'medium', 4),
('Learning', 11, 1, 6, 0, 0, 300, 2, 'healthy', 'low', 2),
('Final Result', 12, 1, 5, 0, 0, 120, 1, 'healthy', 'low', 1);
END;
