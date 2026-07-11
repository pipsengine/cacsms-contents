SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);
DECLARE @queue UNIQUEIDENTIFIER;
DECLARE @provider UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM ai_providers ORDER BY created_at);
DECLARE @model UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM ai_models ORDER BY created_at);

MERGE permissions AS target
USING (VALUES
('ai_agent_registry.view','View agent registry'),('ai_agent_registry.view_details','View agent details'),('ai_agent_registry.register','Register agents'),('ai_agent_registry.edit','Edit agents'),('ai_agent_registry.validate','Validate agents'),('ai_agent_registry.test','Test agents'),('ai_agent_registry.publish','Publish agents'),('ai_agent_registry.enable','Enable agents'),('ai_agent_registry.disable','Disable agents'),('ai_agent_registry.duplicate','Duplicate agents'),('ai_agent_registry.deprecate','Deprecate agents'),('ai_agent_registry.archive','Archive agents'),('ai_agent_registry.manage_capabilities','Manage capabilities'),('ai_agent_registry.manage_schemas','Manage schemas'),('ai_agent_registry.manage_provider_mappings','Manage provider mappings'),('ai_agent_registry.manage_model_mappings','Manage model mappings'),('ai_agent_registry.manage_prompts','Manage prompts'),('ai_agent_registry.manage_tools','Manage tools'),('ai_agent_registry.manage_memory_rag','Manage memory and RAG'),('ai_agent_registry.manage_workflow_mappings','Manage workflow mappings'),('ai_agent_registry.manage_recovery','Manage recovery'),('ai_agent_registry.resolve_overlaps','Resolve overlaps'),('ai_agent_registry.apply_recommendations','Apply recommendations'),('ai_agent_registry.generate_ai','Generate agents with AI'),('ai_agent_registry.generate_documentation','Generate documentation'),('ai_agent_registry.export','Export registry'),('ai_agent_registry.manage_governance','Manage governance')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'ai_agent_registry.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'ai-agent-registry' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);
SET @queue = (SELECT TOP 1 id FROM job_queues WHERE organization_id=@org AND name='ai-agent-registry');

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('AI_AGENT_REGISTRATION','AI Agent Registration'),('AI_AGENT_REGISTRY_VALIDATION','AI Agent Registry Validation'),('AI_AGENT_TEST','AI Agent Test'),('AI_AGENT_VERSION_PUBLISH','AI Agent Version Publish'),('AI_AGENT_DUPLICATE_RESOLUTION','AI Agent Duplicate Resolution'),('AI_AGENT_DEPRECATION','AI Agent Deprecation'),('AI_AGENT_REGISTRY_OPTIMIZATION','AI Agent Registry Optimization'),('AI_AGENT_GOVERNANCE_APPROVAL','AI Agent Governance Approval');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'ai_agent_registry' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DECLARE @regDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='AI_AGENT_REGISTRATION');
IF OBJECT_ID('workflow_definition_stages','U') IS NOT NULL AND @regDef IS NOT NULL
BEGIN
  DELETE FROM workflow_definition_stages WHERE workflow_definition_id=@regDef;
  INSERT INTO workflow_definition_stages(organization_id,workflow_definition_id,code,name,stage_order)
  VALUES
  (@org,@regDef,'agent_definition_received','Agent Definition Received',1),(@org,@regDef,'identity_validated','Identity Validated',2),(@org,@regDef,'capabilities_validated','Capabilities Validated',3),(@org,@regDef,'input_schema_validated','Input Schema Validated',4),(@org,@regDef,'output_schema_validated','Output Schema Validated',5),(@org,@regDef,'provider_model_mapped','Provider and Model Mapped',6),(@org,@regDef,'prompt_validated','Prompt Validated',7),(@org,@regDef,'tools_authorized','Tools Authorized',8),(@org,@regDef,'memory_rag_validated','Memory and RAG Validated',9),(@org,@regDef,'queue_worker_mapped','Queue and Worker Mapped',10),(@org,@regDef,'workflow_stages_mapped','Workflow Stages Mapped',11),(@org,@regDef,'recovery_policy_mapped','Recovery Policy Mapped',12),(@org,@regDef,'quality_gates_validated','Quality Gates Validated',13),(@org,@regDef,'final_output_linkage_validated','Final-Output Linkage Validated',14),(@org,@regDef,'agent_test_executed','Agent Test Executed',15),(@org,@regDef,'version_created','Version Created',16),(@org,@regDef,'registry_entry_published','Registry Entry Published',17),(@org,@regDef,'audit_metrics_recorded','Audit and Metrics Recorded',18);
