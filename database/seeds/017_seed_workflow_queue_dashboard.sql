SET NOCOUNT ON;

IF OBJECT_ID('workflow_queues', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('workflow_queue.view','View workflow queue'),('workflow_queue.view_items','View workflow queue items'),('workflow_queue.view_details','View workflow queue details'),
  ('workflow_queue.view_priority_trace','View workflow queue priority trace'),('workflow_queue.view_recovery','View workflow queue recovery'),('workflow_queue.view_dead_letters','View workflow queue dead letters'),
  ('workflow_queue.run_diagnostic','Run workflow queue diagnostic'),('workflow_queue.recalculate_priorities','Recalculate workflow queue priorities'),('workflow_queue.rebalance','Rebalance workflow queue'),
  ('workflow_queue.retry','Retry workflow queue item'),('workflow_queue.recover','Recover workflow queue item'),('workflow_queue.reassign','Reassign workflow queue item'),
  ('workflow_queue.move_items','Move workflow queue items'),('workflow_queue.manage_capacity','Manage workflow queue capacity'),('workflow_queue.manage_dead_letters','Manage workflow queue dead letters'),
  ('workflow_queue.export','Export workflow queue report'),('workflow_queue.pause','Pause workflow queue'),('workflow_queue.resume','Resume workflow queue'),('workflow_queue.drain','Drain workflow queue'),
  ('workflow_queue.cancel','Cancel workflow queue item'),('workflow_queue.emergency_override','Use workflow queue emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_queue.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-queue-control' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
  (@org,'QUEUE_HEALTH_SCAN','Queue Health Scan','workflow_queue'),(@org,'QUEUE_PRIORITY_RECALCULATION','Queue Priority Recalculation','workflow_queue'),
  (@org,'QUEUE_CONGESTION_PREVENTION','Queue Congestion Prevention','workflow_queue'),(@org,'QUEUE_AUTONOMOUS_REBALANCE','Queue Autonomous Rebalance','workflow_queue'),
  (@org,'QUEUE_STUCK_ITEM_RECOVERY','Queue Stuck Item Recovery','workflow_queue'),(@org,'QUEUE_DEAD_LETTER_RECOVERY','Queue Dead Letter Recovery','workflow_queue'),
  (@org,'QUEUE_CAPACITY_OPTIMIZATION','Queue Capacity Optimization','workflow_queue'),(@org,'QUEUE_SLA_PROTECTION','Queue SLA Protection','workflow_queue')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @rebalanceDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='QUEUE_AUTONOMOUS_REBALANCE');
MERGE workflow_stages AS target
USING (VALUES
(@org,@rebalanceDef,'detect_queue_imbalance','Detect Queue Imbalance',1),(@org,@rebalanceDef,'validate_metrics','Validate Metrics',2),(@org,@rebalanceDef,'identify_affected_workflows','Identify Affected Workflows',3),(@org,@rebalanceDef,'calculate_sla_risk','Calculate SLA Risk',4),
(@org,@rebalanceDef,'calculate_capacity_gap','Calculate Capacity Gap',5),(@org,@rebalanceDef,'protect_critical_items','Protect Critical Items',6),(@org,@rebalanceDef,'select_rebalancing_strategy','Select Rebalancing Strategy',7),(@org,@rebalanceDef,'acquire_distributed_lock','Acquire Distributed Lock',8),
(@org,@rebalanceDef,'move_or_reassign_items','Move or Reassign Items',9),(@org,@rebalanceDef,'scale_worker_capacity','Scale Worker Capacity if Required',10),(@org,@rebalanceDef,'validate_queue_health','Validate Queue Health',11),(@org,@rebalanceDef,'validate_workflow_continuity','Validate Workflow Continuity',12),
(@org,@rebalanceDef,'record_decision','Record Decision',13),(@org,@rebalanceDef,'update_metrics','Update Metrics',14),(@org,@rebalanceDef,'release_lock','Release Lock',15),(@org,@rebalanceDef,'complete','Complete',16)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id=source.workflow_definition_id AND target.stage_code=source.stage_code
WHEN MATCHED THEN UPDATE SET name=source.name, sequence_no=source.sequence_no, display_order=source.sequence_no, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'queue', 'sequential', 6.25, 'workflow_queue.rebalance', 'active');

DECLARE @queues TABLE(code NVARCHAR(120), name NVARCHAR(220), category NVARCHAR(160), status NVARCHAR(40), waiting INT, active INT, delayed INT, retrying INT, failed INT, dead INT, workers INT, desired INT, throughput DECIMAL(18,2), wait DECIMAL(18,2), sla INT, health DECIMAL(8,2), state NVARCHAR(120), action NVARCHAR(500));
INSERT INTO @queues VALUES
('Q-SYS','System Control Queue','System Control','Healthy',18,6,1,0,0,0,4,4,42,4.2,0,99,'steady','protected critical control flows'),
('Q-WF','Workflow Execution Queue','Workflow Execution','Optimizing',420,86,32,12,2,1,24,28,188,18.4,4,96,'rebalance-ready','shifted low priority jobs to standby queue'),
('Q-TRIG','Trigger Processing Queue','Trigger Processing','Healthy',210,44,12,4,1,0,12,12,160,8.8,1,98,'steady','deduplicated trigger events'),
('Q-RULE','Automation Rules Queue','Automation Rules','Healthy',166,32,10,5,0,0,10,10,144,9.5,1,98,'steady','priority recalculated'),
('Q-APPROVAL','Approval Evaluation Queue','Approval','Healthy',96,18,8,2,0,0,8,8,88,11.2,1,97,'steady','approval deadlines protected'),
('Q-AI-RESEARCH','AI Research Queue','AI','Scaling',310,54,26,14,3,2,16,22,72,29.1,5,91,'scaling','added ai research workers'),
('Q-AI-WRITE','AI Writing Queue','AI','Optimizing',268,49,22,11,2,1,14,18,81,23.4,3,93,'optimizing','provider-aware retry enabled'),
('Q-CREATIVE','Creative Generation Queue','Creative','Healthy',180,30,14,7,1,0,10,12,65,17.9,2,94,'steady','batched compatible creative jobs'),
('Q-IMAGE','Image Generation Queue','Image','Healthy',146,28,10,4,0,0,9,10,70,13.2,1,96,'steady','matched gpu workers'),
('Q-VOICE','Voice and Audio Queue','Audio','Healthy',92,16,7,3,0,0,7,8,58,12.6,1,96,'steady','voice provider quota respected'),
('Q-VIDEO','Video Rendering Queue','Video','Congested',382,72,44,22,5,6,18,28,38,46.7,9,82,'scaling','video render queue scaled'),
('Q-PUBLISH','Publishing Queue','Publishing','Rebalancing',132,24,16,5,1,1,10,14,54,21.8,3,90,'rebalancing','critical publishing jobs protected'),
('Q-ANALYTICS','Analytics Queue','Analytics','Healthy',118,20,8,3,0,0,8,8,92,10.1,0,98,'steady','analytics shifted outside peak'),
('Q-LEARN','Learning Queue','Learning','Healthy',84,12,5,2,0,0,6,6,50,14.4,0,97,'steady','learning checkpoints preserved'),
('Q-NOTIFY','Notification Queue','Notification','Healthy',76,10,3,1,0,0,5,5,120,6.3,0,99,'steady','notification digest batched'),
('Q-INTEG','Integration Queue','Integration','Recovering',120,18,14,8,2,2,8,11,40,33.1,2,88,'recovering','webhook items replayed'),
('Q-MON','Monitoring Queue','Monitoring','Healthy',64,14,2,1,0,0,6,6,135,5.2,0,99,'steady','health checks prioritized'),
('Q-INC','Incident Management Queue','Incident','Healthy',24,8,2,1,0,0,5,5,44,7.5,0,99,'steady','incident actions isolated'),
('Q-WORKER','Worker Supervision Queue','Worker Supervision','Healthy',38,10,3,1,0,0,6,6,48,8.4,0,98,'steady','lease validation active'),
('Q-DB','Database Maintenance Queue','Database','Healthy',18,4,2,0,0,0,4,4,20,9.7,0,99,'steady','maintenance windows respected'),
('Q-REPORT','Report Generation Queue','Reporting','Healthy',54,8,6,2,0,0,5,6,32,16.2,1,95,'steady','reports staggered'),
('Q-STORAGE','Storage Processing Queue','Storage','Optimizing',112,18,9,4,1,0,8,9,62,15.6,1,95,'optimizing','storage workers rebalanced'),
('Q-DEAD','Dead-Letter Queue','Recovery','Recovering',0,0,0,0,0,18,4,6,8,0,0,86,'recovering','recoverable dead letters replaying'),
('Q-RECOVERY','Recovery Queue','Recovery','Healthy',52,10,8,3,1,0,8,8,30,19.1,2,94,'steady','stuck items recovered');

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @cat NVARCHAR(160), @status NVARCHAR(40), @waiting INT, @active INT, @delayed INT, @retrying INT, @failed INT, @dead INT, @workers INT, @desired INT, @throughput DECIMAL(18,2), @wait DECIMAL(18,2), @sla INT, @health DECIMAL(8,2), @state NVARCHAR(120), @action NVARCHAR(500);
DECLARE queue_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @queues;
OPEN queue_cursor;
FETCH NEXT FROM queue_cursor INTO @code,@name,@cat,@status,@waiting,@active,@delayed,@retrying,@failed,@dead,@workers,@desired,@throughput,@wait,@sla,@health,@state,@action;
WHILE @@FETCH_STATUS = 0
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workflow_queue_categories WHERE organization_id=@org AND category_name=@cat)
    INSERT INTO workflow_queue_categories(organization_id,category_name,description) VALUES (@org,@cat,CONCAT('Autonomous ', LOWER(@cat), ' queue category'));
  DECLARE @queue UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queues WHERE organization_id=@org AND queue_code=@code);
  IF @queue IS NULL
  BEGIN
    SET @queue = NEWID();
    INSERT INTO workflow_queues(id,organization_id,queue_code,queue_name,category,status,waiting_count,active_count,delayed_count,retrying_count,failed_count,dead_letter_count,workers,desired_workers,throughput_per_minute,average_wait_seconds,oldest_item_at,sla_risk_count,health_percent,rebalancing_state,last_autonomous_action)
    VALUES (@queue,@org,@code,@name,@cat,@status,@waiting,@active,@delayed,@retrying,@failed,@dead,@workers,@desired,@throughput,@wait,DATEADD(second,-@wait*10,SYSUTCDATETIME()),@sla,@health,@state,@action);
  END
  ELSE
    UPDATE workflow_queues SET queue_name=@name, category=@cat, status=@status, waiting_count=@waiting, active_count=@active, delayed_count=@delayed, retrying_count=@retrying, failed_count=@failed, dead_letter_count=@dead, workers=@workers, desired_workers=@desired, throughput_per_minute=@throughput, average_wait_seconds=@wait, sla_risk_count=@sla, health_percent=@health, rebalancing_state=@state, last_autonomous_action=@action, updated_at=SYSUTCDATETIME() WHERE id=@queue;

  IF NOT EXISTS (SELECT 1 FROM workflow_queue_retry_policies WHERE workflow_queue_id=@queue)
    INSERT INTO workflow_queue_retry_policies(workflow_queue_id,policy_name,max_attempts,current_retries,success_after_retry,average_recovery_seconds,dead_letter_rate,cost_impact) VALUES (@queue,'Exponential with Jitter',3,@retrying,82,120,CASE WHEN @dead>0 THEN 2.4 ELSE 0.3 END,@retrying*0.01);
  MERGE workflow_queue_metrics AS target
  USING (SELECT @queue AS workflow_queue_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
  ON target.workflow_queue_id=source.workflow_queue_id AND target.metric_date=source.metric_date
  WHEN MATCHED THEN UPDATE SET queue_depth=@waiting+@active+@delayed+@retrying, dispatch_rate=@throughput, throughput=@throughput, completion_rate=@health, retry_rate=@retrying, recovery_rate=CASE WHEN @status='Recovering' THEN 78 ELSE 92 END, dead_letter_rate=@dead, sla_compliance=100-@sla, worker_utilization=CASE WHEN @desired=0 THEN 0 ELSE (@workers*100.0/@desired) END, cost_today=(@waiting+@active)*0.002, final_output_completion_rate=@health
  WHEN NOT MATCHED THEN INSERT (workflow_queue_id,queue_depth,dispatch_rate,throughput,completion_rate,retry_rate,recovery_rate,dead_letter_rate,sla_compliance,worker_utilization,cost_today,final_output_completion_rate) VALUES (@queue,@waiting+@active+@delayed+@retrying,@throughput,@throughput,@health,@retrying,CASE WHEN @status='Recovering' THEN 78 ELSE 92 END,@dead,100-@sla,CASE WHEN @desired=0 THEN 0 ELSE (@workers*100.0/@desired) END,(@waiting+@active)*0.002,@health);

  FETCH NEXT FROM queue_cursor INTO @code,@name,@cat,@status,@waiting,@active,@delayed,@retrying,@failed,@dead,@workers,@desired,@throughput,@wait,@sla,@health,@state,@action;
END
CLOSE queue_cursor;
DEALLOCATE queue_cursor;

DECLARE @qwf UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queues WHERE organization_id=@org AND queue_code='Q-WF');
DECLARE @qvideo UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queues WHERE organization_id=@org AND queue_code='Q-VIDEO');
DECLARE @qpub UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queues WHERE organization_id=@org AND queue_code='Q-PUBLISH');
DECLARE @qint UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queues WHERE organization_id=@org AND queue_code='Q-INTEG');
DECLARE @i INT = 1;
WHILE @i <= 36
BEGIN
  DECLARE @queueId UNIQUEIDENTIFIER = CASE WHEN @i % 6 = 0 THEN @qvideo WHEN @i % 5 = 0 THEN @qpub WHEN @i % 4 = 0 THEN @qint ELSE @qwf END;
  DECLARE @item UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_queue_items WHERE organization_id=@org AND reference_id=CONCAT('WFQ-',FORMAT(@i,'000')));
  IF @item IS NULL
  BEGIN
    SET @item = NEWID();
    INSERT INTO workflow_queue_items(id,organization_id,queue_id,workflow_name,workflow_version,reference_type,reference_id,status,base_priority,effective_priority,current_stage,progress_percent,scheduled_at,available_at,sla_deadline,sla_status,required_worker_type,assigned_worker_id,retry_count,recovery_state,idempotency_key,checkpoint_id,estimated_duration_ms,estimated_cost,final_output_impact,organization_name,brand,correlation_id)
    VALUES (@item,@org,@queueId,CASE WHEN @i%6=0 THEN 'Video Rendering Workflow' WHEN @i%5=0 THEN 'Publishing Workflow' WHEN @i%4=0 THEN 'Integration Sync Workflow' ELSE 'Content Lifecycle Workflow' END,3,'workflow',CONCAT('WFQ-',FORMAT(@i,'000')),CASE WHEN @i%11=0 THEN 'Dead-Lettered' WHEN @i%7=0 THEN 'Recovering' WHEN @i%5=0 THEN 'Retrying' WHEN @i%3=0 THEN 'Active' ELSE 'Waiting' END,CASE WHEN @i%5=0 THEN 'High' ELSE 'Normal' END,CASE WHEN @i%7=0 THEN 'Urgent' WHEN @i%5=0 THEN 'High' ELSE 'Normal' END,'Queue Selected',CASE WHEN @i%3=0 THEN 45 ELSE 0 END,DATEADD(minute,-@i*3,SYSUTCDATETIME()),DATEADD(minute,-@i*2,SYSUTCDATETIME()),DATEADD(minute,60-@i,SYSUTCDATETIME()),CASE WHEN @i%8=0 THEN 'at_risk' ELSE 'within_sla' END,CASE WHEN @i%6=0 THEN 'video-worker' WHEN @i%5=0 THEN 'publishing-worker' ELSE 'workflow-worker' END,CASE WHEN @i%3=0 THEN CONCAT('worker-',@i) ELSE NULL END,@i%4,CASE WHEN @i%7=0 THEN 'recovering' ELSE 'none' END,CONCAT('idem-WFQ-',FORMAT(@i,'000')),CONCAT('chk-',@i),120000+@i*1000,@i*0.004,CASE WHEN @i%8=0 THEN 'at risk' ELSE 'on track' END,'AI Media Group',CASE WHEN @i%2=0 THEN 'CACSMS Contents' ELSE 'AI Media Group' END,CONCAT('corr-',@i));
    INSERT INTO workflow_queue_item_priority_history(queue_item_id,original_priority,adjustment,policy_used,final_priority,confidence_percent,risk,expected_impact) VALUES (@item,'Normal','SLA and queue age adjustment','SLA protection policy',CASE WHEN @i%7=0 THEN 'Urgent' ELSE 'High' END,88,'low','reduced wait time');
    INSERT INTO workflow_queue_item_assignments(queue_item_id,candidate_workers,selected_worker,match_score,estimated_completion_at,cost,risk,fallback_worker) VALUES (@item,6,CONCAT('worker-',@i),91,DATEADD(minute,12,SYSUTCDATETIME()),@i*0.002,'low','standby-worker');
    INSERT INTO workflow_queue_final_output_links(queue_item_id,workflow_stage,action_or_agent,output_state,publishing_state,analytics_state,learning_state,business_result_state,readiness_percent,impact_status) VALUES (@item,'Queued','workflow-worker','pending','ready','configured','learning-ready','measurable',CASE WHEN @i%8=0 THEN 72 ELSE 91 END,CASE WHEN @i%8=0 THEN 'at risk' ELSE 'on track' END);
    IF @i%7=0 INSERT INTO workflow_queue_item_recoveries(queue_item_id,diagnosis,recovery_policy,rebalance_decision,reassignment,recovery_status) VALUES (@item,'worker heartbeat delayed','retry and reassign','move to recovery queue','standby-worker','in_progress');
    IF @i%11=0 INSERT INTO workflow_queue_dead_letters(queue_item_id,workflow_name,stage,queue_name,failure_code,failure_summary,attempts,last_failed_at,recoverability,recommended_recovery,final_output_impact,status) VALUES (@item,'Content Lifecycle Workflow','Output Confirmed','Dead-Letter Queue','TRANSIENT_PROVIDER','Provider timeout exhausted',3,SYSUTCDATETIME(),'Recoverable','Retry with another provider','recovering','Recoverable');
  END
  SET @i += 1;
