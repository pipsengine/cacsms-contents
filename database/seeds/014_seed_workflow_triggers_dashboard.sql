SET NOCOUNT ON;

IF OBJECT_ID('workflow_triggers', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('workflow_triggers.view','View workflow triggers'), ('workflow_triggers.create','Create workflow triggers'), ('workflow_triggers.edit','Edit workflow triggers'),
  ('workflow_triggers.validate','Validate workflow triggers'), ('workflow_triggers.test','Test workflow triggers'), ('workflow_triggers.publish','Publish workflow triggers'),
  ('workflow_triggers.rollback','Roll back workflow triggers'), ('workflow_triggers.disable','Disable workflow triggers'), ('workflow_triggers.duplicate','Duplicate workflow triggers'),
  ('workflow_triggers.replay','Replay trigger events'), ('workflow_triggers.manage_dead_letters','Manage dead-letter trigger events'), ('workflow_triggers.resolve_conflicts','Resolve trigger conflicts'),
  ('workflow_triggers.apply_recommendations','Apply trigger recommendations'), ('workflow_triggers.generate_ai','Generate workflow triggers with AI'), ('workflow_triggers.export','Export workflow triggers'),
  ('workflow_triggers.manage_guardrails','Manage trigger guardrails'), ('workflow_triggers.emergency_override','Use trigger emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_triggers.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-triggers' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
  (@org, 'TRIGGER_VALIDATION', 'Trigger Validation', 'workflow_triggers'),
  (@org, 'TRIGGER_TEST', 'Trigger Test', 'workflow_triggers'),
  (@org, 'TRIGGER_EXECUTION', 'Trigger Execution', 'workflow_triggers'),
  (@org, 'TRIGGER_EVENT_REPLAY', 'Trigger Event Replay', 'workflow_triggers'),
  (@org, 'TRIGGER_DEAD_LETTER_RECOVERY', 'Trigger Dead Letter Recovery', 'workflow_triggers'),
  (@org, 'TRIGGER_CONFLICT_RESOLUTION', 'Trigger Conflict Resolution', 'workflow_triggers'),
  (@org, 'TRIGGER_OPTIMIZATION', 'Trigger Optimization', 'workflow_triggers')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @execDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'TRIGGER_EXECUTION');
MERGE workflow_stages AS target
USING (VALUES
  (@org, @execDef, 'event_received', 'Event Received', 1), (@org, @execDef, 'schema_validated', 'Event Schema Validated', 2),
  (@org, @execDef, 'organization_resolved', 'Organization Resolved', 3), (@org, @execDef, 'scope_evaluated', 'Scope Evaluated', 4),
  (@org, @execDef, 'duplicate_check', 'Duplicate Check', 5), (@org, @execDef, 'throttle_check', 'Throttle Check', 6),
  (@org, @execDef, 'candidate_triggers_selected', 'Candidate Triggers Selected', 7), (@org, @execDef, 'conditions_evaluated', 'Conditions Evaluated', 8),
  (@org, @execDef, 'priority_resolved', 'Priority Resolved', 9), (@org, @execDef, 'workflow_input_mapped', 'Workflow Input Mapped', 10),
  (@org, @execDef, 'workflow_started', 'Workflow Started', 11), (@org, @execDef, 'activation_confirmed', 'Activation Confirmed', 12),
  (@org, @execDef, 'audit_logged', 'Audit Logged', 13), (@org, @execDef, 'metrics_recorded', 'Metrics Recorded', 14),
  (@org, @execDef, 'learning_updated', 'Learning Updated', 15), (@org, @execDef, 'completed', 'Completed', 16)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
WHEN MATCHED THEN UPDATE SET name = source.name, sequence_no = source.sequence_no, display_order = source.sequence_no, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'trigger', 'sequential', 6.25, 'workflow_triggers.view', 'active');

DECLARE @contentWorkflow UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_LIFECYCLE');
DECLARE @publishingWorkflow UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_PUBLISHING');
DECLARE @analyticsWorkflow UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'ANALYTICS_COLLECTION');
DECLARE @learningWorkflow UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'LEARNING_FEEDBACK');
DECLARE @defaultWorkflow UNIQUEIDENTIFIER = COALESCE(@contentWorkflow, (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org));

