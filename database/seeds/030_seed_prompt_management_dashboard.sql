DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50030, 'No organization exists for prompt management seed.', 1;

DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);
DECLARE @permissions TABLE(code NVARCHAR(120), description NVARCHAR(220));
INSERT INTO @permissions VALUES
('prompt.view','View Prompt Management'),('prompt.create','Create Prompts'),('prompt.edit','Edit Prompts'),('prompt.deploy','Deploy Prompts'),('prompt.rollback','Rollback Prompts'),('prompt.optimize','Optimize Prompts'),('prompt.export','Export Prompt Library');
MERGE permissions AS target
USING (SELECT code,description FROM @permissions) AS source
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL
  INSERT INTO role_permissions(role_id,permission_id)
  SELECT @adminRole,p.id FROM permissions p JOIN @permissions x ON x.code=p.code
  WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'prompt-management' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES ('PROMPT_VALIDATE','Prompt Validation'),('PROMPT_TEST','Prompt Testing'),('PROMPT_SIMULATE','Prompt Simulation'),('PROMPT_OPTIMIZE','Prompt Optimization'),('PROMPT_DEPLOY','Prompt Deployment'),('PROMPT_ROLLBACK','Prompt Rollback');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'prompt_management' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_prompt_final_outputs WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_deployments WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_security WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_recoveries WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_costs WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_metrics WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_validation WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_ab_tests WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_simulations WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_tests WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_rag WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_memory WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_providers WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_models WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_tools WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_context WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_variables WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompt_versions WHERE prompt_id IN (SELECT id FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%');
DELETE FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
DELETE FROM ai_prompt_categories WHERE organization_id=@org;

DECLARE @cat TABLE(name NVARCHAR(160), total INT, active INT, confidence DECIMAL(8,2), success DECIMAL(8,2), security DECIMAL(8,2), output DECIMAL(8,2));
INSERT INTO @cat VALUES
('System Prompts',10,8,96,97,99,97),('Task Prompts',9,7,94,96,98,96),('Research Prompts',8,6,93,95,97,95),('Planning Prompts',8,6,94,96,97,96),('Reasoning Prompts',8,6,93,94,96,95),('Writing Prompts',9,7,95,97,98,97),('Creative Prompts',7,5,92,94,97,94),('Image Prompts',6,5,91,93,97,94),('Voice Prompts',5,4,92,94,97,95),('Video Prompts',5,4,91,93,96,93),('Validation Prompts',7,6,96,98,99,98),('Recovery Prompts',6,5,94,96,99,96),('Reflection Prompts',6,5,93,95,98,95),('Revision Prompts',6,5,94,96,98,96),('Tool Prompts',7,5,93,95,97,95),('Memory Prompts',6,5,92,94,98,94),('RAG Prompts',7,5,94,96,98,96),('Publishing Prompts',6,5,95,97,99,97),('Analytics Prompts',6,4,93,95,98,95),('Learning Prompts',6,4,92,94,98,94);
INSERT INTO ai_prompt_categories(organization_id,category_name,total_prompts,active_prompts,average_confidence,success_rate,security_score,final_output_success)
SELECT @org,name,total,active,confidence,success,security,output FROM @cat;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i < 138),
cats AS (SELECT c.id,c.category_name, ROW_NUMBER() OVER (ORDER BY c.category_name) rn, COUNT(*) OVER () cnt FROM ai_prompt_categories c WHERE c.organization_id=@org),
src AS (SELECT n.i, c.id category_id, c.category_name FROM n JOIN cats c ON c.rn=((n.i-1)%c.cnt)+1)
INSERT INTO ai_prompts(organization_id,category_id,prompt_code,prompt_name,purpose,current_version,status,assigned_agents,supported_models,supported_providers,average_tokens,average_cost,average_confidence,acceptance_rate,execution_count,success_rate,final_output_state,prompt_text,system_instructions,examples,output_format,human_attention_required)
SELECT @org, src.category_id, CONCAT('PRM-',RIGHT('0000'+CAST(src.i AS NVARCHAR(4)),4)), CONCAT(src.category_name,' Asset ',src.i),
CONCAT('Executable prompt asset for autonomous ',LOWER(src.category_name),' across content lifecycle workflows.'),
CONCAT('v',1+(src.i%5),'.',src.i%9),
CASE WHEN src.i<=102 THEN 'Production' WHEN src.i<=120 THEN 'Draft' WHEN src.i<=130 THEN 'Testing' ELSE 'Canary' END,
2+(src.i%9), 3+(src.i%7), 2+(src.i%6), 720+(src.i*17)%2200, CAST(0.018+(src.i%20)*0.006 AS DECIMAL(18,4)),
88+(src.i%11), 86+(src.i%12), 180+(src.i*19)%7200, 89+(src.i%10), CASE WHEN src.i%17=0 THEN 'guarded' ELSE 'validated' END,
CONCAT('Use CACSMS production context, verified evidence, tool policy, memory policy, and final-output validation to complete ',src.category_name,'.'),
'Follow system safety, business outcome, provenance, recovery, and formatting rules.',
'Example input includes workflow objective, brand context, audience context, tool outputs, and memory references.',
'Structured JSON with summary, evidence, confidence, risks, recovery, and finalOutputContribution.',
CASE WHEN src.i%17=0 THEN 1 ELSE 0 END
FROM src OPTION (MAXRECURSION 0);

