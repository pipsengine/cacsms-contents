SET NOCOUNT ON;

IF OBJECT_ID('workflow_failures', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('failed_workflows.view','View failed workflows'),('failed_workflows.view_details','View failure details'),('failed_workflows.view_diagnosis','View failure diagnosis'),
  ('failed_workflows.view_root_cause','View failure root cause'),('failed_workflows.view_recovery','View recovery'),('failed_workflows.view_outputs','View preserved outputs'),
  ('failed_workflows.run_scan','Run failure scan'),('failed_workflows.diagnose','Diagnose failure'),('failed_workflows.recover','Recover failure'),
  ('failed_workflows.retry_stage','Retry failed stage'),('failed_workflows.resume_checkpoint','Resume from checkpoint'),('failed_workflows.reassign_worker','Reassign worker'),
  ('failed_workflows.switch_provider','Switch provider'),('failed_workflows.switch_model','Switch model'),('failed_workflows.revalidate_output','Revalidate output'),
  ('failed_workflows.execute_compensation','Execute compensation'),('failed_workflows.create_incident','Create failure incident'),('failed_workflows.manage_recovery_policies','Manage recovery policies'),
  ('failed_workflows.mark_unrecoverable','Mark failure unrecoverable'),('failed_workflows.export','Export failure report'),('failed_workflows.emergency_override','Use failure emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'failed_workflows.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-failure-recovery' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
(@org,'FAILURE_SCAN','Failure Scan','failed_workflows'),(@org,'FAILURE_DIAGNOSIS','Failure Diagnosis','failed_workflows'),(@org,'WORKFLOW_AUTONOMOUS_RECOVERY','Workflow Autonomous Recovery','failed_workflows'),(@org,'CHECKPOINT_RECOVERY','Checkpoint Recovery','failed_workflows'),
(@org,'OUTPUT_PRESERVATION','Output Preservation','failed_workflows'),(@org,'COMPENSATION_EXECUTION','Compensation Execution','failed_workflows'),(@org,'FAILURE_INCIDENT_ESCALATION','Failure Incident Escalation','failed_workflows'),(@org,'FAILURE_LEARNING_UPDATE','Failure Learning Update','failed_workflows')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @recDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='WORKFLOW_AUTONOMOUS_RECOVERY');
MERGE workflow_stages AS target
USING (VALUES
(@org,@recDef,'failure_detected','Failure Detected',1),(@org,@recDef,'signal_validated','Signal Validated',2),(@org,@recDef,'context_preserved','Context Preserved',3),(@org,@recDef,'failure_classified','Failure Classified',4),
(@org,@recDef,'root_cause_estimated','Root Cause Estimated',5),(@org,@recDef,'recovery_eligibility_calculated','Recovery Eligibility Calculated',6),(@org,@recDef,'recovery_policy_selected','Recovery Policy Selected',7),(@org,@recDef,'checkpoint_restored','Checkpoint Restored',8),
(@org,@recDef,'recovery_action_executed','Recovery Action Executed',9),(@org,@recDef,'output_revalidated','Output Revalidated',10),(@org,@recDef,'workflow_resumed','Workflow Resumed',11),(@org,@recDef,'downstream_dependencies_validated','Downstream Dependencies Validated',12),
(@org,@recDef,'final_output_checked','Final Output Checked',13),(@org,@recDef,'metrics_recorded','Metrics Recorded',14),(@org,@recDef,'learning_updated','Learning Updated',15),(@org,@recDef,'completed_or_escalated','Completed or Escalated',16)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id=source.workflow_definition_id AND target.stage_code=source.stage_code
WHEN MATCHED THEN UPDATE SET name=source.name, sequence_no=source.sequence_no, display_order=source.sequence_no, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'recovery', 'sequential', 6.25, 'failed_workflows.recover', 'active');

IF NOT EXISTS (SELECT 1 FROM workflow_recovery_policies WHERE organization_id=@org)
  INSERT INTO workflow_recovery_policies(organization_id,policy_code,policy_name,failure_categories,retry_strategy,checkpoint_strategy,compensation,escalation,max_attempts,cost_ceiling,time_ceiling_seconds,risk_ceiling,version_number)
  VALUES (@org,'POL-REC-STD','Autonomous Standard Recovery','Provider,Worker,Queue,Timeout','exponential with jitter','last valid checkpoint',0,'incident after 3 attempts',3,50,600,80,3),
         (@org,'POL-REC-OUTPUT','Output Preservation Recovery','Output Validation,Publishing,Storage','stage-only retry','preserve valid partial outputs',1,'incident on data integrity risk',2,100,900,70,2);

DECLARE @items TABLE(code NVARCHAR(120), category NVARCHAR(160), workflow NVARCHAR(220), stage NVARCHAR(180), severity NVARCHAR(40), status NVARCHAR(40), worker NVARCHAR(160), prevWorker NVARCHAR(160), queue NVARCHAR(160), provider NVARCHAR(160), model NVARCHAR(160), retry INT, checkpoint_flag BIT, preserved BIT, incident NVARCHAR(180), sla NVARCHAR(120), publishing NVARCHAR(120), outputImpact NVARCHAR(120), brand NVARCHAR(180));
INSERT INTO @items VALUES
('PROVIDER_TIMEOUT','Provider Failures','AI Writing Workflow','Generate Script','high','Recovering','ai-worker-7','ai-worker-2','AI Writing Queue','openai','gpt-5',2,1,1,NULL,'at risk','protected','recovering','AI Media Group'),
('WORKER_HEARTBEAT','Worker Failures','Video Rendering Workflow','Render Video','critical','Recovering','video-worker-9','video-worker-4','Video Rendering Queue','render-farm','render-v2',1,1,1,NULL,'at risk','protected','at risk','CACSMS Contents'),
('OUTPUT_INVALID','Output Validation Failures','Publishing Workflow','Validate Output','medium','Recoverable','publishing-worker-3','publishing-worker-1','Publishing Queue','internal','validator-v3',1,1,1,NULL,'within_sla','protected','recovering','CACSMS Contents'),
('QUEUE_LOCK','Queue Failures','Content Lifecycle Workflow','Queue Selected','medium','Diagnosing','workflow-worker-2','workflow-worker-8','Workflow Execution Queue','internal','workflow-v3',0,1,1,NULL,'within_sla','none','on track','AI Media Group'),
('DB_TIMEOUT','Database Failures','Analytics Workflow','Store Metrics','high','Retrying','analytics-worker-5','analytics-worker-5','Analytics Queue','sqlserver','analytics-v2',2,1,1,'INC-FLW-001','at risk','none','recovering','CACSMS Contents'),
('CREDENTIAL_EXPIRED','Integration Failures','Integration Sync Workflow','Call Webhook','high','Compensating','integration-worker-4','integration-worker-2','Integration Queue','webhook','sync-v1',3,1,0,'INC-FLW-002','breached','none','blocked','AI Media Group'),
('MODEL_REFUSAL','Model Failures','AI Research Workflow','Summarize Findings','medium','Recovered','ai-worker-3','ai-worker-3','AI Research Queue','fallback-ai','research-model-b',1,1,1,NULL,'within_sla','none','on track','AI Media Group'),
('PUBLISH_REJECT','Publishing Failures','Publishing Workflow','Publish Content','critical','Escalated','publishing-worker-8','publishing-worker-2','Publishing Queue','publisher-api','publish-v1',3,1,1,'INC-FLW-003','breached','blocked','at risk','CACSMS Contents');

DECLARE @idx INT = 1, @code NVARCHAR(120), @cat NVARCHAR(160), @workflow NVARCHAR(220), @stage NVARCHAR(180), @sev NVARCHAR(40), @status NVARCHAR(40), @worker NVARCHAR(160), @prev NVARCHAR(160), @queue NVARCHAR(160), @provider NVARCHAR(160), @model NVARCHAR(160), @retry INT, @checkpoint_flag BIT, @preserved BIT, @incident NVARCHAR(180), @sla NVARCHAR(120), @publishing NVARCHAR(120), @impact NVARCHAR(120), @brand NVARCHAR(180);
DECLARE @workflowInstance UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_instances WHERE organization_id = @org ORDER BY created_at DESC);
DECLARE failure_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @items;
OPEN failure_cursor;
FETCH NEXT FROM failure_cursor INTO @code,@cat,@workflow,@stage,@sev,@status,@worker,@prev,@queue,@provider,@model,@retry,@checkpoint_flag,@preserved,@incident,@sla,@publishing,@impact,@brand;
WHILE @@FETCH_STATUS=0
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workflow_failure_categories WHERE organization_id=@org AND category_name=@cat)
    INSERT INTO workflow_failure_categories(organization_id,category_name,description) VALUES (@org,@cat,CONCAT('Autonomous ', LOWER(@cat)));
  DECLARE @catId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_failure_categories WHERE organization_id=@org AND category_name=@cat);
  DECLARE @failure UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_failures WHERE organization_id=@org AND reference_id=CONCAT('FLW-',FORMAT(@idx,'000')));
  IF @failure IS NULL
  BEGIN
    SET @failure = NEWID();
    INSERT INTO workflow_failures(id,workflow_instance_id,organization_id,workflow_name,workflow_version,reference_id,failed_stage,failure_code,failure_message,stack_summary,is_retryable,resolution_status,failure_category_id,severity,status,retryable,recoverable,checkpoint_available,output_preserved,assigned_worker_id,previous_worker_id,queue_name,provider_id,model_id,retry_count,recovery_state,recovery_policy,incident_id,sla_impact,publishing_impact,final_output_impact,organization_name,brand,detected_at,diagnosed_at,recovery_started_at,recovered_at,correlation_id)
    VALUES (@failure,@workflowInstance,@org,@workflow,3,CONCAT('FLW-',FORMAT(@idx,'000')),@stage,@code,CONCAT(@code,' detected at ',@stage),'stack redacted',1,@status,@catId,@sev,@status,1,CASE WHEN @status='Unrecoverable' THEN 0 ELSE 1 END,@checkpoint_flag,@preserved,@worker,@prev,@queue,@provider,@model,@retry,CASE WHEN @status IN ('Recovering','Retrying','Resuming','Compensating') THEN 'in_progress' ELSE LOWER(@status) END,'Autonomous Standard Recovery',@incident,@sla,@publishing,@impact,'AI Media Group',@brand,DATEADD(minute,-@idx*11,SYSUTCDATETIME()),DATEADD(minute,-@idx*10,SYSUTCDATETIME()),DATEADD(minute,-@idx*9,SYSUTCDATETIME()),CASE WHEN @status='Recovered' THEN DATEADD(minute,-@idx*5,SYSUTCDATETIME()) ELSE NULL END,CONCAT('failure-corr-',@idx));
    INSERT INTO workflow_failure_context(workflow_failure_id,exception_type,error_message,stack_summary,dependency_state,related_logs,related_trace,related_job,related_worker,related_ai_run,related_provider,related_queue) VALUES (@failure,@code,CONCAT(@code,' detected at ',@stage),'stack redacted','dependency checked',CONCAT('log-',@idx),CONCAT('trace-',@idx),CONCAT('job-',@idx),@worker,CONCAT('ai-run-',@idx),@provider,@queue);
    INSERT INTO workflow_failure_root_causes(workflow_failure_id,most_likely_cause,confidence_percent,evidence,alternative_causes,suggested_recovery,estimated_success_probability,estimated_recovery_seconds,incident_recommendation) VALUES (@failure,LOWER(@cat),88,'live failure evidence and dependency telemetry','worker, provider, queue, or output dependency','resume from checkpoint and retry failed stage',92,222,CASE WHEN @incident IS NULL THEN 'not required' ELSE 'incident linked' END);
    INSERT INTO workflow_failure_diagnoses(workflow_failure_id,diagnosis_status,probable_cause,confidence_percent,supporting_evidence,known_issue_match) VALUES (@failure,'completed',LOWER(@cat),88,'logs, queue, worker, provider, and output validation evidence','known transient recovery path');
    INSERT INTO workflow_recovery_attempts(workflow_failure_id,policy_name,strategy,attempt_number,current_stage,progress_percent,confidence_percent,expected_completion_at,outcome) VALUES (@failure,'Autonomous Standard Recovery','Resume from Checkpoint',@retry+1,'Checkpoint Restored',CASE WHEN @status='Recovered' THEN 100 ELSE 68 END,87,DATEADD(minute,12,SYSUTCDATETIME()),CASE WHEN @status='Recovered' THEN 'completed' ELSE 'in_progress' END);
    INSERT INTO workflow_recovery_checkpoints(workflow_failure_id,checkpoint_type,checkpoint_name,context_version,partial_outputs,job_progress,agent_progress,resume_point,data_loss_risk,eligibility,recovery_result) VALUES (@failure,'Workflow Stage Checkpoint',CONCAT(@stage,' checkpoint'),'v3',CASE WHEN @preserved=1 THEN 2 ELSE 0 END,72,64,@stage,'low',CASE WHEN @checkpoint_flag=1 THEN 'eligible' ELSE 'blocked' END,CASE WHEN @status='Recovered' THEN 'restored' ELSE 'pending' END);
    INSERT INTO workflow_recovery_outputs(workflow_failure_id,output_type,output_version,validation_status,storage_state,corruption_state,reusability,recovery_action,final_output_linkage) VALUES (@failure,'content-output','v3',CASE WHEN @preserved=1 THEN 'valid' ELSE 'missing' END,CASE WHEN @preserved=1 THEN 'stored' ELSE 'missing' END,'none',CASE WHEN @preserved=1 THEN 'reusable' ELSE 'rebuild required' END,'revalidate preserved output',@impact);
    INSERT INTO workflow_recovery_decisions(workflow_failure_id,decision,policy,confidence_percent,risk,action_taken,outcome,human_input_required) VALUES (@failure,'resume from checkpoint','Autonomous Standard Recovery',88,CASE WHEN @sev='critical' THEN 'medium' ELSE 'low' END,'retry failed stage only',CASE WHEN @status='Recovered' THEN 'recovered' ELSE 'in progress' END,0);
    INSERT INTO workflow_failure_final_output_links(workflow_failure_id,output_preservation_state,output_completion_state,publishing_state,analytics_state,learning_state,business_result_state,recovery_rate,risk,readiness_percent) VALUES (@failure,CASE WHEN @preserved=1 THEN 'preserved' ELSE 'partial' END,CASE WHEN @impact='on track' THEN 'ready' ELSE 'recovering' END,@publishing,'configured','learning-ready','measurable',94,CASE WHEN @impact='on track' THEN 'low' ELSE 'medium' END,CASE WHEN @impact='on track' THEN 92 ELSE 74 END);
    IF @incident IS NOT NULL INSERT INTO workflow_recovery_incidents(workflow_failure_id,incident_code,severity,status,assigned_team,sla,current_mitigation,human_attention_required) VALUES (@failure,@incident,@sev,'open','platform recovery','30m','autonomous mitigation active',CASE WHEN @status='Escalated' THEN 1 ELSE 0 END);
    IF @status='Compensating' INSERT INTO workflow_recovery_compensations(workflow_failure_id,trigger_reason,target_resource,status,reversibility,risk,result,follow_up_action) VALUES (@failure,'failed downstream state','workflow context','completed','reversible','medium','partial state restored','resume from checkpoint');
  END
  SET @idx += 1;
  FETCH NEXT FROM failure_cursor INTO @code,@cat,@workflow,@stage,@sev,@status,@worker,@prev,@queue,@provider,@model,@retry,@checkpoint_flag,@preserved,@incident,@sla,@publishing,@impact,@brand;
