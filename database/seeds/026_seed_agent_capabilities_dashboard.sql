SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);

MERGE permissions AS target
USING (VALUES
('agent_capabilities.view','View agent capabilities'),('agent_capabilities.view_details','View capability details'),('agent_capabilities.create','Create capabilities'),('agent_capabilities.edit','Edit capabilities'),('agent_capabilities.validate','Validate capabilities'),('agent_capabilities.test','Test capabilities'),('agent_capabilities.publish','Publish capabilities'),('agent_capabilities.disable','Disable capabilities'),('agent_capabilities.deprecate','Deprecate capabilities'),('agent_capabilities.archive','Archive capabilities'),('agent_capabilities.generate_ai','Generate capabilities with AI'),('agent_capabilities.export','Export capability catalogue'),('agent_capabilities.manage_governance','Manage capability governance')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'agent_capabilities.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'agent-capabilities' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=97, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',97);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('AGENT_CAPABILITY_CREATION','Agent Capability Creation'),('AGENT_CAPABILITY_VALIDATION','Agent Capability Validation'),('AGENT_CAPABILITY_TEST','Agent Capability Test'),('AGENT_CAPABILITY_VERSION_PUBLISH','Agent Capability Version Publish'),('AGENT_CAPABILITY_OVERLAP_RESOLUTION','Agent Capability Overlap Resolution'),('AGENT_CAPABILITY_DEPRECATION','Agent Capability Deprecation'),('AGENT_CAPABILITY_OPTIMIZATION','Agent Capability Optimization'),('AGENT_CAPABILITY_GOVERNANCE_APPROVAL','Agent Capability Governance Approval');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'agent_capabilities' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_capability_final_output_links WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_recommendations WHERE organization_id=@org;
DELETE FROM ai_capability_overlaps WHERE organization_id=@org;
DELETE FROM ai_capability_tests WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_validations WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_memory_rag WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_tool_requirements WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_provider_models WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_workflow_usage WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_assignments WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capability_registry_health WHERE organization_id=@org;
DELETE FROM ai_capability_domains WHERE organization_id=@org;
DELETE FROM ai_capability_versions WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%');
DELETE FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';

DECLARE @domains TABLE(domain NVARCHAR(180), total INT, active INT, draft INT, invalid INT, assigned INT, workflows INT, success DECIMAL(8,2), confidence DECIMAL(8,2), cost DECIMAL(18,4), output DECIMAL(8,2), health DECIMAL(8,2));
INSERT INTO @domains VALUES
('Research',6,5,0,0,15,12,97,94,0.82,96,97),('Trend Discovery',5,4,0,0,10,8,96,93,0.74,94,96),('Keyword Intelligence',5,4,1,0,11,9,96,92,0.69,94,95),('Competitor Intelligence',5,4,0,0,10,8,95,92,0.88,93,95),('Audience Intelligence',5,4,0,0,10,8,96,93,0.78,95,96),('Research Synthesis',5,5,0,0,14,11,97,94,0.91,96,97),('Content Strategy',5,4,0,0,12,10,96,93,0.84,95,96),('Outline Generation',5,4,0,0,11,9,96,93,0.55,94,95),('Script Writing',5,4,1,0,13,11,95,92,0.95,95,94),('Blog Writing',5,4,0,0,10,8,95,92,0.72,94,95),('Social Copy',5,4,0,0,9,7,96,93,0.41,93,95),('Newsletter Writing',5,4,0,0,9,7,95,92,0.46,92,94),('Translation',5,4,0,0,8,6,97,94,0.52,93,96),('Localization',5,4,0,0,8,6,96,93,0.58,93,95),('Fact Checking',5,4,0,0,12,10,97,95,0.86,96,97),('Citation Verification',5,4,0,0,12,10,97,95,0.77,96,97),('Creative Direction',5,4,1,0,9,7,94,91,0.93,91,93),('Storyboarding',5,4,0,0,8,6,94,91,0.98,91,93),('Image Generation',5,4,0,1,10,8,92,90,1.21,89,88),('Thumbnail Generation',5,4,0,0,9,7,94,91,0.83,91,93),('Infographic Generation',5,4,0,0,8,6,93,90,1.05,90,92),('Voice Generation',5,4,0,0,9,7,95,92,0.89,92,94),('Audio Processing',5,4,0,0,8,6,95,92,0.66,92,94),('Video Generation',5,4,1,1,10,8,91,89,1.84,88,87),('Video Editing',5,4,0,0,9,7,93,90,1.16,90,92),('Captioning',5,4,0,0,9,7,96,93,0.44,94,95),('SEO Optimization',5,4,0,0,10,8,96,93,0.48,95,96),('Compliance Validation',5,4,0,0,11,9,97,95,0.62,96,97),('Copyright Validation',5,4,0,0,11,9,97,95,0.66,96,97),('Publishing',5,4,0,0,10,8,95,92,0.52,95,95),('Analytics',5,4,0,0,10,8,96,93,0.57,94,95),('Forecasting',5,4,1,0,8,6,94,91,0.73,91,93),('Learning',5,4,0,0,8,6,95,92,0.49,92,94),('Monitoring',5,4,0,0,10,8,97,95,0.35,94,97),('Recovery',5,4,0,1,12,10,94,91,0.81,93,92),('Executive Recommendation',5,4,1,0,8,6,95,92,0.88,94,94),('Coordination',5,4,1,1,11,9,94,91,0.69,92,91),('System Utility',1,1,0,0,1,1,98,96,0.20,96,98);

