SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @orgName NVARCHAR(180) = COALESCE((SELECT TOP 1 name FROM organizations WHERE id=@org),'AI Media Group');
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);

MERGE permissions AS target
USING (VALUES
('task.view','View agent tasks'),('task.create','Create agent tasks'),('task.edit','Edit agent tasks'),('task.assign','Assign agent tasks'),('task.validate','Validate agent task outputs'),('task.retry','Retry agent tasks'),('task.recover','Recover agent tasks'),('task.delete','Delete agent tasks'),('task.export','Export agent tasks'),('task.emergency','Use emergency task controls')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'task.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'agent-tasks' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=97, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',97);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES ('AGENT_TASK_PLANNING','Agent Task Planning'),('AGENT_TASK_ASSIGNMENT','Agent Task Assignment'),('AGENT_TASK_EXECUTION','Agent Task Execution'),('AGENT_TASK_VALIDATION','Agent Task Validation'),('AGENT_TASK_RECOVERY','Agent Task Recovery'),('AGENT_TASK_REBALANCE','Agent Task Rebalance'),('AGENT_TASK_OPTIMIZATION','Agent Task Optimization');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'agent_tasks' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_agent_task_recommendations WHERE organization_id=@org;
DELETE FROM ai_agent_task_recovery WHERE organization_id=@org;
DELETE FROM ai_agent_task_validation WHERE organization_id=@org;
DELETE FROM ai_agent_task_priority WHERE organization_id=@org;
DELETE FROM ai_agent_task_dependencies WHERE organization_id=@org;
DELETE FROM ai_agent_task_health WHERE organization_id=@org;
DELETE FROM ai_agent_task_lifecycle WHERE organization_id=@org;
DELETE FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%';
DELETE FROM ai_agent_task_categories WHERE organization_id=@org;

