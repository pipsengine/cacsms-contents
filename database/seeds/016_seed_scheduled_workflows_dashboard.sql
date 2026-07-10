SET NOCOUNT ON;

IF OBJECT_ID('workflow_schedules', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('workflow_schedules.view','View workflow schedules'),('workflow_schedules.create','Create workflow schedules'),('workflow_schedules.edit','Edit workflow schedules'),
  ('workflow_schedules.validate','Validate workflow schedules'),('workflow_schedules.simulate','Simulate workflow schedules'),('workflow_schedules.publish','Publish workflow schedules'),
  ('workflow_schedules.rollback','Roll back workflow schedules'),('workflow_schedules.pause','Pause workflow schedules'),('workflow_schedules.resume','Resume workflow schedules'),
  ('workflow_schedules.run_now','Run workflow schedule now'),('workflow_schedules.skip_run','Skip scheduled run'),('workflow_schedules.resolve_conflicts','Resolve workflow schedule conflicts'),
  ('workflow_schedules.manage_calendars','Manage schedule calendars'),('workflow_schedules.manage_policies','Manage schedule policies'),('workflow_schedules.apply_recommendations','Apply schedule recommendations'),
  ('workflow_schedules.generate_ai','Generate schedules with AI'),('workflow_schedules.export','Export workflow schedules'),('workflow_schedules.emergency_override','Use workflow schedule emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_schedules.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-scheduler' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
  (@org,'SCHEDULE_VALIDATION','Schedule Validation','workflow_schedules'),(@org,'SCHEDULE_SIMULATION','Schedule Simulation','workflow_schedules'),
  (@org,'SCHEDULE_EXECUTION','Schedule Execution','workflow_schedules'),(@org,'SCHEDULE_MISSED_RUN_RECOVERY','Schedule Missed Run Recovery','workflow_schedules'),
  (@org,'SCHEDULE_CONFLICT_RESOLUTION','Schedule Conflict Resolution','workflow_schedules'),(@org,'SCHEDULE_CAPACITY_OPTIMIZATION','Schedule Capacity Optimization','workflow_schedules'),
  (@org,'SCHEDULE_VERSION_PUBLISH','Schedule Version Publish','workflow_schedules')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @execDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'SCHEDULE_EXECUTION');
MERGE workflow_stages AS target
USING (VALUES
  (@org,@execDef,'schedule_due','Schedule Due',1),(@org,@execDef,'schedule_state_validated','Schedule State Validated',2),(@org,@execDef,'calendar_rules_evaluated','Calendar Rules Evaluated',3),
  (@org,@execDef,'blackout_rules_evaluated','Blackout Rules Evaluated',4),(@org,@execDef,'concurrency_checked','Concurrency Checked',5),(@org,@execDef,'capacity_checked','Capacity Checked',6),
  (@org,@execDef,'conflict_detection','Conflict Detection',7),(@org,@execDef,'workflow_readiness_validated','Workflow Readiness Validated',8),(@org,@execDef,'queue_selected','Queue Selected',9),
  (@org,@execDef,'workflow_instance_created','Workflow Instance Created',10),(@org,@execDef,'execution_confirmed','Execution Confirmed',11),(@org,@execDef,'metrics_recorded','Metrics Recorded',12),
  (@org,@execDef,'next_run_calculated','Next Run Calculated',13),(@org,@execDef,'learning_updated','Learning Updated',14),(@org,@execDef,'completed','Completed',15)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
WHEN MATCHED THEN UPDATE SET name = source.name, sequence_no = source.sequence_no, display_order = source.sequence_no, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'schedule', 'sequential', 6.67, 'workflow_schedules.view', 'active');

MERGE workflow_schedule_missed_run_policies AS target
USING (VALUES (@org,'recalculate','Recalculate next best time'),(@org,'run immediately','Run immediately'),(@org,'skip safely','Skip safely'),(@org,'run once','Run once'),(@org,'run all missed','Run all missed')) AS source(organization_id, policy_name, behavior)
ON target.organization_id=source.organization_id AND target.policy_name=source.policy_name
WHEN NOT MATCHED THEN INSERT (organization_id, policy_name, behavior) VALUES (source.organization_id, source.policy_name, source.behavior);
MERGE workflow_schedule_concurrency_policies AS target
USING (VALUES (@org,'prevent overlap',1,'block overlapping executions'),(@org,'queue overlap',2,'queue overlapping executions'),(@org,'allow high priority',3,'allow protected high-priority overlap')) AS source(organization_id, policy_name, max_overlap, behavior)
ON target.organization_id=source.organization_id AND target.policy_name=source.policy_name
WHEN NOT MATCHED THEN INSERT (organization_id, policy_name, max_overlap, behavior) VALUES (source.organization_id, source.policy_name, source.max_overlap, source.behavior);
MERGE workflow_schedule_capacity_classes AS target
USING (VALUES (@org,'standard',1,'cpu'),(@org,'render-heavy',5,'video render'),(@org,'ai-heavy',4,'ai provider'),(@org,'publishing-critical',3,'publishing'),(@org,'maintenance',2,'ops')) AS source(organization_id, class_name, capacity_weight, resource_profile)
ON target.organization_id=source.organization_id AND target.class_name=source.class_name
WHEN NOT MATCHED THEN INSERT (organization_id, class_name, capacity_weight, resource_profile) VALUES (source.organization_id, source.class_name, source.capacity_weight, source.resource_profile);

DECLARE @items TABLE(code NVARCHAR(120), name NVARCHAR(220), type_name NVARCHAR(160), frequency NVARCHAR(120), cron NVARCHAR(160), status NVARCHAR(40), priority NVARCHAR(40), queue NVARCHAR(120), worker NVARCHAR(160), capacity NVARCHAR(160), brand NVARCHAR(180), next_minutes INT, executions INT, success DECIMAL(8,2), missed INT, recovery INT, delay INT, readiness DECIMAL(8,2));
INSERT INTO @items VALUES
('SCH-ONE-001','One-Time Launch Workflow','One-Time Schedules','one-time',NULL,'active','high','workflow-scheduler','launch-workers','publishing-critical','CACSMS Contents',24,32,99.1,0,1,32,94),
('SCH-HOUR-002','Hourly Content Intake','Hourly Schedules','hourly','0 * * * *','active','high','workflow-scheduler','content-workers','standard','AI Media Group',18,144,98.8,1,3,44,91),
('SCH-DAY-003','Daily Research Pipeline','Daily Schedules','daily','0 6 * * *','active','medium','workflow-scheduler','research-workers','ai-heavy','AI Media Group',55,28,98.7,0,1,26,90),
('SCH-WEEK-004','Weekly Editorial Planner','Weekly Schedules','weekly','0 8 * * MON','active','medium','workflow-scheduler','planning-workers','standard','CACSMS Contents',320,5,99.0,0,0,12,88),
('SCH-MONTH-005','Monthly Performance Report','Monthly Schedules','monthly','0 9 1 * *','active','medium','workflow-scheduler','report-workers','standard','CACSMS Contents',1440,2,99.5,0,0,8,86),
('SCH-CRON-006','Cron Metadata Refresh','Cron Schedules','cron','*/15 * * * *','active','medium','workflow-scheduler','metadata-workers','standard','CACSMS Contents',9,96,99.3,0,0,18,85),
('SCH-BIZ-007','Business Calendar Approval Sweep','Business Calendar Schedules','business-calendar','0 10 * * 1-5','active','high','workflow-scheduler','approval-workers','publishing-critical','CACSMS Contents',42,22,99.4,0,1,15,96),
('SCH-CONT-008','Content Calendar Production Run','Content Calendar Schedules','content-calendar','0 7 * * *','active','high','workflow-scheduler','content-workers','ai-heavy','AI Media Group',21,64,98.5,1,2,52,89),
('SCH-PUB-009','Publishing Calendar Release','Publishing Calendar Schedules','publishing-calendar','0 17 * * *','active','critical','workflow-scheduler','publishing-workers','publishing-critical','CACSMS Contents',38,41,98.9,0,1,23,97),
('SCH-CAMP-010','Campaign Launch Sequence','Campaign Schedules','campaign','30 8 * * *','active','critical','workflow-scheduler','campaign-workers','publishing-critical','AI Media Group',44,18,98.0,1,2,61,92),
('SCH-ANA-011','Analytics Collection','Analytics Schedules','hourly','10 * * * *','active','medium','workflow-scheduler','analytics-workers','standard','CACSMS Contents',14,132,99.2,0,0,20,86),
('SCH-LEARN-012','Learning Feedback Extraction','Learning Schedules','daily','0 4 * * *','active','medium','workflow-scheduler','learning-workers','standard','CACSMS Contents',126,18,98.6,0,1,35,84),
('SCH-MON-013','Monitoring Health Sweep','Monitoring Schedules','every-5-minutes','*/5 * * * *','active','high','workflow-scheduler','monitor-workers','standard','CACSMS Contents',4,288,99.8,0,0,6,82),
('SCH-MAINT-014','Maintenance Window Check','Maintenance Schedules','daily','0 2 * * *','active','medium','workflow-scheduler','ops-workers','maintenance','CACSMS Contents',210,8,99.1,0,0,10,80),
('SCH-DB-015','Database Backup Schedule','Database Backup Schedules','daily','0 1 * * *','active','high','workflow-scheduler','database-workers','maintenance','CACSMS Contents',190,6,99.7,0,0,14,82),
('SCH-REP-016','Report Distribution','Report Schedules','weekly','0 11 * * FRI','active','medium','workflow-scheduler','report-workers','standard','AI Media Group',420,4,99.0,0,0,19,79),
('SCH-SYNC-017','Integration Sync','Integration Sync Schedules','hourly','20 * * * *','warning','medium','workflow-scheduler','integration-workers','standard','CACSMS Contents',28,72,96.8,2,5,88,76),
('SCH-AI-018','AI-Optimized Publish Time','AI-Optimized Schedules','ai-optimized','AI','active','high','workflow-scheduler','ai-workers','ai-heavy','AI Media Group',33,37,98.4,0,2,29,93),
('SCH-EVENT-019','Event-Assisted Campaign Follow-Up','Event-Assisted Schedules','event-assisted','event+cron','active','high','workflow-scheduler','campaign-workers','publishing-critical','AI Media Group',49,26,98.2,1,1,45,87),
('SCH-SLA-020','SLA-Driven Urgent Recheck','SLA-Driven Schedules','sla-driven','*/10 * * * *','active','critical','workflow-scheduler','sla-workers','standard','CACSMS Contents',7,168,99.0,0,1,16,95);

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @type NVARCHAR(160), @freq NVARCHAR(120), @cron NVARCHAR(160), @status NVARCHAR(40), @priority NVARCHAR(40), @queue NVARCHAR(120), @worker NVARCHAR(160), @cap NVARCHAR(160), @brand NVARCHAR(180), @next INT, @exec INT, @success DECIMAL(8,2), @missed INT, @recovery INT, @delay INT, @ready DECIMAL(8,2);
DECLARE schedule_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @items;
OPEN schedule_cursor;
FETCH NEXT FROM schedule_cursor INTO @code,@name,@type,@freq,@cron,@status,@priority,@queue,@worker,@cap,@brand,@next,@exec,@success,@missed,@recovery,@delay,@ready;
WHILE @@FETCH_STATUS = 0
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_types WHERE organization_id=@org AND type_name=@type)
    INSERT INTO workflow_schedule_types(organization_id,type_name,description) VALUES (@org,@type,CONCAT('Autonomous ', LOWER(@type)));
  DECLARE @miss UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_schedule_missed_run_policies WHERE organization_id=@org AND policy_name=CASE WHEN @missed > 0 THEN 'recalculate' ELSE 'skip safely' END);
  DECLARE @conc UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_schedule_concurrency_policies WHERE organization_id=@org AND policy_name=CASE WHEN @priority='critical' THEN 'allow high priority' ELSE 'prevent overlap' END);
  DECLARE @class UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_schedule_capacity_classes WHERE organization_id=@org AND class_name=@cap);
  DECLARE @schedule UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_schedules WHERE organization_id=@org AND schedule_code=@code);
  IF @schedule IS NULL
  BEGIN
    SET @schedule = NEWID();
    INSERT INTO workflow_schedules(id, organization_id, schedule_code, schedule_name, description, workflow_definition_id, workflow_version, schedule_type, frequency, cron_expression, timezone, start_at, end_at, status, priority, queue_name, worker_pool_id, concurrency_policy_id, missed_run_policy_id, optimization_enabled, capacity_class_id, owner_id, brand, environment, current_version, published_version, next_run_at, previous_run_at, last_result, sla_minutes)
    VALUES (@schedule,@org,@code,@name,CONCAT('Autonomous schedule for ', LOWER(@type), ' with calendar, capacity, missed-run, conflict, recovery, audit, and final-output controls.'),@execDef,3,@type,@freq,COALESCE(@cron,'one-time'),'Africa/Lagos',DATEADD(day,-60,SYSUTCDATETIME()),NULL,@status,@priority,@queue,@worker,@conc,@miss,1,@class,'scheduler-engine',@brand,'production',3,3,DATEADD(minute,@next,SYSUTCDATETIME()),DATEADD(hour,-3,SYSUTCDATETIME()),CASE WHEN @missed > 0 THEN 'Recovered' ELSE 'Completed' END,CASE WHEN @priority='critical' THEN 30 ELSE 60 END);
  END
  ELSE
    UPDATE workflow_schedules SET schedule_name=@name, schedule_type=@type, frequency=@freq, cron_expression=COALESCE(@cron,'one-time'), status=@status, priority=@priority, next_run_at=DATEADD(minute,@next,SYSUTCDATETIME()), worker_pool_id=@worker, updated_at=SYSUTCDATETIME() WHERE id=@schedule;

  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_versions WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_versions(workflow_schedule_id,version_number,status,change_summary,validation_status,simulation_status,published_environment) VALUES (@schedule,3,'published','Production schedule baseline','passed','passed','production');
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_calendars WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_calendars(workflow_schedule_id,business_calendar,publishing_calendar,campaign_calendar,holiday_policy,weekend_policy,fiscal_period) VALUES (@schedule,'Nigeria Business Calendar','CACSMS Publishing Calendar','Campaign Calendar','skip and recalculate','allowed by policy','current');
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_windows WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_windows(workflow_schedule_id,window_name,starts_at,ends_at,capacity_risk) VALUES (@schedule,'primary execution window',DATEADD(minute,@next,SYSUTCDATETIME()),DATEADD(minute,@next+45,SYSUTCDATETIME()),CASE WHEN @delay > 60 THEN 'medium' ELSE 'low' END);
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_optimization_policies WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_optimization_policies(workflow_schedule_id,optimize_for_audience,optimize_for_cost,optimize_for_capacity,optimize_for_sla,max_shift_minutes,confidence_percent) VALUES (@schedule,1,1,1,1,45,87);

  MERGE workflow_schedule_metrics AS target
  USING (SELECT @schedule AS workflow_schedule_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
  ON target.workflow_schedule_id=source.workflow_schedule_id AND target.metric_date=source.metric_date
  WHEN MATCHED THEN UPDATE SET executions_today=@exec, success_rate=@success, missed_runs=@missed, recovery_count=@recovery, average_delay_seconds=@delay, average_duration_seconds=@delay+240, sla_compliance=@success, queue_wait_seconds=@delay, worker_utilization=72, cost_today=@exec*0.002, final_output_readiness=@ready
  WHEN NOT MATCHED THEN INSERT (workflow_schedule_id, executions_today, success_rate, missed_runs, recovery_count, average_delay_seconds, average_duration_seconds, sla_compliance, queue_wait_seconds, worker_utilization, cost_today, final_output_readiness)
  VALUES (@schedule,@exec,@success,@missed,@recovery,@delay,@delay+240,@success,@delay,72,@exec*0.002,@ready);

  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_executions WHERE workflow_schedule_id=@schedule)
  BEGIN
    DECLARE @run UNIQUEIDENTIFIER = NEWID();
    INSERT INTO workflow_schedule_executions(id,workflow_schedule_id,organization_id,planned_start,actual_start,delay_seconds,status,duration_seconds,queue_name,worker_name,recovery_used,sla_result,output_result,publishing_result,analytics_result,learning_result,cost)
    VALUES (@run,@schedule,@org,DATEADD(hour,-3,SYSUTCDATETIME()),DATEADD(second,@delay,DATEADD(hour,-3,SYSUTCDATETIME())),@delay,CASE WHEN @missed > 0 THEN 'Recovered' ELSE 'Completed' END,@delay+240,@queue,@worker,CASE WHEN @recovery > 0 THEN 1 ELSE 0 END,'met','validated','ready','configured','updated',@exec*0.0001);
    INSERT INTO workflow_schedule_execution_steps(workflow_schedule_execution_id,step_name,status,duration_ms,evidence) VALUES (@run,'Calendar Rules Evaluated','completed',35,'calendar accepted');
  END
  IF @missed > 0 AND NOT EXISTS (SELECT 1 FROM workflow_schedule_failures WHERE workflow_schedule_id=@schedule)
  BEGIN
    INSERT INTO workflow_schedule_failures(workflow_schedule_id,failure_reason,recoverability) VALUES (@schedule,'missed run detected by scheduler scan','recoverable');
    INSERT INTO workflow_schedule_recoveries(workflow_schedule_id,strategy,progress_percent,outcome) VALUES (@schedule,'recalculate next best time and requeue',100,'Recovered');
  END
  IF @delay > 60 AND NOT EXISTS (SELECT 1 FROM workflow_schedule_conflicts WHERE primary_schedule_id=@schedule)
    INSERT INTO workflow_schedule_conflicts(organization_id,primary_schedule_id,time_window,conflict_type,impact,capacity_impact,sla_impact,final_output_impact,recommended_resolution,auto_resolution_available,governance_approval_required,status)
    VALUES (@org,@schedule,CONVERT(NVARCHAR(30),DATEADD(minute,@next,SYSUTCDATETIME()),126),'capacity overlap','queue and worker pool pressure','medium','low','protected','shift lower-priority workflows by 20 minutes',1,0,'open');
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_recommendations WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_recommendations(workflow_schedule_id,recommendation_type,current_scheduled_time,suggested_scheduled_time,reason,confidence_percent,expected_engagement_improvement,expected_cost_impact,expected_capacity_impact,expected_sla_impact,auto_apply_eligible)
    VALUES (@schedule,'optimization',DATEADD(minute,@next,SYSUTCDATETIME()),DATEADD(minute,@next+20,SYSUTCDATETIME()),'AI scheduler recommends a lower-load, higher-confidence execution window.',88,CASE WHEN @type LIKE '%Publishing%' THEN 7 ELSE 2 END,-0.02,'reduced queue pressure','improved',1);
  IF NOT EXISTS (SELECT 1 FROM workflow_schedule_final_output_links WHERE workflow_schedule_id=@schedule)
    INSERT INTO workflow_schedule_final_output_links(workflow_schedule_id,output_name,workflow_state,execution_state,output_state,approval_state,publishing_state,analytics_state,learning_state,business_result_state,readiness_percent,linkage_status)
    VALUES (@schedule,CONCAT(@name,' Output'),'valid','ready','validated','approved','ready','configured','learning-ready','measurable',@ready,CASE WHEN @ready >= 85 THEN 'complete linkage' ELSE 'needs optimization' END);

  FETCH NEXT FROM schedule_cursor INTO @code,@name,@type,@freq,@cron,@status,@priority,@queue,@worker,@cap,@brand,@next,@exec,@success,@missed,@recovery,@delay,@ready;
END
CLOSE schedule_cursor;
DEALLOCATE schedule_cursor;

IF NOT EXISTS (SELECT 1 FROM workflow_schedule_forecasts WHERE organization_id=@org)
BEGIN
  INSERT INTO workflow_schedule_forecasts(organization_id,forecast_window_start,forecast_window_end,scheduled_workflows,queue_depth,worker_demand,gpu_demand,ai_provider_demand,video_render_demand,storage_demand,publishing_demand,analytics_demand,expected_cost,sla_risk,capacity_gap,planned_scaling,final_output_risk)
  VALUES
  (@org,SYSUTCDATETIME(),DATEADD(hour,1,SYSUTCDATETIME()),34,48,22,4,7,5,6,8,9,42.50,'low',0,'current capacity sufficient','low'),
  (@org,SYSUTCDATETIME(),DATEADD(hour,6,SYSUTCDATETIME()),128,180,62,12,18,14,22,26,31,164.20,'medium',3,'scale render and ai workers before campaign window','medium'),
  (@org,SYSUTCDATETIME(),DATEADD(hour,24,SYSUTCDATETIME()),248,320,94,18,29,24,37,42,58,390.70,'medium',3,'stagger video rendering and publishing','medium');
END;
END;
