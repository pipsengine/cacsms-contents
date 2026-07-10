SET NOCOUNT ON;

IF OBJECT_ID('workflow_templates', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('workflow_templates.view','View workflow templates'),('workflow_templates.create','Create workflow templates'),('workflow_templates.edit','Edit workflow templates'),
  ('workflow_templates.validate','Validate workflow templates'),('workflow_templates.simulate','Simulate workflow templates'),('workflow_templates.instantiate','Instantiate workflow templates'),
  ('workflow_templates.publish','Publish workflow templates'),('workflow_templates.rollback','Roll back workflow templates'),('workflow_templates.duplicate','Duplicate workflow templates'),
  ('workflow_templates.deprecate','Deprecate workflow templates'),('workflow_templates.archive','Archive workflow templates'),('workflow_templates.compare','Compare workflow templates'),
  ('workflow_templates.apply_recommendations','Apply workflow template recommendations'),('workflow_templates.generate_ai','Generate templates with AI'),('workflow_templates.generate_documentation','Generate template documentation'),
  ('workflow_templates.export','Export workflow template library'),('workflow_templates.manage_governance','Manage workflow template governance')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_templates.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-templates' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
(@org,'TEMPLATE_VALIDATION','Template Validation','workflow_templates'),(@org,'TEMPLATE_SIMULATION','Template Simulation','workflow_templates'),(@org,'TEMPLATE_INSTANTIATION','Template Instantiation','workflow_templates'),
(@org,'TEMPLATE_VERSION_PUBLISH','Template Version Publish','workflow_templates'),(@org,'TEMPLATE_DEPRECATION','Template Deprecation','workflow_templates'),(@org,'TEMPLATE_OPTIMIZATION','Template Optimization','workflow_templates')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @instDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='TEMPLATE_INSTANTIATION');
MERGE workflow_stages AS target
USING (VALUES
(@org,@instDef,'template_selected','Template Selected',1),(@org,@instDef,'template_version_validated','Template Version Validated',2),(@org,@instDef,'organization_context_loaded','Organization Context Loaded',3),(@org,@instDef,'variables_resolved','Variables Resolved',4),
(@org,@instDef,'dependencies_validated','Dependencies Validated',5),(@org,@instDef,'permissions_validated','Permissions Validated',6),(@org,@instDef,'agent_mappings_resolved','Agent Mappings Resolved',7),(@org,@instDef,'queue_worker_policies_applied','Queue and Worker Policies Applied',8),
(@org,@instDef,'recovery_policies_applied','Recovery Policies Applied',9),(@org,@instDef,'output_linkage_validated','Output Linkage Validated',10),(@org,@instDef,'workflow_definition_created','Workflow Definition Created',11),(@org,@instDef,'workflow_version_created','Workflow Version Created',12),
(@org,@instDef,'simulation_executed','Simulation Executed',13),(@org,@instDef,'definition_saved','Definition Saved',14),(@org,@instDef,'activation_completed','Activation Completed',15),(@org,@instDef,'audit_metrics_recorded','Audit and Metrics Recorded',16)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id=source.workflow_definition_id AND target.stage_code=source.stage_code
WHEN MATCHED THEN UPDATE SET name=source.name, sequence_no=source.sequence_no, display_order=source.sequence_no, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'template', 'sequential', 6.25, 'workflow_templates.instantiate', 'active');

DECLARE @categories TABLE(name NVARCHAR(180));
INSERT INTO @categories VALUES ('System Startup'),('System Shutdown'),('Implementation Validation'),('Content Research'),('Content Strategy'),('Long-Form YouTube'),('Short-Form Video'),('Blog Article'),('Newsletter'),('Podcast'),('Social Media Campaign'),('Thumbnail Generation'),('Image Generation'),('Voice Production'),('Video Production'),('Content Approval'),('Cross-Platform Publishing'),('Analytics Collection'),('Learning Feedback'),('Incident Response'),('Worker Recovery'),('Queue Recovery'),('Database Backup'),('Report Generation'),('Notification Automation'),('Integration Sync'),('Security Response'),('Maintenance');
MERGE workflow_template_categories AS target
USING (SELECT @org AS organization_id, name AS category_name FROM @categories) AS source
ON target.organization_id=source.organization_id AND target.category_name=source.category_name
WHEN NOT MATCHED THEN INSERT (organization_id, category_name, description) VALUES (source.organization_id, source.category_name, CONCAT('Reusable autonomous templates for ', source.category_name));

