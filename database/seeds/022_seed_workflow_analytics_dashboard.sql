SET NOCOUNT ON;

IF OBJECT_ID('workflow_execution_metrics', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');
DECLARE @analyticsQueue UNIQUEIDENTIFIER;

MERGE permissions AS target
USING (VALUES
('workflow_analytics.view','View workflow analytics'),('workflow_analytics.view_performance','View workflow performance'),('workflow_analytics.view_cost','View workflow cost analytics'),('workflow_analytics.view_autonomy','View workflow autonomy analytics'),('workflow_analytics.view_sla','View workflow SLA analytics'),('workflow_analytics.view_final_output','View workflow final-output analytics'),('workflow_analytics.view_predictions','View workflow predictions'),('workflow_analytics.view_recommendations','View workflow recommendations'),('workflow_analytics.run_optimization_scan','Run workflow optimization scan'),('workflow_analytics.apply_recommendations','Apply workflow recommendations'),('workflow_analytics.compare','Compare workflow analytics'),('workflow_analytics.generate_report','Generate workflow analytics report'),('workflow_analytics.export','Export workflow analytics'),('workflow_analytics.configure_metrics','Configure workflow metrics'),('workflow_analytics.view_business_impact','View workflow business impact')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_analytics.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-analytics' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);
SET @analyticsQueue = (SELECT TOP 1 id FROM job_queues WHERE organization_id=@org AND name='workflow-analytics');

DECLARE @rows TABLE(code NVARCHAR(120), name NVARCHAR(220), category NVARCHAR(120), version INT, executions INT, success DECIMAL(8,2), recovery DECIMAL(8,2), duration INT, p95 INT, queueWait INT, approvalWait INT, aiDuration INT, cost DECIMAL(18,4), sla DECIMAL(8,2), finalOutput DECIMAL(8,2), publishing DECIMAL(8,2), analyticsRate DECIMAL(8,2), learning DECIMAL(8,2), human DECIMAL(8,2), efficiency DECIMAL(8,2), health DECIMAL(8,2), trend NVARCHAR(80), owner NVARCHAR(180));
INSERT INTO @rows VALUES
('SYSTEM_STARTUP','System Startup','System Control',2,1220,99.2,98.4,64000,98000,4200,0,8000,0.10,99.0,98.6,100,98,98,0.0,96,99.5,'improving','Platform Core'),
('IMPLEMENTATION_VALIDATION','Implementation Validation','System Monitoring',3,860,97.8,96.2,126000,210000,9500,0,16000,0.28,98.2,97.0,0,97,96,0.1,93,97.2,'stable','Quality Core'),
('AI_RESEARCH','AI Research Workflow','Research',6,1840,95.1,92.6,410000,760000,38000,0,280000,5.10,94.0,91.8,0,94,92,0.4,86,91.0,'watch','AI Orchestrator'),
('CONTENT_STRATEGY','Content Strategy','Strategy',4,1045,96.5,94.7,240000,390000,19000,22000,110000,1.40,96.0,94.2,0,93,94,0.2,90,94.8,'stable','Strategy Core'),
('CONTENT_LIFECYCLE','Content Lifecycle Workflow','Content Production',5,1350,97.4,95.6,522000,890000,44000,34000,210000,14.80,96.9,96.4,95,96,95,0.2,91,98.6,'improving','Workflow Release Engine'),
('IMAGE_GENERATION','Image Generation Workflow','Creative Generation',3,1320,78.0,82.0,210000,460000,76000,18000,160000,5.40,81.0,61.5,0,84,82,1.8,62,62.0,'degraded','Creative Automation'),
('VOICE','Voice Generation','Audio and Voice',2,980,95.8,93.1,185000,330000,22000,0,130000,2.20,95.0,93.4,0,92,92,0.2,88,92.5,'stable','Audio Studio'),
('VIDEO_RENDER','Video Rendering Workflow','Video Production',4,760,95.0,92.8,380000,820000,88000,0,90000,8.40,92.0,92.1,0,91,90,0.5,84,94.2,'watch','Media Platform'),
('CONTENT_APPROVAL','Content Approval','Approval',3,1430,96.1,94.0,148000,260000,12000,82000,0,0.40,93.0,95.0,0,94,94,0.7,87,93.0,'watch','Policy Engine'),
('PUBLISHING','Publishing Workflow','Publishing',7,1760,96.7,95.0,185000,320000,24000,11000,20000,2.70,96.0,94.8,96,95,94,0.2,92,96.1,'improving','Publishing Core'),
('ANALYTICS_COLLECTION','Analytics Collection Workflow','Analytics',3,1510,91.2,90.0,90000,160000,17000,0,18000,0.30,90.0,87.0,0,91,89,0.4,82,88.0,'watch','Analytics Core'),
('LEARNING_FEEDBACK','Learning Feedback','Learning',2,920,94.0,92.0,130000,230000,14000,0,54000,0.90,94.0,91.0,0,92,94,0.2,86,90.0,'stable','Learning Core'),
('INCIDENT_RECOVERY','Incident Recovery','Incident Recovery',2,210,93.2,95.4,320000,620000,41000,0,38000,3.10,94.0,92.2,0,90,91,0.5,88,89.0,'improving','Reliability Core'),
('WORKER_RECOVERY','Worker Recovery','Worker Recovery',2,360,94.6,96.8,180000,340000,65000,0,16000,1.20,93.0,93.0,0,91,91,0.2,89,91.0,'stable','Queue Core'),
('DB_MAINTENANCE','Database Maintenance','Database Maintenance',1,180,98.0,97.0,290000,450000,12000,0,0,0.80,98.0,96.0,0,96,96,0.0,94,97.0,'stable','Data Platform'),
('EXECUTIVE_REPORTING','Executive Reporting','Reporting',1,520,96.0,94.0,210000,390000,18000,0,42000,1.60,95.0,94.0,0,96,95,0.1,90,93.0,'stable','Executive Office'),
('NOTIFICATIONS','Notifications','Notifications',1,1480,98.4,97.0,42000,78000,9000,0,0,0.05,98.0,97.0,0,97,97,0.0,95,98.0,'improving','Notification Core'),
('CHANNEL_SYNC','Channel Integration Sync','Integrations',2,717,93.6,91.4,230000,520000,72000,0,35000,1.90,90.0,89.0,89,88,88,0.4,81,86.0,'watch','Integration Core');

MERGE workflow_definitions AS target
USING (SELECT DISTINCT @org AS organization_id, code, name, 'analytics_subject' AS workflow_type FROM @rows) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=COALESCE(target.workflow_type, source.workflow_type), status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',0);

DELETE FROM workflow_execution_metrics WHERE organization_id=@org;
DELETE FROM workflow_stage_metrics WHERE organization_id=@org;
DELETE FROM workflow_agent_metrics WHERE organization_id=@org;
DELETE FROM workflow_queue_metrics WHERE organization_id=@org;
DELETE FROM workflow_worker_metrics WHERE organization_id=@org;
DELETE FROM workflow_approval_metrics WHERE organization_id=@org;
DELETE FROM workflow_recovery_metrics WHERE organization_id=@org;
DELETE FROM workflow_cost_metrics WHERE organization_id=@org;
DELETE FROM workflow_sla_metrics WHERE organization_id=@org;
DELETE FROM workflow_final_output_metrics WHERE organization_id=@org;
DELETE FROM workflow_autonomy_metrics WHERE organization_id=@org;
DELETE FROM workflow_business_impact_metrics WHERE organization_id=@org;
DELETE FROM workflow_predictions WHERE organization_id=@org;
DELETE FROM workflow_optimization_recommendations WHERE organization_id=@org;
DELETE FROM workflow_optimization_actions WHERE organization_id=@org;
DELETE FROM workflow_analytics_daily WHERE organization_id=@org;
DELETE FROM workflow_analytics_hourly WHERE organization_id=@org;
DELETE FROM workflow_analytics_baselines WHERE organization_id=@org;
DELETE FROM workflow_analytics_targets WHERE organization_id=@org;
DELETE FROM workflow_analytics_snapshots WHERE organization_id=@org;
DELETE FROM workflow_analytics_exports WHERE organization_id=@org;

INSERT INTO workflow_execution_metrics(organization_id,workflow_definition_id,workflow_version,workflow_code,workflow_name,category,execution_date,status,duration_ms,p50_duration_ms,p95_duration_ms,p99_duration_ms,queue_wait_ms,approval_wait_ms,ai_duration_ms,recovery_duration_ms,total_cost,success_flag,recovery_flag,sla_compliant,final_output_completed,publishing_completed,analytics_completed,learning_completed,human_intervention_required,owner,organization_name,execution_count,efficiency_score,health_percent,trend)
SELECT @org, wd.id, r.version, r.code, r.name, r.category, DATEADD(minute,-r.executions,SYSUTCDATETIME()), CASE WHEN r.success<85 THEN 'degraded' ELSE 'completed' END, r.duration, CAST(r.duration*0.72 AS INT), r.p95, CAST(r.p95*1.25 AS INT), r.queueWait, r.approvalWait, r.aiDuration, CASE WHEN r.recovery<90 THEN 52000 ELSE 18000 END, r.cost, CASE WHEN r.success>=85 THEN 1 ELSE 0 END, CASE WHEN r.recovery>=90 THEN 1 ELSE 0 END, CASE WHEN r.sla>=90 THEN 1 ELSE 0 END, CASE WHEN r.finalOutput>=85 THEN 1 ELSE 0 END, CASE WHEN r.publishing>=85 THEN 1 ELSE 0 END, CASE WHEN r.analyticsRate>=85 THEN 1 ELSE 0 END, CASE WHEN r.learning>=85 THEN 1 ELSE 0 END, CASE WHEN r.human>=1 THEN 1 ELSE 0 END, r.owner, 'AI Media Group', r.executions, r.efficiency, r.health, r.trend
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_stage_metrics(organization_id,workflow_definition_id,workflow_code,workflow_name,stage_name,duration_ms,failure_rate,retry_rate,queue_wait_ms,stage_cost,bottleneck_score)
SELECT @org, wd.id, r.code, r.name, 'Critical Path', CAST(r.duration*0.42 AS INT), 100-r.success, CASE WHEN r.success<90 THEN 9 ELSE 2 END, r.queueWait, r.cost*0.42, CASE WHEN r.health<90 THEN 100-r.health+35 ELSE 58 END
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_agent_metrics(organization_id,workflow_definition_id,workflow_code,workflow_name,agent_name,executions,success_rate,failure_rate,average_duration_ms,average_cost,confidence,output_acceptance_rate,revision_rate,provider_usage,model_usage,tool_usage,recovery_frequency,final_output_contribution)
SELECT @org, wd.id, r.code, r.name, CONCAT(r.category,' Agent'), r.executions, r.success, 100-r.success, r.aiDuration, r.cost*0.48, CASE WHEN r.health<85 THEN 78 ELSE 92 END, r.finalOutput, CASE WHEN r.finalOutput<85 THEN 12 ELSE 3 END, 'OpenAI primary / fallback ready', 'gpt-5', 'workflow tools, database tools', CASE WHEN r.recovery<90 THEN 8 ELSE 2 END, r.finalOutput
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_queue_metrics(organization_id,workflow_queue_id,queue_name,queue_depth,queue_wait_ms,dispatch_rate,throughput,congestion_risk,dead_letter_recovery_rate)
SELECT @org, @analyticsQueue, LOWER(REPLACE(category,' ','-')), CASE WHEN AVG(queueWait)>60000 THEN 28 ELSE 6 END, AVG(queueWait), 96, AVG(executions)/24.0, CASE WHEN AVG(queueWait)>60000 THEN 76 ELSE 18 END, 94 FROM @rows GROUP BY category;

INSERT INTO workflow_worker_metrics(organization_id,worker_pool,utilization,health_percent,scaling_accuracy,reassignment_count,stuck_recovery_count,cost_per_pool)
SELECT @org, CONCAT(category,' Workers'), CASE WHEN AVG(queueWait)>60000 THEN 86 ELSE 54 END, AVG(health), 92, CASE WHEN AVG(queueWait)>60000 THEN 7 ELSE 1 END, CASE WHEN AVG(success)<90 THEN 4 ELSE 1 END, AVG(cost)*14 FROM @rows GROUP BY category;

INSERT INTO workflow_approval_metrics(organization_id,workflow_definition_id,workflow_code,auto_approved,auto_rejected,revision_requested,exception_review,decision_time_ms,approval_sla,false_positive_rate,false_negative_rate,final_output_impact)
SELECT @org, wd.id, r.code, CAST(r.executions*0.88 AS INT), CAST(r.executions*0.02 AS INT), CAST(r.executions*0.05 AS INT), CAST(r.executions*(r.human/100.0) AS INT), r.approvalWait, CASE WHEN r.approvalWait<90000 THEN 96 ELSE 88 END, 1.2, 0.7, r.finalOutput
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code WHERE r.approvalWait>0 OR r.category='Approval';

INSERT INTO workflow_recovery_metrics(organization_id,workflow_definition_id,workflow_code,strategy,attempts,success_count,failure_count,recovery_duration_ms,recovery_cost,failure_category,final_output_recovered)
SELECT @org, wd.id, r.code, CASE WHEN r.success<90 THEN 'checkpoint plus provider fallback' ELSE 'checkpoint recovery' END, CAST(r.executions*0.04 AS INT), CAST(r.executions*0.04*r.recovery/100 AS INT), CAST(r.executions*0.04*(100-r.recovery)/100 AS INT), CASE WHEN r.recovery<90 THEN 52000 ELSE 18000 END, r.cost*0.12, CASE WHEN r.health<85 THEN 'performance degradation' ELSE 'transient execution fault' END, CASE WHEN r.finalOutput>=85 THEN 1 ELSE 0 END
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_cost_metrics(organization_id,workflow_definition_id,workflow_code,workflow_name,category,total_cost,cost_per_execution,cost_per_successful_output,cost_per_published_item,worker_cost,queue_cost,storage_cost,recovery_cost,failed_execution_cost,cost_saved_recovery,cost_saved_optimization,revenue_to_cost_ratio,efficiency_score)
SELECT @org, wd.id, r.code, r.name, r.category, r.executions*r.cost, r.cost, r.cost/(NULLIF(r.success,0)/100.0), CASE WHEN r.publishing>0 THEN r.cost/(r.publishing/100.0) ELSE 0 END, r.cost*0.18, r.cost*0.08, r.cost*0.04, r.cost*0.12, r.cost*((100-r.success)/100.0), r.cost*0.3, r.cost*0.22, CASE WHEN r.cost>0 THEN 12/r.cost ELSE 0 END, r.efficiency
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_sla_metrics(organization_id,workflow_definition_id,workflow_code,workflow_name,sla_type,compliant,at_risk,breached,average_delay_ms,autonomous_mitigation_success)
SELECT @org, wd.id, r.code, r.name, 'workflow completion SLA', CAST(r.executions*r.sla/100 AS INT), CAST(r.executions*(100-r.sla)/200 AS INT), CAST(r.executions*(100-r.sla)/200 AS INT), CASE WHEN r.sla<92 THEN 74000 ELSE 9000 END, r.recovery
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_final_output_metrics(organization_id,workflow_definition_id,workflow_code,workflow_name,expected_output,output_completion_rate,output_quality_score,output_validation_rate,publishing_success,analytics_linkage,learning_linkage,business_result_completion,time_to_final_output_ms,cost_per_final_output,status)
SELECT @org, wd.id, r.code, r.name, 'Final business result', r.finalOutput, CASE WHEN r.finalOutput<85 THEN 74 ELSE 93 END, r.finalOutput, r.publishing, r.analyticsRate, r.learning, CASE WHEN r.finalOutput<85 THEN r.finalOutput-4 ELSE r.finalOutput END, r.duration+r.queueWait+r.approvalWait, CASE WHEN r.finalOutput>0 THEN r.cost/(r.finalOutput/100.0) ELSE r.cost END, CASE WHEN r.finalOutput<75 THEN 'blocked' WHEN r.finalOutput<90 THEN 'at risk' ELSE 'complete' END
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_autonomy_metrics(organization_id,category,fully_autonomous_completions,auto_approvals,auto_recoveries,auto_retries,auto_provider_switches,auto_worker_reassignments,auto_queue_rebalances,auto_scaling_events,auto_publishing,auto_analytics_collection,auto_learning_completion,human_escalations,manual_overrides,emergency_interventions,autonomous_completion_rate,human_intervention_rate,guardrail_escalation_rate,opportunity)
SELECT @org, category, CAST(SUM(executions*(100-human)/100.0) AS INT), CAST(SUM(executions*0.86) AS INT), CAST(SUM(executions*0.04) AS INT), CAST(SUM(executions*0.05) AS INT), 8, 12, 9, 6, CAST(SUM(executions*publishing/100.0) AS INT), CAST(SUM(executions*analyticsRate/100.0) AS INT), CAST(SUM(executions*learning/100.0) AS INT), CAST(SUM(executions*human/100.0) AS INT), 0, 0, CAST(AVG(100-human) AS DECIMAL(8,2)), CAST(AVG(human) AS DECIMAL(8,2)), 1.4, 'reduce approval and queue wait dependency' FROM @rows GROUP BY category;

INSERT INTO workflow_predictions(organization_id,workflow_definition_id,workflow_code,workflow_name,prediction_type,risk_score,confidence,time_horizon,root_cause,expected_impact,autonomous_mitigation,expected_improvement)
SELECT @org, wd.id, r.code, r.name, CASE WHEN r.finalOutput<85 THEN 'final-output risk' WHEN r.queueWait>60000 THEN 'queue congestion risk' WHEN r.sla<92 THEN 'SLA breach probability' ELSE 'workflow failure probability' END, CASE WHEN r.health<85 THEN 82 ELSE 24 END, CASE WHEN r.health<85 THEN 91 ELSE 78 END, 'next 24 hours', CASE WHEN r.health<85 THEN 'degraded health and queue wait' ELSE 'normal variance' END, CASE WHEN r.health<85 THEN 'completion delay and output risk' ELSE 'low impact' END, CASE WHEN r.health<85 THEN 'rebalance queue, add checkpoint, prepare version-governed optimization' ELSE 'continue monitoring' END, CASE WHEN r.health<85 THEN 18 ELSE 4 END
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_optimization_recommendations(organization_id,workflow_definition_id,workflow_code,workflow_name,problem,recommendation,duration_improvement,cost_improvement,reliability_improvement,final_output_improvement,confidence,risk,auto_apply_eligible,applied_status,guardrail_result)
SELECT @org, wd.id, r.code, r.name, CASE WHEN r.queueWait>60000 THEN 'queue wait above baseline' WHEN r.finalOutput<85 THEN 'final-output completion below target' ELSE 'safe optimization opportunity' END, CASE WHEN r.queueWait>60000 THEN 'change queue and increase worker capacity' WHEN r.finalOutput<85 THEN 'add output validation and recovery checkpoint to draft version' ELSE 'parallelize safe non-dependent stages' END, CASE WHEN r.queueWait>60000 THEN 16 ELSE 8 END, 7, CASE WHEN r.success<90 THEN 12 ELSE 4 END, CASE WHEN r.finalOutput<85 THEN 20 ELSE 5 END, CASE WHEN r.health<85 THEN 90 ELSE 84 END, CASE WHEN r.health<85 THEN 'medium' ELSE 'low' END, CASE WHEN r.health>=85 THEN 1 ELSE 0 END, CASE WHEN r.health>=90 THEN 'applied to draft guardrail' ELSE 'recommended' END, CASE WHEN r.health>=85 THEN 'inside guardrails' ELSE 'requires Workflow Version governance' END
FROM @rows r JOIN workflow_definitions wd ON wd.organization_id=@org AND wd.code=r.code;

INSERT INTO workflow_optimization_actions(organization_id,workflow_optimization_recommendation_id,detected_issue,supporting_metrics,baseline,applied_change,expected_impact,actual_impact,rollback_eligible,status)
SELECT @org, rec.id, rec.problem, CONCAT('confidence=', rec.confidence, '; risk=', rec.risk), 'baseline from workflow_analytics_baselines', CASE WHEN rec.auto_apply_eligible=1 THEN rec.recommendation ELSE 'not applied automatically' END, CONCAT('duration ', rec.duration_improvement, '%; final output ', rec.final_output_improvement, '%'), CASE WHEN rec.auto_apply_eligible=1 THEN 'draft recommendation recorded' ELSE 'awaiting governed workflow version path' END, 1, CASE WHEN rec.auto_apply_eligible=1 THEN 'applied' ELSE 'guarded' END
FROM workflow_optimization_recommendations rec WHERE rec.organization_id=@org;

INSERT INTO workflow_business_impact_metrics(organization_id,content_produced,content_published,time_saved_minutes,cost_saved,failures_prevented,deadlines_protected,revenue_influenced,engagement_influenced,human_effort_avoided_hours,autonomous_operating_hours,final_business_outcomes_delivered)
VALUES(@org, 4280, 3912, 18460, 34720.50, 612, 284, 126000.00, 940000, 1180.5, 720.0, 3890);

INSERT INTO workflow_analytics_daily(organization_id,metric_date,executions,success_rate,recovery_rate,final_output_rate,cost)
SELECT @org, CAST(DATEADD(day,-v.n,SYSUTCDATETIME()) AS DATE), 600+(v.n*17), 96.8-(v.n*0.08), 94.2-(v.n*0.05), 94.7-(v.n*0.07), 920+(v.n*11)
FROM (VALUES(0),(1),(2),(3),(4),(5),(6)) v(n);

INSERT INTO workflow_analytics_hourly(organization_id,metric_hour,executions,success_rate,failure_rate,recovery_rate,average_duration_ms,sla_compliance,final_output_rate,human_intervention_rate)
SELECT @org, DATEADD(hour,-v.n,SYSUTCDATETIME()), 180+(v.n%6)*12, 96.8-(v.n%5), 3.2+(v.n%4), 94.2-(v.n%3), 522000+(v.n*2500), 97.6-(v.n%4), 94.7-(v.n%4), 0.3+(v.n%2)*0.1
FROM (VALUES(0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23)) v(n);

INSERT INTO workflow_analytics_baselines(organization_id,metric_name,baseline_value,period_name) VALUES(@org,'success_rate',95.0,'previous period'),(@org,'final_output_rate',92.0,'previous period'),(@org,'average_cost',2.10,'previous period');
INSERT INTO workflow_analytics_targets(organization_id,metric_name,target_value,status) VALUES(@org,'success_rate',97.0,'active'),(@org,'sla_compliance',98.0,'active'),(@org,'final_output_rate',95.0,'active'),(@org,'human_intervention_rate',0.5,'active');
INSERT INTO workflow_analytics_snapshots(organization_id,snapshot_name,payload_summary) VALUES(@org,'Workflow Analytics Snapshot','Autonomous analytics snapshot with performance, cost, SLA, autonomy, final-output, prediction, and optimization telemetry.');
INSERT INTO workflow_analytics_exports(organization_id,export_type,status,requested_by) VALUES(@org,'executive-workflow-report','completed','system');
END;