DECLARE @cats TABLE(category NVARCHAR(180), total INT, queued INT, running INT, blocked INT, completed INT, recovered INT, minutes DECIMAL(8,2), cost DECIMAL(18,4), success DECIMAL(8,2), output DECIMAL(8,2), health DECIMAL(8,2));
INSERT INTO @cats VALUES
('Research Tasks',18,4,3,0,9,2,16,0.55,97,96,97),('Strategy Tasks',16,3,3,0,8,1,18,0.63,96,96,96),('Writing Tasks',22,4,4,1,11,2,24,0.82,95,96,95),('Creative Tasks',16,3,2,1,8,2,21,0.91,94,94,94),('Image Tasks',14,3,2,1,7,2,20,1.15,93,93,92),('Voice Tasks',13,2,2,0,7,1,17,0.84,95,94,95),('Video Tasks',18,3,3,2,8,3,31,1.62,92,93,91),('SEO Tasks',14,2,2,0,8,1,13,0.42,97,96,97),('Approval Tasks',15,2,2,1,8,2,12,0.35,98,98,98),('Publishing Tasks',14,2,2,0,8,1,14,0.48,96,97,96),('Analytics Tasks',14,2,2,0,8,1,15,0.51,96,95,96),('Learning Tasks',13,2,2,0,7,1,19,0.44,95,95,95),('Recovery Tasks',12,2,2,1,5,3,11,0.39,94,94,94),('Monitoring Tasks',16,4,3,1,7,2,9,0.29,97,96,97),('Administration Tasks',15,4,2,0,9,0,10,0.22,98,95,98);
INSERT INTO ai_agent_task_categories(organization_id,category_name,total_tasks,queued_tasks,running_tasks,blocked_tasks,completed_today,recovered_tasks,average_completion_minutes,average_cost,success_rate,final_output_coverage,health_percent)
SELECT @org, category, total, queued, running, blocked, completed, recovered, minutes, cost, success, output, health FROM @cats;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 240),
cats AS (SELECT category, ROW_NUMBER() OVER (ORDER BY category) rn, COUNT(*) OVER () cnt FROM @cats),
src AS (SELECT n.i, c.category FROM n JOIN cats c ON c.rn=((n.i-1)%c.cnt)+1)
INSERT INTO ai_agent_tasks_dashboard(organization_id,task_code,task_name,description,category,workflow_name,workflow_stage,parent_task_code,agent_name,role_name,priority,status,progress_percent,dependency_count,queue_name,worker_id,provider,model,prompt_code,started_at,eta,deadline,cost,confidence,risk,recovery_state,output_state,organization_name,final_output_impact)
SELECT @org, CONCAT('TASK-',RIGHT('0000'+CAST(i AS NVARCHAR(4)),4)), CONCAT(category,' ',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)), CONCAT('Autonomous ',category,' unit of work for content lifecycle outcome.'), category, 'Content Lifecycle Workflow', REPLACE(category,' Tasks',''), CASE WHEN i%6=0 THEN CONCAT('TASK-',RIGHT('0000'+CAST(i-1 AS NVARCHAR(4)),4)) ELSE NULL END, COALESCE(a.name,'AI Agent'), CASE WHEN i%5=0 THEN 'Supervisor' ELSE 'Specialist' END, CASE WHEN i%11=0 THEN 'Critical' WHEN i%5=0 THEN 'High' WHEN i%3=0 THEN 'Medium' ELSE 'Normal' END, CASE WHEN i<=42 THEN 'Queued' WHEN i<=78 THEN 'Running' WHEN i<=86 THEN 'Blocked' WHEN i<=110 THEN 'Recovering' WHEN i<=228 THEN 'Completed' WHEN i<=234 THEN 'Retrying' ELSE 'Waiting' END, CASE WHEN i<=42 THEN 0 WHEN i<=78 THEN 20+(i%70) WHEN i<=86 THEN 45 WHEN i<=110 THEN 55 ELSE 100 END, i%4, 'agent-tasks', CONCAT('worker-',RIGHT('00'+CAST((i%12)+1 AS NVARCHAR(2)),2)), 'OpenAI', CASE WHEN i%4=0 THEN 'gpt-5-mini' ELSE 'gpt-5' END, CONCAT('PROMPT-TASK-',RIGHT('00'+CAST((i%12)+1 AS NVARCHAR(2)),2)), DATEADD(MINUTE,-i*3,SYSUTCDATETIME()), DATEADD(MINUTE,20+(i%60),SYSUTCDATETIME()), DATEADD(HOUR,2+(i%18),SYSUTCDATETIME()), CAST(0.18+(i%16)*0.09 AS DECIMAL(18,4)), 88+(i%10), CASE WHEN i BETWEEN 79 AND 110 THEN 65+(i%25) ELSE 15+(i%40) END, CASE WHEN i BETWEEN 87 AND 110 THEN 'auto recovery active' ELSE 'ready' END, CASE WHEN i<=86 THEN 'pending' WHEN i<=110 THEN 'recovering output' ELSE 'validated' END, @orgName, CASE WHEN i%13=0 THEN 'at risk' ELSE 'protected' END
FROM src OUTER APPLY (SELECT TOP 1 name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,src.i))) a OPTION (MAXRECURSION 0);