END;

DELETE FROM ai_agent_governance_approvals WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_documentation WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_change_history WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_final_output_links WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_dependencies WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_registry_recommendations WHERE organization_id=@org;
DELETE FROM ai_agent_registry_health WHERE organization_id=@org;
DELETE FROM ai_agent_overlap_analysis WHERE organization_id=@org;
DELETE FROM ai_agent_test_results WHERE test_id IN (SELECT t.id FROM ai_agent_tests t JOIN ai_agents a ON a.id=t.agent_id WHERE a.code LIKE 'AG-%');
DELETE FROM ai_agent_tests WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_validation_results WHERE validation_id IN (SELECT v.id FROM ai_agent_validations v JOIN ai_agents a ON a.id=v.agent_id WHERE a.code LIKE 'AG-%');
DELETE FROM ai_agent_validations WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_permissions WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_quality_gates WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_recovery_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_workflow_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_worker_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_queue_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_rag_policies WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_memory_policies WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_tool_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_prompt_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_model_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_provider_mappings WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_output_schemas WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_input_schemas WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_scopes WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_capabilities WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agent_versions WHERE agent_id IN (SELECT id FROM ai_agents WHERE code LIKE 'AG-%');
DELETE FROM ai_agents WHERE code LIKE 'AG-%';
DELETE FROM ai_capability_versions WHERE capability_id IN (SELECT id FROM ai_capabilities WHERE capability_code LIKE 'CAP-%');
DELETE FROM ai_capabilities WHERE capability_code LIKE 'CAP-%';
DELETE FROM ai_agent_domains WHERE organization_id=@org;

DECLARE @domains TABLE(domain NVARCHAR(180), total INT, active INT, draft INT, invalid INT, deprecated INT, health DECIMAL(8,2), coverage DECIMAL(8,2), output DECIMAL(8,2));
INSERT INTO @domains VALUES
('Research',5,5,0,0,0,97,98,96),('Strategy',4,4,1,0,0,96,96,95),('Writing',5,5,0,0,0,95,97,96),('Fact Checking',4,4,0,0,0,97,96,95),('Citation Verification',3,2,1,0,0,94,95,94),('Creative',4,4,1,0,0,93,94,92),('Image Generation',4,3,0,1,0,84,88,82),('Thumbnail Generation',3,2,1,0,0,91,92,90),('Voice',4,3,0,0,0,94,95,93),('Audio',3,2,0,0,0,93,94,92),('Video',4,3,1,0,0,90,91,90),('Editing',3,2,0,0,0,92,93,91),('SEO',4,3,0,0,0,96,95,95),('Compliance',4,3,0,0,0,95,97,96),('Publishing',4,3,0,0,0,94,96,95),('Analytics',4,3,0,0,0,92,93,92),('Learning',3,2,0,0,0,91,92,91),('Monitoring',4,3,0,0,0,96,97,95),('Recovery',4,3,0,0,0,94,95,94),('Executive Recommendations',3,2,1,0,0,93,94,93),('Coordination and Supervisory',4,3,1,1,0,88,90,89),('System Utility',4,4,1,1,0,89,90,88);

INSERT INTO ai_agent_domains(organization_id,domain_name,registered_agents,active_agents,draft_agents,invalid_agents,deprecated_agents,average_health,workflow_coverage,final_output_contribution,last_updated)
SELECT @org, domain, total, active, draft, invalid, deprecated, health, coverage, output, SYSUTCDATETIME() FROM @domains;

INSERT INTO ai_capabilities(capability_code,capability_name,domain,description,input_contract,output_contract,required_tools,supported_models,quality_rules,security_classification,version,status)
SELECT CONCAT('CAP-', RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY domain) AS NVARCHAR(3)),3)), CONCAT(domain,' Capability'), domain, CONCAT('Autonomous ',domain,' capability contract.'), 'typed JSON input', 'versioned JSON output', 'search, database, workflow tools', 'gpt-5 and fallback models', 'confidence, validation, brand safety', 'internal', 1, 'Active'
FROM @domains;