END;

INSERT INTO workflow_queue_rebalance_events(organization_id,queue_id,detection,workflows_affected,strategy,confidence_percent,risk,items_moved,workers_added,expected_wait_reduction_seconds,cost_impact,final_outcome)
SELECT TOP 1 @org, id, 'video-render backlog predicted', 42, 'scale workers and defer low-priority jobs', 91, 'medium', 28, 6, 21, 4.80, 'in progress' FROM workflow_queues WHERE organization_id=@org AND queue_code='Q-VIDEO' AND NOT EXISTS (SELECT 1 FROM workflow_queue_rebalance_events WHERE organization_id=@org);
INSERT INTO workflow_queue_congestion_predictions(organization_id,queue_id,current_depth,forecast_depth_15m,forecast_depth_1h,average_wait_increase_seconds,sla_breach_probability,worker_capacity_shortfall,risk_level,time_to_congestion_minutes,affected_workflows,final_output_impact,autonomous_mitigation,expected_improvement)
SELECT @org, id, waiting_count+active_count+delayed_count+retrying_count, waiting_count+60, waiting_count+180, 24, CASE WHEN status='Congested' THEN 38 ELSE 12 END, desired_workers-workers, CASE WHEN status IN ('Congested','Rebalancing') THEN 'high' ELSE 'medium' END, 18, waiting_count/10, 'protected by rebalancing', 'scale workers and stagger dispatch', 'wait time reduced' FROM workflow_queues q WHERE organization_id=@org AND status IN ('Congested','Rebalancing','Scaling','Recovering') AND NOT EXISTS (SELECT 1 FROM workflow_queue_congestion_predictions p WHERE p.queue_id=q.id);
INSERT INTO workflow_queue_capacity_forecasts(organization_id,queue_id,required_capability,candidate_workers,selected_worker,match_score,estimated_completion_at,cost,risk,fallback_worker)
SELECT @org, id, category, desired_workers, CONCAT('worker-pool-',queue_code), health_percent, DATEADD(minute,20,SYSUTCDATETIME()), desired_workers*0.02, CASE WHEN health_percent < 90 THEN 'medium' ELSE 'low' END, 'standby-pool' FROM workflow_queues q WHERE organization_id=@org AND NOT EXISTS (SELECT 1 FROM workflow_queue_capacity_forecasts c WHERE c.queue_id=q.id);
INSERT INTO workflow_queue_autonomous_decisions(organization_id,queue_id,workflow_name,detection,decision,policy,confidence_percent,risk,action_taken,outcome,human_input_required)
SELECT TOP 12 @org, id, queue_name, 'queue condition changed', last_autonomous_action, 'autonomous queue control', 89, CASE WHEN status IN ('Congested','Recovering') THEN 'medium' ELSE 'low' END, rebalancing_state, 'recorded', 0 FROM workflow_queues q WHERE organization_id=@org AND NOT EXISTS (SELECT 1 FROM workflow_queue_autonomous_decisions d WHERE d.queue_id=q.id);
END;