INSERT INTO ai_capability_domains(organization_id,domain_name,total_capabilities,active_capabilities,draft_capabilities,invalid_capabilities,assigned_agents,workflow_usage,success_rate,average_confidence,average_cost,final_output_contribution,health_percent,last_updated)
SELECT @org, domain, total, active, draft, invalid, assigned, workflows, success, confidence, cost, output, health, SYSUTCDATETIME() FROM @domains;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 186),
domains AS (SELECT domain, ROW_NUMBER() OVER (ORDER BY domain) rn, COUNT(*) OVER () cnt FROM @domains),
src AS (SELECT n.i, d.domain FROM n JOIN domains d ON d.rn=((n.i-1)%d.cnt)+1)
INSERT INTO ai_capabilities(organization_id,capability_code,capability_name,domain,description,input_contract,output_contract,required_tools,supported_models,quality_rules,security_classification,version,current_version,published_version,status,validation_status,health_percent,input_types,output_types,assigned_agents,workflow_usage,supported_providers,memory_requirement,rag_requirement,confidence_threshold,avg_duration_ms,avg_cost,success_rate,output_acceptance,recovery_policy,fallback_capability,final_output_linked,last_test,last_used,owner,organization_scope)
SELECT @org, CONCAT('CAPG-',RIGHT('0000'+CAST(i AS NVARCHAR(4)),4)), CONCAT(domain,' Capability ',RIGHT('00'+CAST(((i-1)%5)+1 AS NVARCHAR(2)),2)), domain, CONCAT('Reusable governed ',domain,' executable capability contract.'), 'typed JSON input contract', 'versioned validated output contract', 'workflow.database.read, search, validation', 'gpt-5, gpt-5-mini, local-structured-v1', 'confidence, quality, provenance, final-output linkage', 'internal', 1, 3, 3,
CASE WHEN i<=158 THEN 'Active' WHEN i<=170 THEN 'Draft' WHEN i<=174 THEN 'Invalid' WHEN i<=182 THEN 'Deprecated' ELSE 'Warning' END,
CASE WHEN i<=158 THEN 'Valid' WHEN i<=170 THEN 'Warning' WHEN i<=174 THEN 'Invalid' ELSE 'Warning' END,
CASE WHEN i<=158 THEN 94 + (i%5) WHEN i<=170 THEN 88 ELSE 82 + (i%6) END,
'workflow context, structured JSON, memory context', 'validated content object, score, recommendation', 1 + (i%5), 1 + (i%4), 'OpenAI, Local Structured', 'required', 'required', 90 + (i%5), 42000 + (i%12)*3000, CAST(0.28 + (i%14)*0.11 AS DECIMAL(18,4)), 92 + (i%7), 90 + (i%6), 'standard capability recovery', 'Fallback Capability', CASE WHEN i%17=0 THEN 0 ELSE 1 END, DATEADD(HOUR,-i,SYSUTCDATETIME()), DATEADD(MINUTE,-i*9,SYSUTCDATETIME()), 'Capability Governance Engine', CASE WHEN i%3=0 THEN 'System' ELSE 'Organization' END
FROM src OPTION (MAXRECURSION 0);