DECLARE @triggers TABLE(code NVARCHAR(120), name NVARCHAR(220), trigger_type NVARCHAR(80), category NVARCHAR(120), source_system NVARCHAR(180), event_name NVARCHAR(180), workflow_id UNIQUEIDENTIFIER, priority NVARCHAR(40), status NVARCHAR(40), events INT, started INT, success DECIMAL(8,2), failures INT, dupes INT, delayed INT, latency INT, readiness DECIMAL(8,2));
INSERT INTO @triggers VALUES
('TRG-EVENT-001','Content Idea Created Event','Event','Event Triggers','event-bus','content.idea.created',@contentWorkflow,'high','active',15880,4120,99.4,12,188,4,24,94),
('TRG-SCHEDULE-002','Daily Publishing Window','Schedule','Schedule Triggers','scheduler','publishing.window.open',@publishingWorkflow,'high','active',4200,1290,99.1,8,55,6,30,92),
('TRG-API-003','Content Intake API Trigger','API','API Triggers','api-gateway','content.intake.received',@contentWorkflow,'medium','active',8200,2310,98.8,18,95,8,32,88),
('TRG-WEBHOOK-004','External Campaign Webhook','Webhook','Webhook Triggers','integrations','campaign.webhook.received',@contentWorkflow,'medium','warning',3880,740,96.5,30,210,14,62,76),
('TRG-DB-005','Content Status Database Change','Database Change','Database Triggers','mssql-cdc','content.status.changed',@contentWorkflow,'medium','active',9440,1820,99.2,11,82,3,26,90),
('TRG-FILE-006','Asset File Arrival','File Arrival','File Triggers','storage-watcher','asset.file.arrived',@contentWorkflow,'medium','active',2440,690,98.9,9,44,5,38,84),
('TRG-CONTENT-007','Content Quality Event','Workflow State','Content Triggers','content-engine','content.quality.passed',@contentWorkflow,'high','active',7100,2088,99.5,6,51,2,22,96),
('TRG-WF-008','Workflow Stage Completed','Workflow State','Workflow-State Triggers','workflow-engine','workflow.stage.completed',@defaultWorkflow,'high','active',18900,4010,99.0,22,300,5,28,91),
('TRG-AI-009','AI Agent Output Ready','AI Agent Result','AI Agent Result Triggers','ai-orchestrator','agent.output.ready',@contentWorkflow,'high','active',11980,2770,98.7,25,134,9,35,87),
('TRG-QUEUE-010','Queue Threshold Trigger','Queue Threshold','Queue Threshold Triggers','bullmq','queue.threshold.exceeded',@defaultWorkflow,'critical','active',3030,640,97.9,19,104,12,52,80),
('TRG-WORKER-011','Worker Health Degraded','Worker Health','Worker Health Triggers','workers','worker.health.degraded',@defaultWorkflow,'critical','active',980,210,98.3,7,12,3,41,78),
('TRG-SERVICE-012','Service Health Warning','Service Health','Service Health Triggers','service-health','service.warning',@defaultWorkflow,'critical','active',1310,280,98.6,6,18,4,44,82),
('TRG-APIHEALTH-013','API Health Degraded','API Health','API Health Triggers','api-monitor','api.health.degraded',@defaultWorkflow,'critical','active',870,170,97.6,8,9,2,49,79),
('TRG-INCIDENT-014','Incident Created Trigger','Incident Event','Incident Triggers','incident-manager','incident.created',@defaultWorkflow,'critical','active',420,110,98.8,2,4,1,33,83),
('TRG-PUBLISH-015','Publishing Completed','Publishing Event','Publishing Triggers','publishing','publish.completed',@analyticsWorkflow,'high','active',3320,1280,99.3,7,28,2,25,93),
('TRG-ANALYTICS-016','Analytics Threshold Reached','Analytics Threshold','Analytics Triggers','analytics','analytics.threshold.reached',@learningWorkflow,'medium','active',2880,680,98.9,7,33,4,31,88),
('TRG-LEARNING-017','Learning Recommendation','Learning Recommendation','Learning Triggers','learning','learning.recommendation.created',@learningWorkflow,'medium','active',1440,360,98.4,5,14,2,36,86),
('TRG-COST-018','AI Cost Threshold','Cost Threshold','Cost Threshold Triggers','ai-usage','cost.threshold.exceeded',@defaultWorkflow,'high','active',760,95,99.1,1,8,1,29,89),
('TRG-SEC-019','Security Boundary Event','Security Event','Security Triggers','security','security.boundary.exceeded',@defaultWorkflow,'critical','active',210,72,98.0,3,1,1,54,77),
('TRG-MAINT-020','Maintenance Schedule','Schedule','Maintenance Triggers','scheduler','maintenance.window.open',@defaultWorkflow,'low','active',610,84,99.6,1,2,0,20,70),
('TRG-MANUAL-021','Manual Emergency Trigger','Manual','Manual Emergency Triggers','system-control','manual.emergency.requested',@defaultWorkflow,'critical','disabled',0,0,100,0,0,0,0,40);

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @type NVARCHAR(80), @category NVARCHAR(120), @source NVARCHAR(180), @event NVARCHAR(180), @workflow UNIQUEIDENTIFIER, @priority NVARCHAR(40), @status NVARCHAR(40), @events INT, @started INT, @success DECIMAL(8,2), @failures INT, @dupes INT, @delayed INT, @latency INT, @readiness DECIMAL(8,2);
DECLARE trigger_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @triggers;
OPEN trigger_cursor;
FETCH NEXT FROM trigger_cursor INTO @code,@name,@type,@category,@source,@event,@workflow,@priority,@status,@events,@started,@success,@failures,@dupes,@delayed,@latency,@readiness;
WHILE @@FETCH_STATUS = 0
BEGIN
  DECLARE @src UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_trigger_sources WHERE organization_id = @org AND source_system = @source);
  IF @src IS NULL
  BEGIN
    SET @src = NEWID();
    INSERT INTO workflow_trigger_sources(id, organization_id, source_name, source_system, topic_channel, endpoint, provider, service_name, authentication_method)
    VALUES (@src, @org, @source, @source, CONCAT(@source, '.events'), CONCAT('https://internal/', @source), @source, @source, 'managed identity');
  END;
  DECLARE @trigger UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_triggers WHERE organization_id = @org AND trigger_code = @code);
  IF @trigger IS NULL
  BEGIN
    SET @trigger = NEWID();
    INSERT INTO workflow_triggers(id, organization_id, trigger_code, trigger_name, description, trigger_type, category, source_id, event_name, target_workflow_id, target_workflow_version, priority, status, environment, debounce_ms, throttle_limit, deduplication_window_seconds, retry_policy_id, dead_letter_enabled, owner_id, current_version, published_version)
    VALUES (@trigger, @org, @code, @name, CONCAT('Autonomous trigger for ', LOWER(@category), ' with validation, deduplication, retry, dead-letter handling, replay, audit, and final-output linkage.'), @type, @category, @src, @event, @workflow, 1, @priority, @status, 'production', 30000, 120, 300, 'retry:3 exponential', 1, 'trigger-engine', 3, 3);
  END
  ELSE
    UPDATE workflow_triggers SET trigger_name=@name, trigger_type=@type, category=@category, source_id=@src, event_name=@event, target_workflow_id=@workflow, priority=@priority, status=@status, updated_at=SYSUTCDATETIME() WHERE id=@trigger;

  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_event_schemas WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_event_schemas(workflow_trigger_id, input_schema, required_fields, optional_fields, validation_rules, sample_event, sensitive_fields, redaction_rules)
    VALUES (@trigger, '{"type":"object"}', '["eventId","organizationId","timestamp"]', '["brand","reference"]', 'schema validation required', '{"eventId":"sample","payload":{}}', '["token","secret"]', 'redact sensitive fields');
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_scopes WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_scopes(workflow_trigger_id, scope_type, scope_value) VALUES (@trigger, 'organization', 'AI Media Group');
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_condition_groups WHERE workflow_trigger_id=@trigger)
  BEGIN
    DECLARE @group UNIQUEIDENTIFIER = NEWID();
    INSERT INTO workflow_trigger_condition_groups(id, workflow_trigger_id, boolean_operator, group_order) VALUES (@group, @trigger, 'AND', 1);
    INSERT INTO workflow_trigger_conditions(condition_group_id, field_path, operator, compare_value, context_variable, fallback_value) VALUES (@group, 'system.status', 'equals', 'operational', 'systemStatus', 'operational');
  END;
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_mappings WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_mappings(workflow_trigger_id, workflow_definition_id, input_mapping, reference_mapping, queue_name, correlation_strategy) VALUES (@trigger, @workflow, '{"reference":"event.reference"}', 'event.reference', 'workflow-triggers', 'eventId');
  IF @type = 'Schedule' AND NOT EXISTS (SELECT 1 FROM workflow_trigger_schedules WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_schedules(workflow_trigger_id, schedule_type, recurrence, missed_run_policy, next_run_at, previous_run_at) VALUES (@trigger, 'Cron', '0 */4 * * *', 'recalculate', DATEADD(hour, 4, SYSUTCDATETIME()), DATEADD(hour, -4, SYSUTCDATETIME()));
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_reliability_policies WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_reliability_policies(workflow_trigger_id, idempotency_key, replay_policy, retry_policy, timeout_seconds, dead_letter_queue, rate_limit_per_minute) VALUES (@trigger, CONCAT(@code, ':{{eventId}}'), 'safe replay', 'retry:3 exponential', 120, 'workflow-trigger-dead-letter', 120);
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_guardrails WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_guardrails(workflow_trigger_id, cost_limit, security_boundary, required_permission, tenant_isolation, max_workflow_launches, escalation_rule) VALUES (@trigger, 25, 'tenant-boundary', 'workflow_triggers.view', 1, 1000, 'outside guardrails only');
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_versions WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_versions(workflow_trigger_id, version_number, status, change_summary, validation_status, test_status, published_environment, execution_count, success_rate, rollback_eligible) VALUES (@trigger, 3, 'published', 'Production trigger baseline', 'passed', 'passed', 'production', @events, @success, 1);

  MERGE workflow_trigger_metrics AS target
  USING (SELECT @trigger AS workflow_trigger_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
  ON target.workflow_trigger_id=source.workflow_trigger_id AND target.metric_date=source.metric_date
  WHEN MATCHED THEN UPDATE SET events_received_today=@events, workflows_started=@started, success_rate=@success, failure_count=@failures, duplicate_suppression_count=@dupes, delayed_events=@delayed, average_latency_ms=@latency, dead_letter_count=CASE WHEN @failures > 15 THEN 2 ELSE 0 END, replay_success_rate=98, final_output_readiness=@readiness
  WHEN NOT MATCHED THEN INSERT (workflow_trigger_id, events_received_today, workflows_started, success_rate, failure_count, duplicate_suppression_count, delayed_events, average_latency_ms, dead_letter_count, replay_success_rate, final_output_readiness)
  VALUES (@trigger,@events,@started,@success,@failures,@dupes,@delayed,@latency,CASE WHEN @failures > 15 THEN 2 ELSE 0 END,98,@readiness);

  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_events WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_events(organization_id, workflow_trigger_id, event_id, source, event_type, correlation_id, validation_status, candidate_triggers, matched_triggers, workflow_launched, processing_duration_ms, outcome, payload_redacted)
    VALUES (@org, @trigger, CONCAT(@code, '-EVT-001'), @source, @event, CONCAT(@code, '-CORR'), 'valid', 3, 1, CASE WHEN @started > 0 THEN 1 ELSE 0 END, @latency, 'processed', '{"redacted":true}');
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_executions WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_executions(workflow_trigger_id, organization_id, event_id, matched, workflow_started, status, duration_ms, duplicate_suppressed, throttled, retry_used, created_at)
    VALUES (@trigger, @org, CONCAT(@code, '-EVT-001'), 1, CASE WHEN @started > 0 THEN 1 ELSE 0 END, CASE WHEN @status='warning' THEN 'Recovering' ELSE 'Completed' END, @latency, CASE WHEN @dupes > 100 THEN 1 ELSE 0 END, CASE WHEN @delayed > 10 THEN 1 ELSE 0 END, CASE WHEN @failures > 10 THEN 1 ELSE 0 END, DATEADD(minute, -@latency, SYSUTCDATETIME()));
  IF @failures > 15 AND NOT EXISTS (SELECT 1 FROM workflow_trigger_dead_letters WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_dead_letters(organization_id, workflow_trigger_id, event_id, source, event_type, failure_reason, validation_error, retry_count, last_retry_at, related_workflow, recoverability, recommended_action, status)
    VALUES (@org, @trigger, CONCAT(@code, '-DLQ-001'), @source, @event, 'Schema mismatch after retry policy', 'missing required reference', 3, DATEADD(minute, -10, SYSUTCDATETIME()), COALESCE((SELECT TOP 1 name FROM workflow_definitions WHERE id=@workflow), 'workflow'), 'Recoverable', 'Correct schema mapping and replay event', 'Retrying');
  IF NOT EXISTS (SELECT 1 FROM workflow_trigger_recommendations WHERE workflow_trigger_id=@trigger)
    INSERT INTO workflow_trigger_recommendations(workflow_trigger_id, recommendation_type, title, description, impact, confidence_percent, inside_guardrails)
    VALUES (@trigger, 'optimization', CONCAT('Tune ', @category, ' reliability policy'), 'Autonomous optimizer recommends debounce, throttle, deduplication, or retry tuning based on observed trigger outcomes.', CASE WHEN @readiness > 85 THEN 'high' ELSE 'medium' END, 88, 1);

  FETCH NEXT FROM trigger_cursor INTO @code,@name,@type,@category,@source,@event,@workflow,@priority,@status,@events,@started,@success,@failures,@dupes,@delayed,@latency,@readiness;
END
CLOSE trigger_cursor;
DEALLOCATE trigger_cursor;

DECLARE @primary UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_triggers WHERE organization_id=@org AND trigger_code='TRG-WEBHOOK-004');
DECLARE @conflicting UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_triggers WHERE organization_id=@org AND trigger_code='TRG-API-003');
IF @primary IS NOT NULL AND NOT EXISTS (SELECT 1 FROM workflow_trigger_conflicts WHERE primary_trigger_id=@primary)
  INSERT INTO workflow_trigger_conflicts(organization_id, primary_trigger_id, conflicting_trigger_id, source, event_name, conflict_type, impact, risk_score, suggested_resolution, auto_resolution_available)
  VALUES (@org, @primary, @conflicting, 'integrations', 'campaign.webhook.received', 'overlapping scope', 'Webhook and API trigger can launch duplicate content lifecycle workflows.', 72, 'Prefer webhook trigger when signed payload is valid; suppress API duplicate by idempotency key.', 1);
END;
