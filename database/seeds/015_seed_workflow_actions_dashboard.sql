SET NOCOUNT ON;

IF OBJECT_ID('workflow_actions', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('workflow_actions.view','View workflow actions'),('workflow_actions.create','Create workflow actions'),('workflow_actions.edit','Edit workflow actions'),('workflow_actions.validate','Validate workflow actions'),
  ('workflow_actions.test','Test workflow actions'),('workflow_actions.execute','Execute workflow actions'),('workflow_actions.publish','Publish workflow actions'),('workflow_actions.rollback','Roll back workflow actions'),
  ('workflow_actions.disable','Disable workflow actions'),('workflow_actions.archive','Archive workflow actions'),('workflow_actions.duplicate','Duplicate workflow actions'),('workflow_actions.view_trace','View workflow action trace'),
  ('workflow_actions.manage_recovery','Manage workflow action recovery'),('workflow_actions.manage_circuit_breakers','Manage workflow action circuit breakers'),('workflow_actions.apply_recommendations','Apply workflow action recommendations'),
  ('workflow_actions.generate_ai','Generate workflow actions with AI'),('workflow_actions.export','Export workflow actions'),('workflow_actions.manage_guardrails','Manage workflow action guardrails'),('workflow_actions.emergency_override','Use workflow action emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_actions.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-actions' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
  (@org,'ACTION_VALIDATION','Action Validation','workflow_actions'),(@org,'ACTION_TEST','Action Test','workflow_actions'),(@org,'ACTION_EXECUTION','Action Execution','workflow_actions'),
  (@org,'ACTION_RECOVERY','Action Recovery','workflow_actions'),(@org,'ACTION_CIRCUIT_BREAKER_RECOVERY','Action Circuit Breaker Recovery','workflow_actions'),
  (@org,'ACTION_VERSION_PUBLISH','Action Version Publish','workflow_actions'),(@org,'ACTION_OPTIMIZATION','Action Optimization','workflow_actions')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @execDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'ACTION_EXECUTION');
MERGE workflow_stages AS target
USING (VALUES
  (@org,@execDef,'action_requested','Action Requested',1),(@org,@execDef,'context_loaded','Context Loaded',2),(@org,@execDef,'permission_validated','Permission Validated',3),
  (@org,@execDef,'guardrails_evaluated','Guardrails Evaluated',4),(@org,@execDef,'idempotency_checked','Idempotency Checked',5),(@org,@execDef,'dependencies_validated','Dependencies Validated',6),
  (@org,@execDef,'queue_selected','Queue Selected',7),(@org,@execDef,'worker_selected','Worker Selected',8),(@org,@execDef,'resources_reserved','Resources Reserved',9),
  (@org,@execDef,'action_executed','Action Executed',10),(@org,@execDef,'output_validated','Output Validated',11),(@org,@execDef,'result_persisted','Result Persisted',12),
  (@org,@execDef,'recovery_executed','Recovery Executed if Required',13),(@org,@execDef,'audit_logged','Audit Logged',14),(@org,@execDef,'event_emitted','Event Emitted',15),
  (@org,@execDef,'metrics_recorded','Metrics Recorded',16),(@org,@execDef,'learning_updated','Learning Updated',17),(@org,@execDef,'completed','Completed',18)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
WHEN MATCHED THEN UPDATE SET name = source.name, sequence_no = source.sequence_no, display_order = source.sequence_no, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'action', 'sequential', 5.56, 'workflow_actions.execute', 'active');

DECLARE @actions TABLE(code NVARCHAR(120), name NVARCHAR(220), category NVARCHAR(160), action_type NVARCHAR(120), status NVARCHAR(40), exec_mode NVARCHAR(80), queue NVARCHAR(120), worker NVARCHAR(160), permission NVARCHAR(160), executions INT, success DECIMAL(8,2), failure DECIMAL(8,2), duration INT, cost DECIMAL(18,6), recovery DECIMAL(8,2), idem DECIMAL(8,2), readiness DECIMAL(8,2));
INSERT INTO @actions VALUES
('ACT-SYS-001','Start System Service','System Control Actions','Restart Service','active','fully_autonomous','workflow-actions','system-workers','system.start',820,99.4,0.6,900,0.001,1.0,99.9,82),
('ACT-WF-002','Start Workflow','Workflow Actions','Start Workflow','active','fully_autonomous','workflow-actions','workflow-workers','workflow.execute',5200,99.1,0.9,1100,0.002,1.8,99.8,94),
('ACT-AI-003','Run AI Agent','AI Agent Actions','Run AI Agent','active','fully_autonomous','workflow-actions','ai-workers','workflow_actions.execute',7800,98.4,1.2,2800,0.018,4.5,99.5,88),
('ACT-CONTENT-004','Generate Content Brief','Content Actions','Create Research Brief','active','fully_autonomous','workflow-actions','content-workers','workflow_actions.execute',6200,98.9,0.8,1900,0.006,2.3,99.7,90),
('ACT-CREATIVE-005','Generate Brand Visual','Creative Actions','Generate Brand Visual','active','fully_autonomous','workflow-actions','creative-workers','workflow_actions.execute',2400,97.8,1.7,3600,0.028,5.5,99.2,78),
('ACT-IMAGE-006','Generate Thumbnail','Image Actions','Generate Thumbnail','active','fully_autonomous','workflow-actions','image-workers','workflow_actions.execute',3100,98.2,1.1,2400,0.012,3.1,99.4,83),
('ACT-VOICE-007','Generate Narration','Voice and Audio Actions','Generate Narration','active','fully_autonomous','workflow-actions','voice-workers','workflow_actions.execute',1800,98.0,1.4,4100,0.021,6.0,99.3,81),
('ACT-VIDEO-008','Render Video','Video Actions','Render Video','warning','fully_autonomous','workflow-actions','video-workers','workflow_actions.execute',960,94.8,4.6,8400,0.065,12.0,98.4,70),
('ACT-APPROVAL-009','Auto Approve Output','Approval Actions','Auto-Approve','active','fully_autonomous','workflow-actions','approval-workers','workflow.approve',4400,99.3,0.4,700,0.001,0.6,99.9,95),
('ACT-PUBLISH-010','Publish Content','Publishing Actions','Publish Content','active','fully_autonomous','workflow-actions','publishing-workers','workflow_actions.execute',2900,98.1,1.5,2600,0.009,4.2,99.5,92),
('ACT-ANALYTICS-011','Collect Metrics','Analytics Actions','Collect Metrics','active','fully_autonomous','workflow-actions','analytics-workers','workflow_actions.execute',7400,99.2,0.5,1200,0.002,0.8,99.8,89),
('ACT-LEARNING-012','Extract Feedback','Learning Actions','Extract Feedback','active','fully_autonomous','workflow-actions','learning-workers','workflow_actions.execute',1900,98.6,0.9,1600,0.004,1.5,99.6,86),
('ACT-MONITOR-013','Run Health Check','Monitoring Actions','Run Health Check','active','fully_autonomous','workflow-actions','monitor-workers','workflow_actions.execute',9800,99.6,0.2,500,0.001,0.2,99.9,84),
('ACT-INCIDENT-014','Create Incident','Incident Actions','Create Incident','active','fully_autonomous','workflow-actions','incident-workers','workflow_actions.execute',410,98.0,1.8,1300,0.003,5.0,99.5,78),
('ACT-WORKER-015','Restart Worker','Worker Actions','Restart Worker','active','fully_autonomous','workflow-actions','ops-workers','background_jobs.retry',670,97.9,1.7,2200,0.002,9.0,99.0,75),
('ACT-QUEUE-016','Rebalance Queue','Queue Actions','Rebalance Queue','active','fully_autonomous','workflow-actions','queue-workers','workflow_actions.execute',1550,98.8,0.9,1400,0.002,3.3,99.8,82),
('ACT-NOTIFY-017','Send Notification','Notification Actions','Send Notification','active','fully_autonomous','workflow-actions','notify-workers','workflow_actions.execute',12400,99.4,0.3,400,0.001,0.1,99.9,68),
('ACT-INTEG-018','Call Webhook','Integration Actions','Call Webhook','active','fully_autonomous','workflow-actions','integration-workers','workflow_actions.execute',3600,97.4,2.1,1800,0.004,7.2,99.1,77),
('ACT-COMP-019','Compliance Boundary Check','Compliance Actions','Run Moderation','active','fully_autonomous','workflow-actions','compliance-workers','workflow_actions.execute',2200,99.0,0.7,1000,0.003,1.0,99.9,91),
('ACT-SEC-020','Security Boundary Check','Security Actions','Run Diagnostic','active','fully_autonomous','workflow-actions','security-workers','workflow_actions.execute',880,98.7,0.9,1600,0.004,2.0,99.8,85),
('ACT-DB-021','Run Database Backup','Database Actions','Run Database Backup','active','fully_autonomous','workflow-actions','database-workers','workflow_actions.execute',96,99.8,0.1,6200,0.015,0.0,100,72),
('ACT-STOR-022','Upload Asset','Storage Actions','Upload Asset','active','fully_autonomous','workflow-actions','storage-workers','workflow_actions.execute',5300,98.9,0.8,1500,0.003,2.4,99.7,87),
('ACT-REPORT-023','Create Report','Reporting Actions','Create Report','active','fully_autonomous','workflow-actions','report-workers','workflow_actions.execute',760,99.0,0.6,2100,0.004,0.7,99.7,74),
('ACT-COST-024','Cost Guardrail Check','Cost Optimization Actions','Calculate Forecast','active','fully_autonomous','workflow-actions','cost-workers','workflow_actions.execute',1800,99.3,0.4,800,0.001,0.2,99.9,88);

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @category NVARCHAR(160), @type NVARCHAR(120), @status NVARCHAR(40), @mode NVARCHAR(80), @queue NVARCHAR(120), @worker NVARCHAR(160), @permission NVARCHAR(160), @exec INT, @success DECIMAL(8,2), @failure DECIMAL(8,2), @duration INT, @cost DECIMAL(18,6), @recovery DECIMAL(8,2), @idem DECIMAL(8,2), @readiness DECIMAL(8,2);
DECLARE action_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @actions;
OPEN action_cursor;
FETCH NEXT FROM action_cursor INTO @code,@name,@category,@type,@status,@mode,@queue,@worker,@permission,@exec,@success,@failure,@duration,@cost,@recovery,@idem,@readiness;
WHILE @@FETCH_STATUS = 0
BEGIN
  DECLARE @cat UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_action_categories WHERE organization_id=@org AND category_name=@category);
  IF @cat IS NULL BEGIN SET @cat = NEWID(); INSERT INTO workflow_action_categories(id, organization_id, category_name, description) VALUES (@cat,@org,@category,CONCAT('Reusable autonomous ', LOWER(@category))); END;
  DECLARE @action UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_actions WHERE organization_id=@org AND action_code=@code);
  IF @action IS NULL
  BEGIN
    SET @action = NEWID();
    INSERT INTO workflow_actions(id, workflow_definition_id, organization_id, action_code, action_name, description, category_id, action_type, status, current_version, published_version, execution_mode, queue_name, worker_pool_id, required_permission, timeout_seconds, rate_limit, idempotency_enabled, retry_enabled, recovery_enabled, owner_id, environment)
    VALUES (@action,@execDef,@org,@code,@name,CONCAT('Reusable autonomous action for ', LOWER(@category), ' with permission checks, idempotency, retry, recovery, audit, cost control, and final-output linkage.'),@cat,@type,@status,3,3,@mode,@queue,@worker,@permission,180,120,1,1,1,'action-engine','production');
  END
  ELSE
    UPDATE workflow_actions SET action_name=@name, category_id=@cat, action_type=@type, status=@status, worker_pool_id=@worker, required_permission=@permission, updated_at=SYSUTCDATETIME() WHERE id=@action;

  IF NOT EXISTS (SELECT 1 FROM workflow_action_versions WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_versions(workflow_action_id, version_number, status, change_summary, validation_status, test_status, published_environment, execution_count, success_rate, rollback_eligible) VALUES (@action,3,'published','Production action baseline','passed','passed','production',@exec,@success,1);
  IF NOT EXISTS (SELECT 1 FROM workflow_action_handlers WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_handlers(workflow_action_id, handler_name, handler_type, config_json) VALUES (@action,CONCAT(@code,'.handler'),'managed-worker','{"mode":"autonomous"}');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_input_schemas WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_input_schemas(workflow_action_id,input_schema,required_fields,optional_fields,default_values,validation_rules,sensitive_fields,examples) VALUES (@action,'{"type":"object"}','["reference","organizationId"]','["brand","context"]','{}','schema validation required','["token","secret"]','{"reference":"sample"}');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_output_schemas WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_output_schemas(workflow_action_id,output_schema,output_mapping,storage_destination,retention_policy,examples) VALUES (@action,'{"type":"object"}','{"result":"output.result"}','content-output-store','standard','{"result":"ok"}');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_permissions WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_permissions(workflow_action_id,required_permission,role_restrictions,service_account_access,tenant_isolation,data_classification) VALUES (@action,@permission,'["system"]','action-engine',1,'internal');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_guardrails WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_guardrails(workflow_action_id,cost_ceiling,risk_threshold,confirmation_requirement,security_boundary,maximum_batch_size,maximum_retry_count,maximum_execution_duration_seconds) VALUES (@action,100,80,'outside guardrails only','tenant-boundary',100,3,600);
  IF NOT EXISTS (SELECT 1 FROM workflow_action_reliability_policies WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_reliability_policies(workflow_action_id,idempotency_strategy,retry_policy,backoff_policy,circuit_breaker_policy,dead_letter_behavior,compensation_action,rollback_action) VALUES (@action,CONCAT(@code,':{{reference}}'),'retry:3','exponential','open after 5 failures','move to dead letter','compensate partial output','rollback output');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_retry_policies WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_retry_policies(workflow_action_id,max_attempts,backoff_seconds,retry_on) VALUES (@action,3,30,'transient failures');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_recovery_policies WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_recovery_policies(workflow_action_id,recovery_policy,fallback_action,incident_creation) VALUES (@action,'approved autonomous recovery','fallback action',CASE WHEN @status='warning' THEN 1 ELSE 0 END);

  MERGE workflow_action_metrics AS target
  USING (SELECT @action AS workflow_action_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
  ON target.workflow_action_id=source.workflow_action_id AND target.metric_date=source.metric_date
  WHEN MATCHED THEN UPDATE SET executions_today=@exec, success_rate=@success, failure_rate=@failure, avg_duration_ms=@duration, p95_duration_ms=@duration*2, avg_cost=@cost, total_cost=@exec*@cost, recovery_rate=@recovery, idempotency_protection_rate=@idem, circuit_breaker_events=CASE WHEN @status='warning' THEN 1 ELSE 0 END, final_output_readiness=@readiness
  WHEN NOT MATCHED THEN INSERT (workflow_action_id, executions_today, success_rate, failure_rate, avg_duration_ms, p95_duration_ms, avg_cost, total_cost, recovery_rate, idempotency_protection_rate, circuit_breaker_events, final_output_readiness)
  VALUES (@action,@exec,@success,@failure,@duration,@duration*2,@cost,@exec*@cost,@recovery,@idem,CASE WHEN @status='warning' THEN 1 ELSE 0 END,@readiness);

  IF NOT EXISTS (SELECT 1 FROM workflow_action_executions WHERE workflow_action_id=@action)
  BEGIN
    DECLARE @execution UNIQUEIDENTIFIER = NEWID();
    INSERT INTO workflow_action_executions(id, workflow_action_id, organization_id, triggered_by, workflow_reference, reference_id, status, queue_name, worker_name, attempt, progress_percent, duration_ms, cost, retry_used, recovery_used, idempotency_status, output_status, started_at)
    VALUES (@execution,@action,@org,'automation-engine','ACTION_EXECUTION',@code,CASE WHEN @status='warning' THEN 'Recovering' ELSE 'Completed' END,@queue,@worker,1,100,@duration,@cost,CASE WHEN @failure > 1 THEN 1 ELSE 0 END,CASE WHEN @recovery > 5 THEN 1 ELSE 0 END,'protected','validated',DATEADD(minute,-@duration/100,SYSUTCDATETIME()));
    INSERT INTO workflow_action_execution_steps(workflow_action_execution_id,step_name,status,duration_ms,evidence,decision,confidence_percent,risk_level,component,audit_reference)
    VALUES (@execution,'Permission Validated','completed',40,'permission granted','continue',99,'low','permission-evaluator',CONCAT(@code,'-audit'));
    INSERT INTO workflow_action_outputs(workflow_action_execution_id,output_reference,output_status,storage_destination) VALUES (@execution,CONCAT(@code,'-output'),'validated','content-output-store');
  END;
  IF @recovery > 5 AND NOT EXISTS (SELECT 1 FROM workflow_action_recoveries WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_recoveries(workflow_action_id,failure,strategy,policy_name,attempt,progress_percent,output_protected,expected_recovery_at,outcome) VALUES (@action,'transient dependency failure','Retry Different Worker','approved autonomous recovery',2,68,1,DATEADD(minute,15,SYSUTCDATETIME()),'in_progress');
  IF @status='warning' AND NOT EXISTS (SELECT 1 FROM workflow_action_circuit_breakers WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_circuit_breakers(workflow_action_id,dependency,state,failure_threshold,failure_count,opened_at,retry_at,fallback_action,impact,recovery_status) VALUES (@action,@worker,'Half Open',5,3,DATEADD(minute,-20,SYSUTCDATETIME()),DATEADD(minute,10,SYSUTCDATETIME()),'fallback action','latency and failure risk','recovering');
  IF NOT EXISTS (SELECT 1 FROM workflow_action_recommendations WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_recommendations(workflow_action_id,recommendation_type,title,description,impact,confidence_percent,inside_guardrails) VALUES (@action,'optimization',CONCAT('Tune ', @category, ' policy'),'Autonomous optimizer recommends timeout, retry, queue, worker, cost, or output-validation tuning based on live execution outcomes.',CASE WHEN @readiness > 85 THEN 'high' ELSE 'medium' END,88,1);
  IF NOT EXISTS (SELECT 1 FROM workflow_action_final_output_links WHERE workflow_action_id=@action)
    INSERT INTO workflow_action_final_output_links(workflow_action_id,workflow_stage,output_name,storage_state,approval_state,publishing_state,analytics_state,learning_state,readiness_percent,linkage_status) VALUES (@action,@category,CONCAT(@name,' Output'),'persisted','approved','ready','configured','learning-ready',@readiness,CASE WHEN @readiness >= 80 THEN 'complete linkage' ELSE 'needs optimization' END);

  FETCH NEXT FROM action_cursor INTO @code,@name,@category,@type,@status,@mode,@queue,@worker,@permission,@exec,@success,@failure,@duration,@cost,@recovery,@idem,@readiness;
END
CLOSE action_cursor;
DEALLOCATE action_cursor;
END;
