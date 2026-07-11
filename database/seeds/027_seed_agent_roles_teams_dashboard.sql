SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @orgName NVARCHAR(180) = COALESCE((SELECT TOP 1 name FROM organizations WHERE id=@org),'AI Media Group');
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);

MERGE permissions AS target
USING (VALUES
('agent_roles_teams.view','View agent roles and teams'),('agent_roles_teams.view_details','View role and team details'),('agent_roles_teams.create_role','Create roles'),('agent_roles_teams.create_team','Create teams'),('agent_roles_teams.validate','Validate team structures'),('agent_roles_teams.simulate','Simulate collaborations'),('agent_roles_teams.rebalance','Rebalance workloads'),('agent_roles_teams.manage_governance','Manage team governance'),('agent_roles_teams.export','Export team reports')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'agent_roles_teams.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'agent-roles-teams' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=96, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',96);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('AGENT_TEAM_CREATION','Agent Team Creation'),('AGENT_ROLE_VALIDATION','Agent Role Validation'),('AGENT_TEAM_VALIDATION','Agent Team Validation'),('AGENT_TEAM_SIMULATION','Agent Team Simulation'),('AGENT_WORKLOAD_REBALANCE','Agent Workload Rebalance'),('AGENT_HANDOFF_RECOVERY','Agent Handoff Recovery'),('AGENT_CONSENSUS_RESOLUTION','Agent Consensus Resolution'),('AGENT_TEAM_FAILOVER','Agent Team Failover');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'agent_roles_teams' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_agent_team_final_output WHERE team_id IN (SELECT id FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%');
DELETE FROM ai_agent_team_recommendations WHERE organization_id=@org;
DELETE FROM ai_agent_team_consensus WHERE team_id IN (SELECT id FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%');
DELETE FROM ai_agent_team_handoffs WHERE team_id IN (SELECT id FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%');
DELETE FROM ai_agent_team_delegations WHERE team_id IN (SELECT id FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%');
DELETE FROM ai_agent_team_lifecycle WHERE organization_id=@org;
DELETE FROM ai_agent_team_health WHERE organization_id=@org;
DELETE FROM ai_agent_team_members WHERE team_id IN (SELECT id FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%');
DELETE FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%';
DELETE FROM ai_agent_team_roles WHERE role_code LIKE 'ROLE-%';
DELETE FROM ai_agent_team_role_categories WHERE organization_id=@org;

DECLARE @cats TABLE(category NVARCHAR(180), role_count INT, assigned INT, available INT, unfilled INT, tasks INT, success DECIMAL(8,2), workload DECIMAL(8,2), failover DECIMAL(8,2), output DECIMAL(8,2), health DECIMAL(8,2));
INSERT INTO @cats VALUES
('Executive Roles',4,5,6,0,9,97,78,98,98,98),('Supervisory Roles',5,7,8,0,16,97,82,97,97,97),('Planning Roles',4,5,6,0,14,96,74,96,96,96),('Coordination Roles',4,5,6,0,17,95,84,95,95,95),('Research Roles',4,6,7,0,24,97,77,96,96,97),('Strategy Roles',3,4,5,0,18,96,72,96,96,96),('Writing Roles',4,6,7,0,28,95,79,95,96,95),('Validation Roles',4,5,6,0,20,98,70,97,98,98),('Creative Roles',3,4,5,0,15,94,81,94,94,94),('Image Roles',3,4,5,1,18,93,86,91,93,91),('Audio Roles',3,4,5,0,12,95,68,95,95,95),('Video Roles',4,5,6,1,21,92,88,90,92,90),('SEO Roles',3,4,5,0,14,96,69,96,96,96),('Compliance Roles',4,5,6,0,17,98,67,97,98,98),('Publishing Roles',3,4,5,0,16,96,75,96,97,96),('Analytics Roles',3,4,5,0,13,96,63,96,96,96),('Learning Roles',3,4,5,0,12,95,62,95,95,95),('Monitoring Roles',3,4,5,0,19,97,72,97,96,97),('Recovery Roles',3,4,5,0,15,95,71,98,95,96),('Utility Roles',3,3,4,0,8,98,55,98,96,98);

INSERT INTO ai_agent_team_role_categories(organization_id,category_name,role_count,assigned_agents,available_agents,unfilled_roles,active_tasks,success_rate,average_workload,failover_coverage,final_output_ownership,health_percent)
SELECT @org, category, role_count, assigned, available, unfilled, tasks, success, workload, failover, output, health FROM @cats;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 64),
cats AS (SELECT category, ROW_NUMBER() OVER (ORDER BY category) rn, COUNT(*) OVER () cnt FROM @cats),
src AS (SELECT n.i, c.category FROM n JOIN cats c ON c.rn=((n.i-1)%c.cnt)+1)
INSERT INTO ai_agent_team_roles(organization_id,role_code,role_name,category,description,role_type,scope,status,required_capabilities,eligible_agents,primary_agent_id,primary_agent_name,backup_agents,supervisor_role,delegation_authority,approval_authority,tool_scope,memory_scope,maximum_workload,current_workload,failover_enabled,success_rate,final_output_responsibility,owner,organization_name,environment)
SELECT @org, CONCAT('ROLE-',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)), CONCAT(REPLACE(category,' Roles',''),' Role ',RIGHT('00'+CAST(((i-1)%6)+1 AS NVARCHAR(2)),2)), category, CONCAT('Governed autonomous ',category,' responsibility.'), CASE WHEN category LIKE 'Executive%' THEN 'Executive' WHEN category LIKE 'Supervisory%' THEN 'Supervisor' WHEN category LIKE 'Coordination%' THEN 'Coordinator' WHEN category LIKE 'Planning%' THEN 'Planner' WHEN category LIKE 'Validation%' THEN 'Validator' WHEN category LIKE 'Publishing%' THEN 'Publisher' WHEN category LIKE 'Analytics%' THEN 'Analyst' WHEN category LIKE 'Recovery%' THEN 'Recovery' WHEN category LIKE 'Utility%' THEN 'Utility' ELSE 'Specialist' END, CASE WHEN i%3=0 THEN 'System' ELSE 'Organization' END, CASE WHEN i IN (10,28) THEN 'Unfilled' WHEN i%19=0 THEN 'Degraded' ELSE 'Active' END, 'agent capabilities, workflow context, tools, memory, final-output contract', 2+(i%5), a.id, a.name, 'backup agent pool', 'Supervisor Role', 'dynamic delegation within policy', CASE WHEN i%8=0 THEN 'governance required' ELSE 'autonomous within guardrails' END, 'workflow, search, validation, publishing where authorized', 'working, semantic, brand, audience', 100, 45+(i%45), CASE WHEN i IN (10,28) THEN 0 ELSE 1 END, 92+(i%7), CASE WHEN i%4=0 THEN 'direct owner' ELSE 'contributor' END, 'Team Governance Engine', @orgName, 'Production'
FROM src OUTER APPLY (SELECT TOP 1 id,name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,src.i))) a OPTION (MAXRECURSION 0);

DECLARE @teams TABLE(name NVARCHAR(180), objective NVARCHAR(500));
INSERT INTO @teams VALUES
('Content Research Team','Discover, verify, and synthesize content opportunities'),('Content Strategy Team','Convert research into executable content strategy'),('Long-Form Video Team','Deliver long-form video content outcomes'),('Short-Form Video Team','Deliver short-form video content outcomes'),('Blog Production Team','Produce article and blog outputs'),('Social Media Team','Produce and schedule social channel outputs'),('Newsletter Team','Produce newsletter content packages'),('Podcast Team','Produce podcast topics, scripts, and assets'),('Creative Asset Team','Generate creative direction and visual assets'),('Voice and Audio Team','Generate narration, voices, and mastered audio'),('Video Production Team','Coordinate video generation and editing'),('Approval and Compliance Team','Validate quality, compliance, copyright, and safety'),('Publishing Team','Prepare and publish final outputs'),('Analytics Team','Analyze performance and business impact'),('Learning and Optimization Team','Update learning loops and optimization policies'),('Monitoring and Recovery Team','Monitor execution and recover failures'),('Executive Intelligence Team','Prepare executive recommendations and risk intelligence'),('Campaign Team','Coordinate campaign execution across outputs'),('Incident Response Team','Coordinate autonomous incident response'),('Custom Organization Teams','Support organization-specific operating structures');

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 28),
teams AS (SELECT name, objective, ROW_NUMBER() OVER (ORDER BY name) rn, COUNT(*) OVER () cnt FROM @teams),
src AS (SELECT n.i, t.name, t.objective FROM n JOIN teams t ON t.rn=((n.i-1)%t.cnt)+1)
INSERT INTO ai_agent_teams(organization_id,team_code,team_name,team_type,objective,supervisor_agent,team_members,active_tasks,current_workload,success_rate,handoff_rate,consensus_success,average_duration_minutes,average_cost,final_output_coverage,health_percent,status)
SELECT @org, CONCAT('TEAM-',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)), CASE WHEN i <= 20 THEN src.name ELSE CONCAT(src.name,' ',i) END, src.name, src.objective, COALESCE(a.name,'Supervisor Agent'), 3+(i%5), 2+(i%8), 54+(i%38), 93+(i%6), 95+(i%5), 92+(i%6), 18+(i%28), CAST(0.42+(i%10)*0.18 AS DECIMAL(18,4)), 92+(i%7), CASE WHEN i%13=0 THEN 88 ELSE 93+(i%6) END, CASE WHEN i%13=0 THEN 'Degraded' WHEN i%7=0 THEN 'Busy' ELSE 'Active' END
FROM src OUTER APPLY (SELECT TOP 1 name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,src.i))) a OPTION (MAXRECURSION 0);