DECLARE @life TABLE(stage NVARCHAR(180), seq INT);
INSERT INTO @life VALUES ('Objective',1),('Task Generated',2),('Prioritized',3),('Assigned',4),('Queued',5),('Running',6),('Validation',7),('Completed',8),('Integrated',9),('Final Output',10),('Failed',11),('Recovery',12),('Retry',13),('Reassigned',14);
INSERT INTO ai_agent_task_lifecycle(organization_id,stage_name,task_count,active_tasks,completed_tasks,blocked_tasks,recovery_count,average_duration,health_percent,current_blockers)
SELECT @org, stage, 240-(seq*4), 35+(seq%9), 80+(seq*4), CASE WHEN seq IN (11,12) THEN 8 ELSE 0 END, CASE WHEN seq IN (12,13,14) THEN 12 ELSE 0 END, CONCAT(4+seq,'m'), CASE WHEN seq IN (11,12) THEN 91 ELSE 95+(seq%4) END, CASE WHEN seq IN (11,12) THEN 'recovery path active' ELSE 'none' END FROM @life;
INSERT INTO ai_agent_task_health(organization_id,service_name,service_state,health_percent,blocker,auto_fix_available) VALUES
(@org,'Planner','Healthy',98,NULL,1),(@org,'Scheduler','Healthy',97,NULL,1),(@org,'Prioritizer','Healthy',97,NULL,1),(@org,'Dependency Engine','Healthy',96,NULL,1),(@org,'Delegation Engine','Healthy',96,NULL,1),(@org,'Execution Engine','Healthy',95,NULL,1),(@org,'Validation Engine','Healthy',97,NULL,1),(@org,'Recovery Engine','Healthy',96,NULL,1),(@org,'Cost Optimizer','Healthy',95,NULL,1),(@org,'Deadline Predictor','Warning',91,'eight blocked tasks',1),(@org,'Task Queue','Healthy',97,NULL,1),(@org,'Audit','Healthy',99,NULL,1),(@org,'Notifications','Healthy',96,NULL,1);
INSERT INTO ai_agent_task_dependencies(organization_id,task_id,dependency_task_code,dependency_type,dependency_status,critical_path,recovery_path) SELECT @org,id,parent_task_code,'parent-child',CASE WHEN status='Blocked' THEN 'blocking' ELSE 'satisfied' END,CASE WHEN priority='Critical' THEN 1 ELSE 0 END,CASE WHEN status IN ('Recovering','Retrying') THEN 1 ELSE 0 END FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%' AND parent_task_code IS NOT NULL;
INSERT INTO ai_agent_task_priority(organization_id,task_id,workflow_priority,business_value,deadline_score,risk_score,final_priority,priority_reason) SELECT @org,id,80+(ABS(CHECKSUM(id))%20),75+(ABS(CHECKSUM(task_code))%25),70+(ABS(CHECKSUM(category))%25),risk,CASE WHEN priority='Critical' THEN 98 WHEN priority='High' THEN 88 WHEN priority='Medium' THEN 72 ELSE 58 END,'business value, deadline, risk, final-output protection' FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%';
INSERT INTO ai_agent_task_validation(organization_id,task_id,validation_area,validation_status,validation_score,output_readiness,issue_count) SELECT @org,id,'output contract validation',CASE WHEN status='Blocked' THEN 'Warning' WHEN status='Failed' THEN 'Failed' ELSE 'Passed' END,CASE WHEN status='Blocked' THEN 82 ELSE 93+(ABS(CHECKSUM(id))%7) END,CASE WHEN final_output_impact='at risk' THEN 84 ELSE 96 END,CASE WHEN status='Blocked' THEN 1 ELSE 0 END FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%';
INSERT INTO ai_agent_task_recovery(organization_id,task_id,failure_type,recovery_policy,recovery_status,retry_count,reassigned_to,health_percent) SELECT @org,id,CASE WHEN status='Blocked' THEN 'dependency blocked' ELSE 'recoverable execution drift' END,'retry, reassign, preserve output, revalidate',CASE WHEN status IN ('Recovering','Retrying','Blocked') THEN 'active' ELSE 'standby' END,CASE WHEN status IN ('Recovering','Retrying') THEN 1 ELSE 0 END,agent_name,CASE WHEN status='Blocked' THEN 86 ELSE 95 END FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%' AND status IN ('Recovering','Retrying','Blocked');
INSERT INTO ai_agent_task_recommendations(organization_id,task_id,problem,recommendation,expected_benefit,risk,confidence,auto_apply_eligible,status)
SELECT @org,id,CASE WHEN status='Blocked' THEN 'blocked task dependency' WHEN final_output_impact='at risk' THEN 'final-output risk' ELSE 'safe optimization opportunity' END,CASE WHEN status='Blocked' THEN 'resolve dependency, reassign worker, and revalidate output' WHEN final_output_impact='at risk' THEN 'increase priority and protect deadline' ELSE 'rebalance queue and refresh priority score' END,'higher completion reliability and final-output protection',CASE WHEN status='Blocked' THEN 'medium' ELSE 'low' END,89,CASE WHEN status NOT IN ('Blocked') THEN 1 ELSE 0 END,'recommended' FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%' AND (status IN ('Blocked','Recovering','Retrying') OR final_output_impact='at risk' OR task_code IN (SELECT TOP 20 task_code FROM ai_agent_tasks_dashboard WHERE task_code LIKE 'TASK-%' ORDER BY created_at));