INSERT INTO ai_agents(organization_id,code,name,domain,description,current_version,published_version,status,validation_status,health_percent,scope_type,preferred_provider_id,preferred_model_id,fallback_provider_id,fallback_model_id,memory_enabled,rag_enabled,queue_id,final_output_linked,owner,environment,tags,updated_at)
SELECT @org, CONCAT('AG-', RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY domain) AS NVARCHAR(3)),3)), CONCAT(domain,' Agent'), domain, CONCAT('Authoritative autonomous ',domain,' agent registry entry.'), 3, 3,
CASE WHEN invalid>0 THEN 'Invalid' WHEN draft>0 THEN 'Draft' WHEN deprecated>0 THEN 'Deprecated' ELSE 'Active' END,
CASE WHEN invalid>0 THEN 'Invalid' WHEN draft>0 THEN 'Warning' ELSE 'Valid' END,
health,
CASE WHEN ROW_NUMBER() OVER (ORDER BY domain) <= 14 THEN 'System' ELSE 'Organization' END,
@provider,@model,@provider,@model,1,1,@queue,CASE WHEN output>=90 THEN 1 ELSE 0 END,'Agent Governance Engine','production',domain,SYSUTCDATETIME()
FROM @domains;

INSERT INTO ai_agent_versions(agent_id,version,manifest_json,output_schema_json,validation_rules_json,status)
SELECT id,current_version,'{"registry":"authoritative","governed":true}','{"type":"object","required":["result","confidence"]}','{"confidence":90,"tenantIsolation":true}',CASE WHEN status='Draft' THEN 'draft' ELSE 'active' END FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_scopes(agent_id,scope_value,tenant_isolated) SELECT id, scope_type, 1 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_capabilities(agent_id,capability,input_type,output_type) SELECT a.id, c.capability_name, 'structured content context', 'validated business output' FROM ai_agents a JOIN ai_capabilities c ON c.domain=a.domain WHERE a.code LIKE 'AG-%';
INSERT INTO ai_agent_input_schemas(agent_id,input_schema,required_fields,optional_fields,validation_rules,sensitive_inputs,sample_input) SELECT id,'{"type":"object"}','objective, context','brand, channel','schema and policy validation','tenant data','{"objective":"produce governed output"}' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_output_schemas(agent_id,output_schema,required_outputs,validation_rules,confidence_requirement,storage_destination,retention_policy,sample_output) SELECT id,'{"type":"object"}','result, confidence','quality gates and output schema',90,'content output store','versioned retention','{"result":"validated output"}' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_provider_mappings(agent_id,capability,primary_provider,primary_model,secondary_provider,fallback_model,routing_policy,quality_score,latency_ms,cost,context_capacity,health_percent,data_residency_compliance) SELECT id,domain,'OpenAI','gpt-5','Local Structured','local-structured-v1','quality, cost, latency, health, region',health_percent,1400,1.24,128000,health_percent,'tenant safe' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_model_mappings(agent_id,model_code,model_role,capability,status) SELECT id,'gpt-5','primary',domain,'Active' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_prompt_mappings(agent_id,prompt_code,prompt_version,system_prompt,user_prompt_template,variables,output_format,approval_status,test_status,fallback_prompt) SELECT id,CONCAT('PROMPT-',code),current_version,'Operate autonomously inside CACSMS guardrails.','Use {{context}} to produce {{output}}.','context, output','JSON','Approved','Passed','standard fallback prompt' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_tool_mappings(agent_id,tool_code,tool_category,access_status,permission_code,rate_limit,cost_limit,audit_policy,failure_behavior) SELECT id,'workflow.database.read','database','Required','ai_agent_registry.view','100/min',3.00,'always','retry then fallback' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_memory_policies(agent_id,working_memory,episodic_memory,semantic_memory,brand_memory,audience_memory,retention,provenance,tenant_isolation,health_percent) SELECT id,1,1,1,1,1,'90 days','required','strict',health_percent FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_rag_policies(agent_id,retrieval_sources,embedding_model,reranker,context_limit,relevance_score,provenance_coverage,tenant_isolation,stale_memory,health_percent) SELECT id,'brand memory, topic library, workflow outputs','text-embedding-3-large','cross-encoder',64000,92,96,'strict',0,health_percent FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_queue_mappings(agent_id,queue_name,timeout_seconds,retry_count,checkpointing,priority,idempotency,scheduling_support) SELECT id,'ai-agent-registry',timeout_seconds,max_retries,1,'high',1,1 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_worker_mappings(agent_id,worker_pool,concurrency,utilization,health_percent) SELECT id,CONCAT(domain,' Workers'),concurrency_limit,62,health_percent FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_workflow_mappings(agent_id,workflow_definition,workflow_version,stage_name,execution_order,mapping_status,input_mapping,output_mapping,fallback_agent,approval_requirement,final_output_gap) SELECT id,'Content Lifecycle Workflow',3,domain,1,CASE WHEN status='Invalid' THEN 'Invalid' ELSE 'Primary' END,'context -> agent','agent -> workflow output','Recovery Agent','policy based',CASE WHEN final_output_linked=1 THEN 0 ELSE 1 END FROM ai_agents WHERE code LIKE 'AG-%' AND status <> 'Draft';
INSERT INTO ai_agent_recovery_mappings(agent_id,recovery_policy,provider_fallback,model_fallback,prompt_fallback,tool_fallback,worker_reassignment,queue_reassignment,context_rebuild,output_regeneration,incident_threshold) SELECT id,'standard agent recovery',1,1,1,1,1,1,1,1,3 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_quality_gates(agent_id,minimum_confidence,quality_gates,fact_check_required,citation_required,brand_compliance_required,copyright_required,platform_policy_required,approval_required,human_escalation_boundary) SELECT id,90,'confidence, schema, safety, final-output',CASE WHEN domain IN ('Research','Fact Checking','Citation Verification') THEN 1 ELSE 0 END,CASE WHEN domain IN ('Research','Citation Verification') THEN 1 ELSE 0 END,1,1,1,CASE WHEN domain='Compliance' THEN 1 ELSE 0 END,'exception only' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_permissions(agent_id,permission_code,required) SELECT id,'ai_agent_registry.view_details',1 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_validations(agent_id,validation_status,validation_score,error_count,warning_count,auto_fix_available) SELECT id,validation_status,health_percent,CASE WHEN validation_status='Invalid' THEN 1 ELSE 0 END,CASE WHEN validation_status='Warning' THEN 2 ELSE 0 END,1 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_validation_results(validation_id,result_type,affected_area,message,suggested_fix,auto_fix_available) SELECT v.id,CASE WHEN v.validation_status='Invalid' THEN 'error' WHEN v.validation_status='Warning' THEN 'warning' ELSE 'passed' END,'registry validation','Agent checked for identity, schemas, providers, prompts, tools, memory, workflow mapping, recovery, governance, and final-output linkage.','Apply safe metadata repair or route through governance.',1 FROM ai_agent_validations v JOIN ai_agents a ON a.id=v.agent_id WHERE a.code LIKE 'AG-%';
INSERT INTO ai_agent_tests(agent_id,test_name,test_status,estimated_cost,estimated_duration_ms,final_output_contribution) SELECT id,'Safe registry validation test',CASE WHEN status='Invalid' THEN 'failed' ELSE 'passed' END,0.12,45000,CASE WHEN final_output_linked=1 THEN 94 ELSE 72 END FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_test_results(test_id,result_status,confidence,output_valid,message) SELECT t.id,t.test_status,CASE WHEN t.test_status='passed' THEN 94 ELSE 72 END,CASE WHEN t.test_status='passed' THEN 1 ELSE 0 END,'Registry-safe test result recorded.' FROM ai_agent_tests t JOIN ai_agents a ON a.id=t.agent_id WHERE a.code LIKE 'AG-%';
INSERT INTO ai_agent_final_output_links(agent_id,capability,workflow_stage,output_name,validation_status,approval_link,publishing_link,analytics_link,learning_link,business_result,readiness) SELECT id,domain,domain,'Final business result','validated','linked','linked','linked','linked','CACSMS content outcome',CASE WHEN final_output_linked=1 THEN 96 ELSE 70 END FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_dependencies(agent_id,dependency_type,dependency_name,impact,status) SELECT id,'workflow','Content Lifecycle Workflow','final-output path','healthy' FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_change_history(agent_id,change_type,actor,old_configuration,new_configuration,affected_workflows,affected_outputs,security_impact,cost_impact,final_output_impact,rollback_available) SELECT id,'seeded','system','{}','registry entry seeded','Content Lifecycle Workflow','Final business result','none','neutral','protected',1 FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_documentation(agent_id,title,summary) SELECT id,CONCAT(name,' documentation'),CONCAT(name,' registry documentation generated by autonomous registry maintenance.') FROM ai_agents WHERE code LIKE 'AG-%';
INSERT INTO ai_agent_governance_approvals(agent_id,approval_reason,required_for,status) SELECT id,'Production-impacting registry change requires governance.','tool/provider/prompt/recovery expansion','pending' FROM ai_agents WHERE code LIKE 'AG-%' AND status IN ('Invalid','Draft');