END
CLOSE failure_cursor;
DEALLOCATE failure_cursor;

MERGE workflow_recovery_metrics AS target
USING (SELECT @org AS organization_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
ON target.organization_id=source.organization_id AND target.metric_date=source.metric_date
WHEN MATCHED THEN UPDATE SET failed_workflows=42, recovering=18, recovered_today=126, recovery_success_rate=94.8, unrecoverable=4, incidents_created=6, average_recovery_seconds=222, outputs_preserved_rate=98.2, publishing_deadlines_protected=14, human_attention_required=0
WHEN NOT MATCHED THEN INSERT (organization_id,failed_workflows,recovering,recovered_today,recovery_success_rate,unrecoverable,incidents_created,average_recovery_seconds,outputs_preserved_rate,publishing_deadlines_protected,human_attention_required)
VALUES (@org,42,18,126,94.8,4,6,222,98.2,14,0);

IF NOT EXISTS (SELECT 1 FROM workflow_repeated_failure_patterns WHERE organization_id=@org)
  INSERT INTO workflow_repeated_failure_patterns(organization_id,pattern,occurrence_count,first_seen_at,last_seen_at,affected_workflows,affected_outputs,estimated_root_cause,recommended_permanent_fix,auto_remediation_eligible,incident_or_problem_record)
  VALUES (@org,'Provider timeout in AI generation',9,DATEADD(day,-3,SYSUTCDATETIME()),SYSUTCDATETIME(),5,7,'provider quota window','switch provider before peak window',1,'PRB-001'),
         (@org,'Video worker heartbeat loss',6,DATEADD(day,-2,SYSUTCDATETIME()),SYSUTCDATETIME(),3,4,'worker saturation','increase checkpoint frequency and scale workers',1,'PRB-002');
IF NOT EXISTS (SELECT 1 FROM workflow_failure_learning WHERE organization_id=@org)
  INSERT INTO workflow_failure_learning(organization_id,learning_type,finding,updated_recovery_ranking,architecture_recommendation)
  VALUES (@org,'provider reliability','fallback provider recovered most AI failures','provider fallback before retry','add quota-aware provider routing'),
         (@org,'worker routing','video recovery improves with standby worker reassignment','reassign worker before retry','increase render worker heartbeat frequency');
END;
