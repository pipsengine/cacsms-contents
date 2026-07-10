SET NOCOUNT ON;

IF OBJECT_ID('workflow_log_entries', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');
DECLARE @instance UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_instances WHERE organization_id = @org ORDER BY created_at DESC);
DECLARE @definition UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_LIFECYCLE');
IF @definition IS NULL SET @definition = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org ORDER BY created_at DESC);

MERGE permissions AS target
USING (VALUES
  ('workflow_logs.view','View workflow logs'),('workflow_logs.search','Search workflow logs'),('workflow_logs.live_tail','Use workflow live tail'),
  ('workflow_logs.view_details','View workflow log details'),('workflow_logs.view_trace','View workflow trace'),('workflow_logs.view_agent_trace','View agent trace'),
  ('workflow_logs.view_job_trace','View job trace'),('workflow_logs.view_recovery','View workflow recovery logs'),('workflow_logs.view_lineage','View output lineage'),
  ('workflow_logs.view_sensitive','View sensitive workflow-log fields'),('workflow_logs.export','Export workflow logs'),('workflow_logs.create_saved_view','Create workflow-log saved views'),
  ('workflow_logs.manage_saved_views','Manage workflow-log saved views'),('workflow_logs.create_alert','Create workflow-log alerts'),('workflow_logs.manage_alerts','Manage workflow-log alerts'),
  ('workflow_logs.create_investigation','Create workflow-log investigations'),('workflow_logs.manage_investigations','Manage workflow-log investigations'),('workflow_logs.manage_retention','Manage workflow-log retention'),
  ('workflow_logs.archive','Archive workflow logs'),('workflow_logs.delete','Delete workflow logs'),('workflow_logs.create_incident','Create incident from workflow log')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_logs.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-log-processing' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_log_sources AS target
USING (VALUES
(@org,'workflow-engine','Workflow Engine','engine'),(@org,'workflow-queue','Workflow Queue','queue'),(@org,'ai-orchestrator','AI Orchestrator','agent'),
(@org,'publishing-engine','Publishing Engine','publishing'),(@org,'analytics-engine','Analytics Engine','analytics'),(@org,'learning-engine','Learning Engine','learning')
) AS source(organization_id, source_code, source_name, source_type)
ON target.organization_id=source.organization_id AND target.source_code=source.source_code
WHEN MATCHED THEN UPDATE SET status='active', last_event_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, source_code, source_name, source_type, status, last_event_at) VALUES (source.organization_id, source.source_code, source.source_name, source.source_type, 'active', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM workflow_log_entries WHERE organization_id=@org)
BEGIN
  DECLARE @events TABLE(seq INT, level NVARCHAR(40), event_type NVARCHAR(160), stage_code NVARCHAR(120), status NVARCHAR(80), message NVARCHAR(1000), error_code NVARCHAR(120), duration_ms INT, queue_name NVARCHAR(160), worker_id NVARCHAR(160), agent_code NVARCHAR(120), output_state NVARCHAR(120), publishing_state NVARCHAR(120), analytics_state NVARCHAR(120), learning_state NVARCHAR(120), trace_id NVARCHAR(180), risk NVARCHAR(80), cost DECIMAL(18,4), brand NVARCHAR(180));
  INSERT INTO @events VALUES
  (1,'info','workflow.trigger.received','TRIGGER','completed','Scheduled content lifecycle trigger received.',NULL,140,'workflow-execution','workflow-worker-1',NULL,'pending','not_started','not_started','not_started','trace-content-001','low',0.0100,'AI Media Group'),
  (2,'info','workflow.instance.created','IDEA_CREATED','completed','Workflow instance created and validation passed.',NULL,420,'workflow-execution','workflow-worker-1',NULL,'pending','not_started','not_started','not_started','trace-content-001','low',0.0200,'AI Media Group'),
  (3,'info','workflow.agent.completed','RESEARCH','completed','Research agent generated source-backed brief.',NULL,84000,'ai-writing','ai-worker-4','RESEARCH_AGENT','valid','not_started','not_started','not_started','trace-content-001','low',1.8700,'AI Media Group'),
  (4,'info','workflow.transition.selected','STRATEGY','completed','Transition selected from research to strategy after guardrail evaluation.',NULL,1800,'workflow-execution','workflow-worker-1',NULL,'valid','not_started','not_started','not_started','trace-content-001','low',0.0300,'AI Media Group'),
  (5,'warning','workflow.stage.slow','VIDEO_RENDER','running','Video render stage exceeded expected duration threshold.',NULL,312000,'video-rendering','video-worker-7',NULL,'partial','not_started','not_started','not_started','trace-content-001','medium',4.2500,'CACSMS Contents'),
  (6,'error','workflow.stage.failed','VIDEO_RENDER','failed','Video render worker heartbeat missed and checkpoint recovery started.','WORKER_HEARTBEAT',320000,'video-rendering','video-worker-7',NULL,'partial','not_started','not_started','not_started','trace-content-001','high',4.9000,'CACSMS Contents'),
  (7,'info','workflow.recovery.started','VIDEO_RENDER','recovering','Autonomous recovery selected checkpoint restore and worker reassignment.',NULL,4500,'workflow-failure-recovery','workflow-worker-2',NULL,'partial','not_started','not_started','not_started','trace-content-001','medium',0.4000,'CACSMS Contents'),
  (8,'info','workflow.recovery.completed','VIDEO_RENDER','recovered','Checkpoint restored and video render resumed on standby worker.',NULL,42000,'video-rendering','video-worker-9',NULL,'recovered','not_started','not_started','not_started','trace-content-001','low',1.2000,'CACSMS Contents'),
  (9,'info','workflow.approval.evaluated','APPROVAL','completed','Autonomous approval policy evaluated quality and compliance scores.',NULL,2100,'approval','approval-worker-1',NULL,'valid','not_started','not_started','not_started','trace-content-001','low',0.0400,'CACSMS Contents'),
  (10,'info','workflow.publishing.completed','PUBLISHING','completed','Publishing completed and destination confirmation stored.',NULL,28000,'publishing','publishing-worker-3',NULL,'confirmed','published','pending','pending','trace-content-001','low',0.7200,'CACSMS Contents'),
  (11,'info','workflow.analytics.completed','ANALYTICS_COLLECTION','completed','Analytics collection linked to final output.',NULL,9200,'analytics','analytics-worker-2',NULL,'confirmed','published','collected','pending','trace-content-001','low',0.1100,'CACSMS Contents'),
  (12,'info','workflow.learning.completed','LEARNING_FEEDBACK','completed','Learning feedback recorded and final business result confirmed.',NULL,6100,'learning','learning-worker-1',NULL,'confirmed','published','collected','recorded','trace-content-001','low',0.0900,'CACSMS Contents'),
  (13,'error','workflow.output.blocked','PUBLISHING','blocked','Destination rejected derivative asset; final output lineage retained.','PUBLISH_REJECT',98000,'publishing','publishing-worker-8',NULL,'partial','blocked','pending','pending','trace-publish-002','high',1.3000,'CACSMS Contents'),
  (14,'warning','workflow.agent.low_confidence','SCRIPT','completed','Script writer fallback model improved low confidence draft.',NULL,76000,'ai-writing','ai-worker-8','SCRIPT_WRITER','valid','not_started','not_started','not_started','trace-script-003','medium',2.1500,'AI Media Group');

  INSERT INTO workflow_log_entries(organization_id,timestamp,level,event_type,workflow_definition_id,workflow_code,workflow_name,workflow_version,workflow_instance_id,stage_code,status,message,error_code,duration_ms,retry_count,recovery_state,approval_state,output_state,publishing_state,analytics_state,learning_state,request_id,trace_id,span_id,correlation_id,brand_id,brand,environment,confidence,risk,cost,queue_name,worker_id,agent_code,job_id,approval_request_id,output_id,incident_id,metadata_json)
  SELECT @org, DATEADD(second, -seq * 45, SYSUTCDATETIME()), level, event_type, @definition, 'CONTENT_LIFECYCLE', 'Content Lifecycle Workflow', 4, @instance, stage_code, status, message, error_code, duration_ms,
    CASE WHEN event_type LIKE '%recovery%' THEN 1 ELSE 0 END, CASE WHEN event_type LIKE '%recovery%' THEN status ELSE 'none' END, CASE WHEN stage_code='APPROVAL' THEN 'evaluated' ELSE 'not_required' END,
    output_state, publishing_state, analytics_state, learning_state, CONCAT('req-', FORMAT(seq,'000')), trace_id, CONCAT('span-', FORMAT(seq,'000')), CONCAT('corr-content-', FORMAT(seq,'000')),
    CONCAT('brand-', FORMAT(seq,'000')), brand, 'production', CASE WHEN level='error' THEN 72 ELSE 94 END, risk, cost, queue_name, worker_id, agent_code, CONCAT('job-', FORMAT(seq,'000')),
    CASE WHEN stage_code='APPROVAL' THEN 'APR-2026-001' ELSE NULL END, CONCAT('out-', FORMAT(seq,'000')), CASE WHEN level='error' THEN CONCAT('INC-WL-', FORMAT(seq,'000')) ELSE NULL END,
    CONCAT('{ "redacted": true, "source": "workflow-log-processing", "sequence": ', seq, ' }')
  FROM @events;

  INSERT INTO workflow_log_traces(organization_id,trace_id,workflow_instance_id,workflow_name,status,started_at,ended_at,duration_ms,event_count,missing_event_count,final_output_status,human_attention_required)
  VALUES (@org,'trace-content-001',@instance,'Content Lifecycle Workflow','closed',DATEADD(minute,-18,SYSUTCDATETIME()),SYSUTCDATETIME(),522000,12,0,'confirmed',0),
         (@org,'trace-publish-002',@instance,'Publishing Workflow','open',DATEADD(minute,-9,SYSUTCDATETIME()),NULL,98000,1,2,'blocked',0),
         (@org,'trace-script-003',@instance,'AI Script Workflow','open',DATEADD(minute,-7,SYSUTCDATETIME()),NULL,76000,1,0,'valid',0);

  INSERT INTO workflow_log_spans(organization_id,trace_id,span_id,parent_span_id,span_name,span_type,status,start_time,end_time,duration_ms,retry_count,recovery_state,cost,output_ref)
  VALUES (@org,'trace-content-001','span-trigger',NULL,'Trigger','trigger','completed',DATEADD(minute,-18,SYSUTCDATETIME()),DATEADD(minute,-17,SYSUTCDATETIME()),140,0,'none',0.01,'out-001'),
         (@org,'trace-content-001','span-agent','span-trigger','Research Agent','agent','completed',DATEADD(minute,-16,SYSUTCDATETIME()),DATEADD(minute,-14,SYSUTCDATETIME()),84000,0,'none',1.87,'out-003'),
         (@org,'trace-content-001','span-video','span-agent','Video Render','job','recovered',DATEADD(minute,-12,SYSUTCDATETIME()),DATEADD(minute,-6,SYSUTCDATETIME()),354000,1,'checkpoint_restored',6.10,'out-008'),
         (@org,'trace-content-001','span-publish','span-video','Publishing','publishing','completed',DATEADD(minute,-5,SYSUTCDATETIME()),DATEADD(minute,-4,SYSUTCDATETIME()),28000,0,'none',0.72,'out-010'),
         (@org,'trace-content-001','span-final','span-publish','Final Result','final_output','completed',DATEADD(minute,-3,SYSUTCDATETIME()),SYSUTCDATETIME(),15300,0,'none',0.20,'out-final-001');

  INSERT INTO workflow_log_correlations(organization_id,trace_id,correlation_id,request_id,incident_id,coverage_percent)
  VALUES (@org,'trace-content-001','corr-content-001','req-001',NULL,99.2),(@org,'trace-publish-002','corr-content-013','req-013','INC-WL-013',82.0);

  INSERT INTO workflow_stage_execution_logs(organization_id,workflow_instance_id,stage_code,stage_name,queue_wait_ms,execution_duration_ms,agent_duration_ms,approval_wait_ms,retry_duration_ms,recovery_duration_ms,output_validation_ms,total_duration_ms,status,bottleneck)
  VALUES (@org,@instance,'RESEARCH','Research',1200,84000,84000,0,0,0,1800,87000,'completed','agent duration'),
         (@org,@instance,'VIDEO_RENDER','Video Render',6200,312000,0,0,22000,42000,5400,387600,'recovered','worker heartbeat'),
         (@org,@instance,'APPROVAL','Approval',400,2100,0,1800,0,0,700,5000,'completed','none'),
         (@org,@instance,'PUBLISHING','Publishing',800,28000,0,0,0,0,1500,30300,'completed','destination confirmation');

  INSERT INTO workflow_transition_logs(organization_id,workflow_instance_id,source_stage,candidate_transitions,conditions_evaluated,values_used,rules_applied,transition_selected,alternatives_rejected,confidence,risk,policy,guardrail_result,audit_reference)
  VALUES (@org,@instance,'Research','Strategy,Rewrite,Escalate','source_count >= 3; quality_score > 0.82','source_count=8; quality_score=0.91','content_quality_guardrail','Strategy','Rewrite,Escalate',94,'low','Autonomous Transition Policy','passed','AUD-WL-001');

  INSERT INTO workflow_agent_execution_logs(organization_id,trace_id,agent_code,agent_version,objective,prompt_version,provider,model,tools_called,retrieval_context,started_at,duration_ms,input_tokens,output_tokens,cost,confidence,validation_result,output_ref,retry_count,fallback_used,error_code,final_outcome)
  VALUES (@org,'trace-content-001','RESEARCH_AGENT','v4','Create source-backed research brief','prompt-v12','openai','gpt-5','web-search,vector-retrieval','brand/context/content-plan',DATEADD(minute,-16,SYSUTCDATETIME()),84000,8200,2800,1.87,94,'valid','out-003',0,0,NULL,'accepted'),
         (@org,'trace-script-003','SCRIPT_WRITER','v5','Draft content script','prompt-v18','fallback-ai','script-model-b','style-guide,brand-memory','campaign/context',DATEADD(minute,-7,SYSUTCDATETIME()),76000,6200,2100,2.15,83,'valid','out-014',1,1,NULL,'fallback accepted');

  INSERT INTO workflow_job_execution_logs(organization_id,job_id,queue_name,worker_id,attempts,lease_state,heartbeat_count,progress_percent,checkpoints,retry_schedule,recovery_state,output_ref,duration_ms,failure_code,final_state)
  VALUES (@org,'job-006','video-rendering','video-worker-7',1,'expired',4,61,2,'exponential with jitter','worker_reassigned','out-006',320000,'WORKER_HEARTBEAT','recovered'),
         (@org,'job-010','publishing','publishing-worker-3',1,'active',7,100,1,'none','none','out-010',28000,NULL,'completed');

  INSERT INTO workflow_approval_logs(organization_id,approval_request_id,workflow_instance_id,policy,evaluation_scores,decision,decision_reason,sla_status)
  VALUES (@org,'APR-2026-001',@instance,'Autonomous Content Quality Approval','quality=0.92; compliance=0.98; brand=0.95','approved','all policy thresholds passed','within_sla');

  INSERT INTO workflow_recovery_logs(organization_id,workflow_instance_id,trace_id,step_name,evidence,confidence,risk,outcome,audit_reference,duration_ms)
  VALUES (@org,@instance,'trace-content-001','Failure detected','worker heartbeat missed',91,'medium','diagnosis started','AUD-REC-001',1200),
         (@org,@instance,'trace-content-001','Checkpoint restored','valid video render checkpoint found',93,'low','checkpoint restored','AUD-REC-002',9000),
         (@org,@instance,'trace-content-001','Worker reassigned','standby worker had matching capability',89,'low','video-worker-9 assigned','AUD-REC-003',5200),
         (@org,@instance,'trace-content-001','Workflow resumed','output validation passed',95,'low','final result confirmed','AUD-REC-004',42000);

  INSERT INTO workflow_output_lineage(organization_id,output_id,output_type,output_version,source_workflow,source_stage,source_actor,input_sources,validation_status,approval_status,storage_location,publishing_destination,analytics_reference,learning_reference,final_business_result,lineage_state)
  VALUES (@org,'out-final-001','campaign-video','v4','Content Lifecycle Workflow','Publishing','publishing-worker-3','research brief, script, voice, video render','valid','approved','s3://cacsms-content/final/out-final-001','YouTube, Instagram','AN-2026-001','LRN-2026-001','published content performance tracked','complete'),
         (@org,'out-013','publishing-asset','v2','Publishing Workflow','Publishing','publishing-worker-8','video render, captions','partial','pending','s3://cacsms-content/partial/out-013','YouTube','missing','pending','blocked pending destination recovery','blocked');

  INSERT INTO workflow_output_lineage_links(organization_id,parent_output_id,child_output_id,relationship_type)
  VALUES (@org,'out-003','out-final-001','research-to-final'),(@org,'out-008','out-final-001','video-to-final');

  INSERT INTO workflow_error_clusters(organization_id,cluster_name,workflow_name,stage_code,error_code,failure_signature,agent_code,provider,model,queue_name,worker_id,occurrence_count,first_seen_at,last_seen_at,affected_workflows,recovery_rate,incident_link,root_cause,permanent_fix_status,final_output_impact)
  VALUES (@org,'Video worker heartbeat losses','Content Lifecycle Workflow','VIDEO_RENDER','WORKER_HEARTBEAT','video-worker-heartbeat-loss',NULL,'render-farm','render-v2','video-rendering','video-worker-7',6,DATEADD(day,-2,SYSUTCDATETIME()),SYSUTCDATETIME(),3,91.7,'INC-WL-006','worker saturation during render burst','auto-scaled standby workers','recovered'),
         (@org,'Publishing destination rejection','Publishing Workflow','PUBLISHING','PUBLISH_REJECT','destination-policy-reject',NULL,'publisher-api','publish-v1','publishing','publishing-worker-8',4,DATEADD(day,-1,SYSUTCDATETIME()),SYSUTCDATETIME(),2,66.0,'INC-WL-013','destination metadata policy mismatch','mapping update recommended','blocked');

  INSERT INTO workflow_log_saved_views(organization_id,view_name,query_text,filters_json,owner)
  VALUES (@org,'Failed Workflows','level:error OR status:failed','{"level":"error"}','system'),
         (@org,'Final Output Blocked','finalOutputStatus:"blocked"','{"output_state":"blocked"}','system'),
         (@org,'Recovery Events','eventType:"workflow.recovery*"','{"event_type":"workflow.recovery"}','system');

  INSERT INTO workflow_log_alert_rules(organization_id,name,query_text,threshold_value,evaluation_window,frequency,severity,notification,auto_create_incident,auto_run_remediation,enabled)
  VALUES (@org,'More than 10 workflow failures in 5 minutes','level:error AND eventType:workflow.stage.failed',10,'5m','1m','critical','incident-management',1,1,1),
         (@org,'Final output not produced','finalOutputStatus:blocked',1,'10m','2m','critical','workflow-ops',1,1,1),
         (@org,'AI confidence below threshold','confidence:<0.75',1,'15m','5m','warning','ai-ops',0,1,1);

  DECLARE @alert UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_log_alert_rules WHERE organization_id=@org ORDER BY created_at);
  INSERT INTO workflow_log_alert_executions(workflow_log_alert_rule_id,status,matched_count,incident_id) VALUES (@alert,'evaluated',1,'INC-WL-013');

  INSERT INTO workflow_log_investigations(organization_id,investigation_name,description,owner,assigned_team,status,tags,export_package)
  VALUES (@org,'Publishing destination rejection trace','Autonomous investigation for blocked publishing final output.','system','platform recovery','Investigating','publishing,final-output','export-wl-001');
  DECLARE @investigation UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_log_investigations WHERE organization_id=@org ORDER BY created_at);
  INSERT INTO workflow_log_investigation_notes(workflow_log_investigation_id,note,author) VALUES (@investigation,'Destination rejection linked to metadata mapping mismatch. No routine human input required while recovery policy is active.','system');

  INSERT INTO workflow_log_retention_policies(organization_id,event_class,hot_days,warm_days,archive_days,retention_days,storage_tier)
  VALUES (@org,'Critical workflow failures',30,180,730,730,'archive'),(@org,'Security and audit workflow events',30,180,730,730,'archive'),(@org,'Recovery events',14,90,365,365,'warm'),(@org,'Approval decisions',14,90,365,365,'warm'),(@org,'Publishing events',14,90,365,365,'warm'),(@org,'Analytics and learning events',7,60,180,180,'warm'),(@org,'Successful workflow info logs',7,30,90,90,'hot'),(@org,'Debug workflow logs',2,7,14,14,'hot'),(@org,'Trace-level logs',1,3,7,7,'hot');

  INSERT INTO workflow_log_exports(organization_id,export_name,query_text,status,row_count,requested_by)
  VALUES (@org,'Current incident traces','incidentId:*','completed',42,'system');

  INSERT INTO workflow_log_ingestion_metrics(organization_id,metric_time,events_per_second,ingestion_delay_ms,dropped_events,parsing_failures,storage_usage_gb)
  VALUES (@org,SYSUTCDATETIME(),248.60,1200,0,0,42.8);

  INSERT INTO workflow_trace_completeness(organization_id,trace_id,expected_events,received_events,missing_events,completeness_percent,state)
  VALUES (@org,'trace-content-001',12,12,0,100,'complete'),(@org,'trace-publish-002',3,1,2,33.3,'incomplete'),(@org,'trace-script-003',1,1,0,100,'building');

  INSERT INTO workflow_log_archives(organization_id,archive_name,date_from,date_to,storage_location,status,compressed_size_gb)
  VALUES (@org,'workflow-logs-archive-current-week',DATEADD(day,-7,CAST(SYSUTCDATETIME() AS DATE)),CAST(SYSUTCDATETIME() AS DATE),'archive://workflow-logs/current-week','scheduled',3.4);
END
END;