INSERT INTO ai_agent_team_members(team_id,role_id,agent_id,agent_code,agent_name,member_role,responsibility,workload,availability,failover_rank)
SELECT t.id, r.id, a.id, a.code, a.name, r.role_name, 'team objective contribution and handoff ownership', 40 + (ABS(CHECKSUM(t.id,r.id))%45), 'Available', ABS(CHECKSUM(r.id))%3
FROM ai_agent_teams t CROSS APPLY (SELECT TOP 3 * FROM ai_agent_team_roles r WHERE r.organization_id=@org ORDER BY ABS(CHECKSUM(r.id,t.id))) r OUTER APPLY (SELECT TOP 1 id,code,name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,r.id))) a WHERE t.team_code LIKE 'TEAM-%';

DECLARE @life TABLE(stage NVARCHAR(180), seq INT);
INSERT INTO @life VALUES ('Objective Received',1),('Team Selected',2),('Supervisor Assigned',3),('Roles Validated',4),('Work Decomposed',5),('Tasks Delegated',6),('Parallel and Sequential Execution',7),('Handoffs',8),('Review and Consensus',9),('Outputs Integrated',10),('Final Result Validated',11),('Learning Updated',12),('Team Available',13),('Role Unavailable',14),('Replacement Selected',15),('Context Transferred',16),('Task Reassigned',17),('Output Revalidated',18),('Team Execution Resumed',19),('Handoff Failed',20),('Failure Diagnosed',21),('Output Preserved',22),('Handoff Retried',23),('Alternate Agent Selected',24),('Consensus Recalculated',25);
INSERT INTO ai_agent_team_lifecycle(organization_id,stage_name,team_count,active_tasks,completed_tasks,failure_count,recovery_count,average_duration,health_percent,current_blockers)
SELECT @org, stage, 28-(seq%5), 12+(seq%9), 80+(seq*3), CASE WHEN seq IN (14,20) THEN 2 ELSE 0 END, CASE WHEN seq IN (15,21,23,24,25) THEN 2 ELSE 0 END, CONCAT(6+seq,'m'), CASE WHEN seq IN (14,20) THEN 90 ELSE 94+(seq%5) END, CASE WHEN seq IN (14,20) THEN 'autonomous recovery active' ELSE 'none' END FROM @life;