DECLARE @templates TABLE(code NVARCHAR(120), name NVARCHAR(220), category NVARCHAR(180), status NVARCHAR(80), validation NVARCHAR(80), complexity NVARCHAR(80), duration INT, cost DECIMAL(18,4), stages INT, agents INT, usageCount INT, success DECIMAL(8,2), recovery DECIMAL(8,2), finalReady DECIMAL(8,2), recommended BIT, description NVARCHAR(1000));
INSERT INTO @templates VALUES
('TPL-LFY-001','Long-Form YouTube Content Lifecycle','Long-Form YouTube','Production Ready','Valid','high',780000,18.5000,20,8,142,97.4,98.0,96.0,1,'Research, script, voice, video, thumbnail, approval, publishing, analytics, and learning.'),
('TPL-SFV-001','Short-Form Video Campaign','Short-Form Video','Approved','Valid','medium',360000,7.2500,14,5,96,96.8,97.0,94.0,1,'Autonomous short-form video workflow for TikTok, Reels, Shorts, and paid social.'),
('TPL-BLOG-001','SEO Blog Article Production','Blog Article','Production Ready','Valid','medium',300000,4.6000,12,4,74,98.1,95.0,97.0,0,'Keyword research, outline, writing, fact checking, approval, publication, analytics, learning.'),
('TPL-PUB-001','Cross-Platform Publishing','Cross-Platform Publishing','Approved','Warning','medium',180000,2.9000,10,2,188,94.2,91.0,88.0,0,'Publish approved content across configured destinations with analytics linkage.'),
('TPL-IR-001','Incident Response Recovery','Incident Response','Production Ready','Valid','high',240000,1.2000,11,1,38,99.0,100.0,92.0,0,'Detect, diagnose, recover, notify, and learn from workflow incidents.'),
('TPL-DB-001','Database Backup and Validation','Database Backup','Approved','Valid','low',120000,0.7000,8,0,64,99.5,100.0,90.0,0,'Database backup, validation, retention, and restoration-readiness checks.'),
('TPL-NEWS-001','Newsletter Production','Newsletter','Draft','Warning','medium',260000,3.8000,11,3,21,91.0,82.0,80.0,0,'Newsletter content generation with approval and distribution planning.'),
('TPL-IMG-001','Image Generation and Approval','Image Generation','Deprecated','Invalid','medium',210000,5.4000,9,3,42,84.0,65.0,62.0,0,'Legacy image generation workflow requiring model update.'),
('TPL-AN-001','Analytics Collection Loop','Analytics Collection','Production Ready','Valid','low',90000,0.3000,7,0,120,99.1,96.0,98.0,0,'Collect, normalize, store, and link analytics to final output.'),
('TPL-LRN-001','Learning Feedback Loop','Learning Feedback','Production Ready','Valid','low',95000,0.3500,7,1,118,98.9,96.0,98.0,0,'Record workflow outcomes and update routing, prompts, and policies.');

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @category NVARCHAR(180), @status NVARCHAR(80), @validation NVARCHAR(80), @complexity NVARCHAR(80), @duration INT, @cost DECIMAL(18,4), @stages INT, @agents INT, @usageCount INT, @success DECIMAL(8,2), @recovery DECIMAL(8,2), @finalReady DECIMAL(8,2), @recommended BIT, @description NVARCHAR(1000);
DECLARE template_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @templates;
OPEN template_cursor;
FETCH NEXT FROM template_cursor INTO @code,@name,@category,@status,@validation,@complexity,@duration,@cost,@stages,@agents,@usageCount,@success,@recovery,@finalReady,@recommended,@description;
WHILE @@FETCH_STATUS=0
BEGIN
  DECLARE @catId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_template_categories WHERE organization_id=@org AND category_name=@category);
  DECLARE @template UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_templates WHERE template_code=@code);
  IF @template IS NULL
  BEGIN
    SET @template = NEWID();
    INSERT INTO workflow_templates(id,organization_id,template_code,template_name,description,category,category_id,status,validation_status,scope,current_version,published_version,complexity,estimated_duration_ms,estimated_cost,stage_count,ai_agent_count,approval_required,approval_configured,recovery_enabled,publishing_configured,analytics_configured,learning_configured,final_output_ready,recommended,usage_count,success_rate,recovery_coverage,final_output_readiness,owner_id,owner_name,organization_scope,updated_at)
    VALUES (@template,@org,@code,@name,@description,@category,@catId,@status,@validation,'system',3,CASE WHEN @status IN ('Production Ready','Approved') THEN 3 ELSE NULL END,@complexity,@duration,@cost,@stages,@agents,1,CASE WHEN @validation='Invalid' THEN 0 ELSE 1 END,CASE WHEN @recovery > 80 THEN 1 ELSE 0 END,CASE WHEN @finalReady > 75 THEN 1 ELSE 0 END,1,1,CASE WHEN @finalReady > 80 THEN 1 ELSE 0 END,@recommended,@usageCount,@success,@recovery,@finalReady,'system','Autonomous Template Engine','AI Media Group',DATEADD(day,-@usageCount % 28,SYSUTCDATETIME()));
    INSERT INTO workflow_template_versions(workflow_template_id,template_id,version_number,status,template_json,created_by,change_summary,validation_status,approval_status,published_environments,instantiation_count,success_rate,rollback_eligible) VALUES (@template,@template,3,@status,'{"autonomousDefaults":true,"redacted":true}','system','Autonomous template library seed',@validation,CASE WHEN @status IN ('Approved','Production Ready') THEN 'approved' ELSE 'pending' END,'production,staging',@usageCount,@success,1);
    INSERT INTO workflow_template_stages(workflow_template_id,stage_code,stage_name,stage_type,sequence_no,required_agent,output_schema) VALUES (@template,'TRIGGER','Trigger','trigger',1,NULL,'trigger-input'),(@template,'RESEARCH','Research','agent',2,CASE WHEN @agents>0 THEN 'RESEARCH_AGENT' ELSE NULL END,'research-output'),(@template,'APPROVAL','Approval','approval',3,NULL,'approval-output'),(@template,'PUBLISHING','Publishing','publishing',4,NULL,'publishing-output'),(@template,'ANALYTICS','Analytics','analytics',5,NULL,'analytics-output'),(@template,'LEARNING','Learning','learning',6,NULL,'learning-output');
    INSERT INTO workflow_template_transitions(workflow_template_id,source_stage,target_stage,condition_expression,guardrail) VALUES (@template,'TRIGGER','RESEARCH','payload.valid=true','input validated'),(@template,'RESEARCH','APPROVAL','quality_score >= 0.82','quality gate'),(@template,'APPROVAL','PUBLISHING','approval=approved','governance'),(@template,'PUBLISHING','ANALYTICS','published=true','final-output linked'),(@template,'ANALYTICS','LEARNING','analytics_collected=true','learning linked');
    INSERT INTO workflow_template_triggers(workflow_template_id,trigger_code,trigger_type,default_payload) VALUES (@template,CONCAT(@code,'-TRIGGER'),'scheduled','{"autonomousDefaults":true}');
    INSERT INTO workflow_template_actions(workflow_template_id,action_code,action_type,tool_permission) VALUES (@template,'PUBLISH_CONTENT','publishing','workflow_actions.execute'),(@template,'COLLECT_ANALYTICS','analytics','workflow_actions.execute');
    INSERT INTO workflow_template_variables(workflow_template_id,variable_name,variable_type,required,default_value,autonomous_default_available) VALUES (@template,'brand','string',1,'AI Media Group',1),(@template,'language','string',1,'en-NG',1),(@template,'budget','decimal',0,'safe-default',1);
    INSERT INTO workflow_template_input_schemas(workflow_template_id,schema_name,schema_json) VALUES (@template,'default-input','{"redacted":true,"autonomousDefaults":true}');
    INSERT INTO workflow_template_output_schemas(workflow_template_id,schema_name,schema_json,final_output) VALUES (@template,'final-output','{"finalBusinessResult":true}',1);
    INSERT INTO workflow_template_agent_mappings(workflow_template_id,agent_code,provider,model,prompt_version,outdated) VALUES (@template,'RESEARCH_AGENT','openai','gpt-5','prompt-v12',0),(@template,'SCRIPT_WRITER','openai','gpt-5','prompt-v18',CASE WHEN @validation='Invalid' THEN 1 ELSE 0 END);
    INSERT INTO workflow_template_prompt_mappings(workflow_template_id,prompt_code,prompt_version) VALUES (@template,'CONTENT_STRATEGY','v9');
    INSERT INTO workflow_template_approval_policies(workflow_template_id,policy_name,auto_approval_rules,quality_gates,compliance_gates,escalation) VALUES (@template,'Autonomous Quality Approval','score>=0.9','quality,brand,compliance','policy,legal','incident on guardrail breach');
    INSERT INTO workflow_template_recovery_policies(workflow_template_id,policy_name,checkpoint_enabled,compensation_enabled,provider_fallback,model_fallback,worker_reassignment,dead_letter_handling,incident_creation) VALUES (@template,'Autonomous Standard Recovery',1,1,1,1,1,1,1);
    INSERT INTO workflow_template_quality_gates(workflow_template_id,gate_name,threshold_percent,stage_code) VALUES (@template,'Final Output Readiness',@finalReady,'PUBLISHING');
    INSERT INTO workflow_template_dependencies(workflow_template_id,dependency_type,dependency_name,dependency_version,status,impact,shared_component) VALUES (@template,'queue','workflow-templates','v1','valid','low',1),(@template,'agent','SCRIPT_WRITER','v5',CASE WHEN @validation='Invalid' THEN 'deprecated' ELSE 'valid' END,CASE WHEN @validation='Invalid' THEN 'high' ELSE 'low' END,1),(@template,'provider','openai','current','valid','low',1);
    INSERT INTO workflow_template_instantiations(workflow_template_id,organization_id,brand,environment,objective,status,estimated_cost,estimated_duration_ms,validation_result,final_output_readiness) VALUES (@template,@org,'CACSMS Contents','production','Autonomous workflow definition from template','completed',@cost,@duration,@validation,@finalReady);
    INSERT INTO workflow_template_validation_runs(workflow_template_id,status,validation_score,error_count,warning_count,recommendation_count,auto_fix_available) VALUES (@template,CASE WHEN @validation='Invalid' THEN 'failed' ELSE 'completed' END,CASE WHEN @validation='Valid' THEN 96 WHEN @validation='Warning' THEN 82 ELSE 55 END,CASE WHEN @validation='Invalid' THEN 2 ELSE 0 END,CASE WHEN @validation='Warning' THEN 2 ELSE 0 END,2,CASE WHEN @validation='Valid' THEN 0 ELSE 1 END);
    DECLARE @run UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_template_validation_runs WHERE workflow_template_id=@template ORDER BY created_at DESC);
    INSERT INTO workflow_template_validation_results(workflow_template_validation_run_id,result_type,area,affected_stage,message,suggested_fix,auto_fix_available) VALUES (@run,CASE WHEN @validation='Invalid' THEN 'error' WHEN @validation='Warning' THEN 'warning' ELSE 'recommendation' END,'Business','PUBLISHING',CASE WHEN @validation='Invalid' THEN 'Publishing path uses deprecated model dependency.' ELSE 'Template passes autonomous validation with optimization recommendations.' END,'Apply current model and regenerate draft version',CASE WHEN @validation='Valid' THEN 0 ELSE 1 END);
    INSERT INTO workflow_template_simulation_runs(workflow_template_id,organization_id,brand,status,estimated_duration_ms,estimated_cost,final_output_readiness,risk_summary) VALUES (@template,@org,'AI Media Group','completed',@duration,@cost,@finalReady,CASE WHEN @validation='Invalid' THEN 'dependency risk' ELSE 'inside autonomous guardrails' END);
    INSERT INTO workflow_template_performance(workflow_template_id,instantiations,success_rate,failure_rate,recovery_rate,average_duration_ms,average_cost,approval_delay_ms,publishing_completion,analytics_completion,learning_completion,final_output_rate) VALUES (@template,@usageCount,@success,100-@success,@recovery,@duration,@cost,12000,@finalReady,CASE WHEN @finalReady > 80 THEN 96 ELSE 70 END,CASE WHEN @finalReady > 80 THEN 95 ELSE 68 END,@finalReady);
    INSERT INTO workflow_template_recommendations(workflow_template_id,recommendation_type,title,recommendation,match_score,estimated_success_rate,estimated_duration_ms,estimated_cost,required_configuration,risk,inside_guardrails,status) VALUES (@template,'optimization','Improve template reliability','Add checkpoint and update prompt/model mapping where needed',CASE WHEN @recommended=1 THEN 98 ELSE 82 END,@success,@duration,@cost,'Autonomous defaults available',CASE WHEN @validation='Invalid' THEN 'medium' ELSE 'low' END,1,'open');
    INSERT INTO workflow_template_change_history(workflow_template_id,change_type,change_summary,audit_reference) VALUES (@template,'seeded','Template library seeded from autonomous blueprint specification','AUD-TPL-001');
    INSERT INTO workflow_template_documentation(workflow_template_id,doc_type,title,content_summary) VALUES (@template,'overview',CONCAT(@name,' Documentation'),'Autogenerated documentation summary available for autonomous workflow template.');
    INSERT INTO workflow_template_tags(workflow_template_id,tag) VALUES (@template,LOWER(REPLACE(@category,' ','-'))),(@template,'autonomous');
    INSERT INTO workflow_template_final_output_links(workflow_template_id,trigger_linked,stages_linked,agents_linked,outputs_linked,approval_linked,publishing_linked,analytics_linked,learning_linked,business_result_linked,readiness_percent,risk) VALUES (@template,1,1,CASE WHEN @agents>0 THEN 1 ELSE 1 END,1,CASE WHEN @finalReady>70 THEN 1 ELSE 0 END,CASE WHEN @finalReady>75 THEN 1 ELSE 0 END,1,1,CASE WHEN @finalReady>80 THEN 1 ELSE 0 END,@finalReady,CASE WHEN @finalReady>90 THEN 'low' WHEN @finalReady>75 THEN 'medium' ELSE 'high' END);
  END
  FETCH NEXT FROM template_cursor INTO @code,@name,@category,@status,@validation,@complexity,@duration,@cost,@stages,@agents,@usageCount,@success,@recovery,@finalReady,@recommended,@description;
END
CLOSE template_cursor;
DEALLOCATE template_cursor;
END;