INSERT INTO ai_prompt_versions(prompt_id,version_label,version_state,quality_score,token_delta)
SELECT id,current_version,status,average_confidence,CASE WHEN average_tokens>1600 THEN -140 ELSE -30 END FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_variables(prompt_id,variable_name,variable_type,required,source,validation_state)
SELECT id,'workflow_objective','Workflow variable',1,'workflow','valid' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%'
UNION ALL SELECT id,'brand_voice','Brand variable',1,'brand memory','valid' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_context(prompt_id,context_block,compression,relevance,freshness,overflow_handling)
SELECT id,'Brand, audience, workflow, evidence, and tool context',72+(ABS(CHECKSUM(id))%18),90+(ABS(CHECKSUM(prompt_code))%9),91+(ABS(CHECKSUM(prompt_name))%8),'compress low relevance blocks, preserve provenance' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_tools(prompt_id,tool_name,permission_state,invocation_mode,validation_state)
SELECT id,CASE ABS(CHECKSUM(id))%5 WHEN 0 THEN 'Search' WHEN 1 THEN 'Database' WHEN 2 THEN 'Memory' WHEN 3 THEN 'RAG' ELSE 'Publishing' END,'allowed','policy gated','valid' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_models(prompt_id,model_name,compatibility_state,max_context,latency_ms,quality,cost_score,reliability,recommended)
SELECT id,CASE ABS(CHECKSUM(id))%4 WHEN 0 THEN 'gpt-4.1' WHEN 1 THEN 'claude-sonnet' WHEN 2 THEN 'gemini-pro' ELSE 'mistral-large' END,'compatible',128000,650+(ABS(CHECKSUM(prompt_code))%900),90+(ABS(CHECKSUM(prompt_name))%9),82+(ABS(CHECKSUM(id))%13),91+(ABS(CHECKSUM(prompt_code,id))%8),1 FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_providers(prompt_id,provider_name,compatibility_state,fallback_rank,health_percent)
SELECT id,CASE ABS(CHECKSUM(id))%6 WHEN 0 THEN 'OpenAI' WHEN 1 THEN 'Anthropic' WHEN 2 THEN 'Google' WHEN 3 THEN 'Mistral' WHEN 4 THEN 'Azure' ELSE 'OpenRouter' END,'compatible',1+(ABS(CHECKSUM(id))%3),94+(ABS(CHECKSUM(prompt_code))%5) FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_memory(prompt_id,memory_type,orchestration_state,usage_percent,retrieval_confidence)
SELECT id,'Semantic, shared, brand, audience, organization, and recovery memory','healthy',58+(ABS(CHECKSUM(id))%35),89+(ABS(CHECKSUM(prompt_code))%10) FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_rag(prompt_id,knowledge_source,embedding_model,retriever,top_k,reranking_state,provenance,confidence)
SELECT id,'CACSMS Content Knowledge Base','text-embedding-3-large','hybrid search',5+(ABS(CHECKSUM(id))%7),'enabled',92+(ABS(CHECKSUM(prompt_code))%7),88+(ABS(CHECKSUM(prompt_name))%10) FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_tests(prompt_id,test_name,test_type,result_state,quality_score,regression_safe)
SELECT id,'Golden dataset and regression suite','Regression Test','passed',90+(ABS(CHECKSUM(id))%9),1 FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_simulations(prompt_id,simulation_name,provider,model_name,confidence,tokens,cost,recovery_state)
SELECT id,'Autonomous content lifecycle simulation','OpenAI','gpt-4.1',88+(ABS(CHECKSUM(id))%10),average_tokens+120,average_cost*1.15,'not required' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_ab_tests(prompt_id,version_a,version_b,traffic_split,winner,success_lift,cost_delta,recommendation)
SELECT id,current_version,CONCAT(current_version,'-opt'),'80/20 canary',CONCAT(current_version,'-opt'),1+(ABS(CHECKSUM(id))%6),-1-(ABS(CHECKSUM(prompt_code))%8),'promote after production guardrail window' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_validation(prompt_id,validation_area,validation_state,issue_count,final_output_safe)
SELECT id,'variables, syntax, tools, security, recovery, final output','passed',CASE WHEN human_attention_required=1 THEN 1 ELSE 0 END,CASE WHEN human_attention_required=1 THEN 0 ELSE 1 END FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_metrics(prompt_id,success,failures,confidence,tokens,latency_ms,cost,acceptance,quality,revision_rate,recovery)
SELECT id,success_rate,CASE WHEN human_attention_required=1 THEN 2 ELSE 0 END,average_confidence,average_tokens,700+(ABS(CHECKSUM(id))%1100),average_cost,acceptance_rate,average_confidence,3+(ABS(CHECKSUM(prompt_code))%8),94+(ABS(CHECKSUM(id))%5) FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_costs(prompt_id,provider,model_name,average_cost,token_savings,optimization_state)
SELECT id,'OpenAI','gpt-4.1',average_cost,8+(ABS(CHECKSUM(id))%18),'optimized' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_recoveries(prompt_id,recovery_rule,trigger_condition,recovery_state,success_rate)
SELECT id,'fallback prompt, fallback model, retrieve evidence, validate output','low confidence, schema error, policy risk','ready',93+(ABS(CHECKSUM(id))%6) FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_security(prompt_id,security_area,scan_state,risk_score,auto_mitigation)
SELECT id,'injection, jailbreak, secrets, sensitive data, copyright, PII','passed',CASE WHEN human_attention_required=1 THEN 34 ELSE 4+(ABS(CHECKSUM(id))%22) END,'sanitize input, isolate tool output, require provenance, block secrets' FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_deployments(prompt_id,environment,deployment_state,deployed_version,canary_percent)
SELECT id,CASE WHEN status='Production' THEN 'production' ELSE 'staging' END,CASE WHEN status='Production' THEN 'deployed' ELSE 'pending' END,current_version,CASE WHEN status='Canary' THEN 20 ELSE 100 END FROM ai_prompts WHERE organization_id=@org AND prompt_code LIKE 'PRM-%';
INSERT INTO ai_prompt_final_outputs(prompt_id,agent_name,workflow_name,output_name,validation_state,publishing_state,analytics_state,business_result,readiness)
SELECT p.id, COALESCE(a.name,'Autonomous Content Agent'),'Content Lifecycle Workflow','Validated media content package','validated','ready','tracked','higher quality autonomous content output',90+(ABS(CHECKSUM(p.id))%9)
FROM ai_prompts p OUTER APPLY (SELECT TOP 1 name FROM ai_agents WHERE organization_id=@org ORDER BY ABS(CHECKSUM(id,p.id))) a WHERE p.organization_id=@org AND p.prompt_code LIKE 'PRM-%';