INSERT INTO ai_agent_team_health(organization_id,service_name,service_state,health_percent,blocker,auto_fix_available) VALUES
(@org,'Team registry','Healthy',98,NULL,1),(@org,'Role registry','Healthy',97,NULL,1),(@org,'Supervisor engine','Healthy',96,NULL,1),(@org,'Delegation engine','Healthy',96,NULL,1),(@org,'Collaboration planner','Healthy',95,NULL,1),(@org,'Handoff manager','Healthy',97,NULL,1),(@org,'Consensus engine','Healthy',95,NULL,1),(@org,'Voting engine','Healthy',95,NULL,1),(@org,'Shared-context service','Healthy',96,NULL,1),(@org,'Shared-memory service','Healthy',96,NULL,1),(@org,'Workload balancer','Warning',91,'two roles overloaded',1),(@org,'Role failover service','Healthy',97,NULL,1),(@org,'Team recovery manager','Healthy',96,NULL,1),(@org,'Final-output ownership validator','Healthy',96,NULL,1),(@org,'Audit pipeline','Healthy',99,NULL,1);

INSERT INTO ai_agent_team_delegations(team_id,rule_name,source_role,target_role,delegation_policy,priority_rule,health_percent) SELECT id,'Objective decomposition delegation','Supervisor','Specialists','dynamic policy-based delegation','deadline, capability fit, workload',health_percent FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%';
INSERT INTO ai_agent_team_handoffs(team_id,from_role,to_role,handoff_schema,handoff_status,success_rate,retry_policy,final_output_risk) SELECT id,'Specialist','Validator','structured JSON output handoff','Healthy',handoff_rate,'retry, alternate agent, preserve output',CASE WHEN health_percent<90 THEN 1 ELSE 0 END FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%';
INSERT INTO ai_agent_team_consensus(team_id,rule_name,consensus_type,voting_rule,deadlock_policy,success_rate,active_evaluations) SELECT id,'Recommendation consensus','weighted consensus','supervisor weighted majority','recalculate with alternate reviewer',consensus_success,CASE WHEN status='Busy' THEN 1 ELSE 0 END FROM ai_agent_teams WHERE team_code LIKE 'TEAM-%';
INSERT INTO ai_agent_team_final_output(team_id,role_id,output_stage,owner_name,validation_state,publishing_link,analytics_link,learning_link,readiness) SELECT t.id,r.id,t.team_type,r.primary_agent_name,'validated','linked','linked','linked',t.final_output_coverage FROM ai_agent_teams t OUTER APPLY (SELECT TOP 1 * FROM ai_agent_team_roles r WHERE r.organization_id=@org ORDER BY ABS(CHECKSUM(r.id,t.id))) r WHERE t.team_code LIKE 'TEAM-%';
INSERT INTO ai_agent_team_recommendations(organization_id,team_id,role_id,problem,recommendation,expected_benefit,risk,confidence,auto_apply_eligible,governance_requirement,status)
SELECT @org,t.id,r.id,CASE WHEN t.status='Degraded' THEN 'degraded team health' WHEN r.status='Unfilled' THEN 'unfilled critical role' ELSE 'safe workload optimization' END,CASE WHEN t.status='Degraded' THEN 'activate failover, rebalance workload, and revalidate handoffs' WHEN r.status='Unfilled' THEN 'assign eligible backup agent and validate capability fit' ELSE 'rebalance specialist tasks across available agents' END,'higher team health, handoff reliability, and final-output coverage',CASE WHEN t.status='Degraded' OR r.status='Unfilled' THEN 'medium' ELSE 'low' END,89,CASE WHEN t.status='Active' AND r.status='Active' THEN 1 ELSE 0 END,CASE WHEN t.status='Active' AND r.status='Active' THEN 'none for routine balancing' ELSE 'governance review required' END,'recommended'
FROM ai_agent_teams t OUTER APPLY (SELECT TOP 1 * FROM ai_agent_team_roles r WHERE r.organization_id=@org ORDER BY ABS(CHECKSUM(r.id,t.id))) r WHERE t.team_code LIKE 'TEAM-%';