INSERT INTO ai_capability_versions(capability_id,version,status,change_summary) SELECT id,current_version,CASE WHEN status='Draft' THEN 'draft' ELSE 'active' END,'seeded governed capability version' FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_assignments(capability_id,agent_id,agent_code,agent_name,assignment_status,assignment_priority,compatibility,version_compatibility)
SELECT c.id,a.id,a.code,a.name,CASE WHEN c.status='Deprecated' THEN 'Deprecated' ELSE 'Primary' END,'high','compatible','current' FROM ai_capabilities c CROSS APPLY (SELECT TOP 1 * FROM ai_agents a WHERE a.organization_id=@org AND a.code LIKE 'AG-%' ORDER BY ABS(CHECKSUM(c.id,a.id))) a WHERE c.capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_workflow_usage(capability_id,workflow_definition,workflow_stage,usage_status,input_mapping,output_mapping,final_output_gap) SELECT id,'Content Lifecycle Workflow',domain,'Required','workflow -> capability','capability -> output',CASE WHEN final_output_linked=1 THEN 0 ELSE 1 END FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_provider_models(capability_id,provider,model,compatibility_status,supported_modality,supported_languages,context_window,tool_support,structured_output_support,latency_ms,cost,quality,reliability,data_residency) SELECT id,'OpenAI','gpt-5','Fully Supported','text, image, audio, video where applicable','English, multilingual',128000,'supported',1,avg_duration_ms/10,avg_cost,success_rate,health_percent,'tenant safe' FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_tool_requirements(capability_id,tool_code,tool_name,requirement_status,permission_code,rate_limit,cost_ceiling,failure_behavior,health_percent) SELECT id,'workflow.database.read','Workflow Database Read','Required','agent_capabilities.view','100/min',2.50,'retry then fallback',health_percent FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_memory_rag(capability_id,memory_required,memory_types,retrieval_required,data_sources,embedding_model,reranker,minimum_relevance, freshness_policy, provenance_requirement, context_budget, tenant_isolation, health_percent) SELECT id,1,'working, semantic, brand, audience',1,'brand memory, topic library, workflow outputs','text-embedding-3-large','cross-encoder',88,'fresh within policy','required',64000,'strict',health_percent FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_validations(capability_id,validation_area,validation_status,validation_score,issue_count,auto_fix_available) SELECT id,'full contract validation',validation_status,health_percent,CASE WHEN validation_status='Invalid' THEN 2 WHEN validation_status='Warning' THEN 1 ELSE 0 END,1 FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_tests(capability_id,test_mode,test_status,quality_score,confidence,duration_ms,cost,final_output_contribution) SELECT id,'End-to-End Workflow Test',CASE WHEN validation_status='Invalid' THEN 'Failed' ELSE 'Passed' END,health_percent,confidence_threshold,avg_duration_ms,avg_cost,CASE WHEN final_output_linked=1 THEN 95 ELSE 72 END FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_final_output_links(capability_id,agent_name,workflow_stage,output_name,validation_state,publishing_link,analytics_link,learning_link,final_business_result,readiness) SELECT c.id,a.agent_name,c.domain,'Final business result','validated','linked','linked','linked','CACSMS content outcome',CASE WHEN c.final_output_linked=1 THEN 95 ELSE 72 END FROM ai_capabilities c OUTER APPLY (SELECT TOP 1 agent_name FROM ai_capability_assignments aa WHERE aa.capability_id=c.id) a WHERE c.capability_code LIKE 'CAPG-%';
INSERT INTO ai_capability_overlaps(organization_id,capabilities_involved,similarity_score,overlap_type,assigned_agents,workflow_impact,cost_impact,maintenance_impact,performance_comparison,recommended_action,merge_eligibility,deprecation_eligibility) VALUES
(@org,'Research Synthesis Capability 01, Research Capability 02',84,'overlapping objective','Research Agent','workflow ambiguity',12.50,'medium','Research Synthesis has stronger output acceptance','clarify responsibility and merge shared contract',1,0),
(@org,'Video Generation Capability 03, Video Editing Capability 02',76,'shared tools','Video Agent','tool contention',18.20,'medium','Video Editing has lower cost','split generation from editing and add fallback',0,0),
(@org,'Coordination Capability 01, System Utility Capability 01',71,'duplicate orchestration support','Monitoring Agent','low',4.10,'low','Coordination broader but slower','deprecate duplicate utility path',0,1);
INSERT INTO ai_capability_recommendations(organization_id,capability_id,problem,recommendation,expected_benefit,cost_impact,risk,confidence,auto_apply_eligible,governance_requirement,status)
SELECT @org,id,CASE WHEN status='Invalid' THEN 'invalid capability contract' WHEN final_output_linked=0 THEN 'missing final-output linkage' ELSE 'safe optimization opportunity' END,CASE WHEN status='Invalid' THEN 'repair schema, tools, fallback, and workflow linkage' WHEN final_output_linked=0 THEN 'connect publishing, analytics, and learning output chain' ELSE 'refresh documentation and validation metadata' END,'higher health and output readiness',CASE WHEN status='Invalid' THEN 2.40 ELSE 0 END,CASE WHEN status='Invalid' THEN 'medium' ELSE 'low' END,88,CASE WHEN status='Active' THEN 1 ELSE 0 END,CASE WHEN status='Active' THEN 'none for metadata' ELSE 'governance required' END,'recommended' FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%' AND (status<>'Active' OR final_output_linked=0 OR id IN (SELECT TOP 20 id FROM ai_capabilities WHERE capability_code LIKE 'CAPG-%' ORDER BY created_at));
INSERT INTO ai_capability_registry_health(organization_id,service_name,service_state,health_percent,blocker,auto_fix_available) VALUES
(@org,'Capability registry service','Healthy',98,NULL,1),(@org,'Capability schema validator','Healthy',97,NULL,1),(@org,'Input-contract validator','Healthy',96,NULL,1),(@org,'Output-contract validator','Healthy',96,NULL,1),(@org,'Tool dependency validator','Warning',91,'tool fallback gaps',1),(@org,'Provider/model compatibility validator','Healthy',96,NULL,1),(@org,'Agent-assignment validator','Healthy',95,NULL,1),(@org,'Workflow-mapping validator','Healthy',95,NULL,1),(@org,'Security validator','Healthy',97,NULL,1),(@org,'Recovery validator','Warning',90,'fallback gaps',1),(@org,'Performance analyzer','Healthy',96,NULL,1),(@org,'Final-output linkage validator','Healthy',95,NULL,1),(@org,'Duplicate and overlap detector','Warning',89,'overlap candidates',0),(@org,'Audit pipeline','Healthy',99,NULL,1);