INSERT INTO ai_agent_registry_health(organization_id,service_name,service_state,health_percent,blocker,auto_fix_available) VALUES
(@org,'Registry service','Healthy',98,NULL,1),(@org,'Agent schema validator','Healthy',97,NULL,1),(@org,'Capability validator','Healthy',96,NULL,1),(@org,'Tool permission validator','Warning',91,'two excessive access warnings',1),(@org,'Provider/model validator','Healthy',96,NULL,1),(@org,'Prompt validator','Warning',92,'five prompt versions outdated',1),(@org,'Workflow-mapping validator','Healthy',95,NULL,1),(@org,'Memory-policy validator','Healthy',96,NULL,1),(@org,'Queue/worker validator','Healthy',97,NULL,1),(@org,'Version validator','Warning',90,'version drift',1),(@org,'Duplicate detector','Warning',89,'overlap candidates',0),(@org,'Final-output linkage validator','Healthy',94,NULL,1),(@org,'Audit pipeline','Healthy',99,NULL,1),(@org,'Autonomous correction engine','Healthy',96,NULL,1);
INSERT INTO ai_agent_overlap_analysis(organization_id,agents_involved,similarity_score,overlap_area,cost_impact,maintenance_impact,performance_comparison,recommended_action,merge_eligibility,deprecation_eligibility,status) VALUES
(@org,'Creative Agent, Image Generation Agent',84,'visual generation responsibilities',16.50,'medium','Image Generation has lower health','consolidate prompt templates and clarify stage ownership',1,0,'open'),
(@org,'Analytics Agent, Learning Agent',78,'performance insight generation',8.20,'low','Analytics faster, Learning higher final-output loop value','split analytics collection from learning feedback',0,0,'open'),
(@org,'Monitoring Agent, System Utility Agent',72,'system checks',5.10,'low','Monitoring more reliable','deprecate duplicate utility checks',0,1,'open');
INSERT INTO ai_agent_registry_recommendations(organization_id,agent_id,problem,recommendation,expected_health_improvement,expected_cost_impact,confidence,risk,auto_apply_eligible,applied_status)
SELECT @org,id,CASE WHEN status='Invalid' THEN 'invalid registry dependency' WHEN status='Draft' THEN 'draft missing governance publication' ELSE 'safe documentation drift' END,CASE WHEN status='Invalid' THEN 'route through governance and repair missing mapping' WHEN status='Draft' THEN 'run validation and create version' ELSE 'refresh documentation and validation timestamp' END,CASE WHEN status='Invalid' THEN 12 ELSE 4 END,CASE WHEN status='Invalid' THEN 3 ELSE 0 END,88,CASE WHEN status='Invalid' THEN 'medium' ELSE 'low' END,CASE WHEN status='Active' THEN 1 ELSE 0 END,CASE WHEN status='Active' THEN 'applied metadata refresh' ELSE 'governed recommendation' END FROM ai_agents WHERE code LIKE 'AG-%';
