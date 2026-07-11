SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);

MERGE permissions AS target
USING (VALUES
('collaboration.view','View agent collaborations'),('collaboration.create','Create collaborations'),('collaboration.edit','Edit collaborations'),('collaboration.assign','Assign collaboration agents'),('collaboration.resolve','Resolve conflicts'),('collaboration.simulate','Simulate collaborations'),('collaboration.export','Export collaboration reports'),('collaboration.emergency','Use emergency collaboration controls')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'collaboration.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'agent-collaborations' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=97, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',97);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES ('AGENT_COLLABORATION_PLANNING','Agent Collaboration Planning'),('AGENT_COLLABORATION_CONSENSUS','Agent Collaboration Consensus'),('AGENT_CONFLICT_RESOLUTION','Agent Conflict Resolution'),('AGENT_HANDOFF_RETRY','Agent Handoff Retry'),('AGENT_COLLABORATION_RECOVERY','Agent Collaboration Recovery'),('AGENT_LEARNING_SYNC','Agent Learning Synchronization');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'agent_collaboration' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_agent_collaboration_final_output WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_recovery WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_learning WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_handoffs WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_conflicts WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_consensus WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_delegations WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_messages WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_memory WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_context WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaboration_members WHERE collaboration_id IN (SELECT id FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%');
DELETE FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
DELETE FROM ai_agent_collaboration_pipeline WHERE organization_id=@org;
DELETE FROM ai_agent_collaboration_health WHERE organization_id=@org;
DELETE FROM ai_agent_collaboration_types WHERE organization_id=@org;

DECLARE @types TABLE(name NVARCHAR(180), total INT, active INT, parallel INT, handoffs INT, consensus INT, conflicts INT, memory DECIMAL(8,2), success DECIMAL(8,2), output DECIMAL(8,2), health DECIMAL(8,2));
INSERT INTO @types VALUES
('Supervisor Collaboration',14,6,6,18,5,2,77,97,97,97),('Peer Collaboration',13,5,8,16,4,2,75,96,96,96),('Sequential Collaboration',12,4,3,21,3,1,72,97,96,97),('Parallel Collaboration',16,8,14,20,5,2,81,96,96,96),('Review Collaboration',11,4,4,13,5,2,74,98,97,98),('Consensus Collaboration',12,5,5,12,8,3,80,95,95,95),('Debate Collaboration',10,3,4,9,4,3,73,94,94,94),('Recovery Collaboration',10,4,4,15,2,4,70,93,94,93),('Publishing Collaboration',12,4,5,18,2,1,78,97,98,97),('Learning Collaboration',11,3,5,10,1,1,84,96,96,96),('Monitoring Collaboration',11,2,4,14,0,1,79,98,96,98);
INSERT INTO ai_agent_collaboration_types(organization_id,collaboration_type,total_collaborations,active_collaborations,parallel_executions,handoffs_today,consensus_sessions,conflicts_resolved,shared_memory_usage,success_rate,final_output_completion,health_percent)
SELECT @org,name,total,active,parallel,handoffs,consensus,conflicts,memory,success,output,health FROM @types;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 132),
types AS (SELECT name, ROW_NUMBER() OVER (ORDER BY name) rn, COUNT(*) OVER () cnt FROM @types),
src AS (SELECT n.i, t.name FROM n JOIN types t ON t.rn=((n.i-1)%t.cnt)+1)
INSERT INTO ai_agent_collaborations(organization_id,collaboration_code,objective,workflow_name,supervisor,participating_agents,status,current_phase,shared_context_health,shared_memory_health,consensus_state,conflict_count,outputs,progress_percent,duration_minutes,cost,risk,final_output_state)
SELECT @org, CONCAT('COLL-',RIGHT('0000'+CAST(src.i AS NVARCHAR(4)),4)), CONCAT(src.name,' for content lifecycle objective ',src.i), 'Content Lifecycle Workflow', COALESCE(a.name,'Supervisor Agent'), 3+(src.i%7), CASE WHEN src.i<=48 THEN 'Active' WHEN src.i<=58 THEN 'Conflict' WHEN src.i<=68 THEN 'Recovering' WHEN src.i<=120 THEN 'Completed' ELSE 'Planning' END, CASE WHEN src.i%9=0 THEN 'Consensus' WHEN src.i%7=0 THEN 'Handoff' WHEN src.i%5=0 THEN 'Knowledge Sharing' ELSE 'Parallel Execution' END, 91+(src.i%8), 89+(src.i%10), CASE WHEN src.i%9=0 THEN 'active' ELSE 'ready' END, CASE WHEN src.i%13=0 THEN 2 WHEN src.i%7=0 THEN 1 ELSE 0 END, 1+(src.i%5), CASE WHEN src.i<=48 THEN 35+(src.i%60) ELSE 100 END, 14+(src.i%40), CAST(0.38+(src.i%12)*0.16 AS DECIMAL(18,4)), CASE WHEN src.i%13=0 THEN 72 ELSE 18+(src.i%38) END, CASE WHEN src.i%13=0 THEN 'at risk' ELSE 'protected' END
FROM src OUTER APPLY (SELECT TOP 1 name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,src.i))) a OPTION (MAXRECURSION 0);

DECLARE @pipe TABLE(stage NVARCHAR(180), seq INT);
INSERT INTO @pipe VALUES ('Objective',1),('Planning',2),('Task Distribution',3),('Parallel Execution',4),('Knowledge Sharing',5),('Handoffs',6),('Consensus',7),('Integration',8),('Validation',9),('Final Output',10),('Conflict',11),('Negotiation',12),('Arbitration',13),('Recovery',14),('Resume Collaboration',15);
INSERT INTO ai_agent_collaboration_pipeline(organization_id,stage_name,collaboration_count,active_agents,handoffs,conflicts,recoveries,average_duration,health_percent,current_blockers)
SELECT @org,stage,132-(seq*3),24+(seq%13),10+(seq%8),CASE WHEN seq IN (11,12,13) THEN 4 ELSE 0 END,CASE WHEN seq IN (13,14,15) THEN 3 ELSE 0 END,CONCAT(5+seq,'m'),CASE WHEN seq IN (11,12,14) THEN 91 ELSE 95+(seq%4) END,CASE WHEN seq IN (11,12,14) THEN 'autonomous resolution active' ELSE 'none' END FROM @pipe;
INSERT INTO ai_agent_collaboration_health(organization_id,service_name,service_state,health_percent,blocker,auto_fix_available) VALUES
(@org,'Collaboration Planner','Healthy',98,NULL,1),(@org,'Shared Context','Healthy',97,NULL,1),(@org,'Shared Memory','Healthy',96,NULL,1),(@org,'Consensus Engine','Healthy',96,NULL,1),(@org,'Negotiation Engine','Healthy',95,NULL,1),(@org,'Delegation Engine','Healthy',96,NULL,1),(@org,'Handoff Engine','Healthy',97,NULL,1),(@org,'Conflict Resolver','Warning',91,'open conflict cluster',1),(@org,'Arbitration Engine','Healthy',95,NULL,1),(@org,'Learning Synchronizer','Healthy',96,NULL,1),(@org,'Recovery Coordinator','Healthy',96,NULL,1);
INSERT INTO ai_agent_collaboration_members(collaboration_id,agent_name,responsibility,role_name,contribution_state,confidence) SELECT c.id, COALESCE(a.name,'AI Agent'),'collaboration contribution and output ownership',CASE WHEN ABS(CHECKSUM(c.id))%4=0 THEN 'Reviewer' ELSE 'Specialist' END,'active',90+(ABS(CHECKSUM(c.id,a.id))%9) FROM ai_agent_collaborations c OUTER APPLY (SELECT TOP 3 id,name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,c.id))) a WHERE c.collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_context(collaboration_id,context_type,context_state,freshness,provenance,isolation_state) SELECT id,'Workflow Context','healthy',96,98,'strict tenant' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_memory(collaboration_id,memory_type,usage_percent,retrieval_health,conflict_state) SELECT id,'Shared Semantic Memory',shared_memory_health,shared_memory_health,'none' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_messages(collaboration_id,message_type,from_agent,to_agent,summary,evidence_link,output_reference) SELECT id,'recommendation',supervisor,'specialist group','shared recommendation with evidence and context references','evidence linked','output linked' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_delegations(collaboration_id,supervisor,task_name,best_agent,backup_agent,deadline,acceptance_state,execution_state) SELECT id,supervisor,'delegated collaboration task',supervisor,'backup agent pool',DATEADD(HOUR,2,SYSUTCDATETIME()),'accepted','executing' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_consensus(collaboration_id,consensus_mode,votes,winning_position,confidence,reason,status) SELECT id,CASE WHEN consensus_state='active' THEN 'Weighted' ELSE 'Policy Based' END,3+(ABS(CHECKSUM(id))%5),'highest confidence final-output-safe recommendation',90+(ABS(CHECKSUM(id))%9),'confidence, policy, quality, cost, evidence','completed' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_conflicts(collaboration_id,conflict_type,conflict_state,resolution_strategy,resolved,risk) SELECT id,CASE WHEN conflict_count>0 THEN 'output mismatch' ELSE 'none' END,CASE WHEN conflict_count>0 THEN 'detected' ELSE 'none' END,'retrieve evidence, fact check, weighted consensus, fallback agent',CASE WHEN conflict_count>0 THEN 0 ELSE 1 END,risk FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%' AND (conflict_count>0 OR collaboration_code IN (SELECT TOP 20 collaboration_code FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%' ORDER BY created_at));
INSERT INTO ai_agent_collaboration_handoffs(collaboration_id,from_agent,to_agent,handoff_state,schema_state,success_rate,final_output_risk) SELECT id,supervisor,'next specialist','completed','valid',94+(ABS(CHECKSUM(id))%5),CASE WHEN final_output_state='at risk' THEN 1 ELSE 0 END FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_learning(collaboration_id,learning_event,synchronization_state,applied_to_memory,applied_to_prompts) SELECT id,'collaboration pattern synchronized','completed',1,CASE WHEN status='Completed' THEN 1 ELSE 0 END FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_recovery(collaboration_id,recovery_policy,recovery_state,coordinator,health_percent) SELECT id,'retry handoff, arbitrate conflict, preserve output, resume collaboration',CASE WHEN status IN ('Recovering','Conflict') THEN 'active' ELSE 'standby' END,supervisor,CASE WHEN status='Conflict' THEN 88 ELSE 95 END FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
INSERT INTO ai_agent_collaboration_final_output(collaboration_id,output_name,integration_state,validation_state,readiness,business_result) SELECT id,'CACSMS final content output','integrated','validated',CASE WHEN final_output_state='at risk' THEN 84 ELSE 96 END,'business outcome protected' FROM ai_agent_collaborations WHERE collaboration_code LIKE 'COLL-%';
