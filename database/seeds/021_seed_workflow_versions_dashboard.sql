SET NOCOUNT ON;

IF OBJECT_ID('workflow_definition_versions', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
('workflow_versions.view','View workflow versions'),('workflow_versions.create','Create workflow versions'),('workflow_versions.edit','Edit workflow versions'),('workflow_versions.validate','Validate workflow versions'),('workflow_versions.simulate','Simulate workflow versions'),('workflow_versions.compare','Compare workflow versions'),('workflow_versions.release','Release workflow versions'),('workflow_versions.start_canary','Start workflow-version canary'),('workflow_versions.manage_rollout','Manage workflow-version rollouts'),('workflow_versions.pause_rollout','Pause workflow-version rollout'),('workflow_versions.resume_rollout','Resume workflow-version rollout'),('workflow_versions.rollback','Rollback workflow versions'),('workflow_versions.migrate_instances','Migrate active workflow instances'),('workflow_versions.correct_drift','Correct workflow-version drift'),('workflow_versions.archive','Archive workflow versions'),('workflow_versions.generate_release_notes','Generate workflow-version release notes'),('workflow_versions.generate_documentation','Generate workflow-version documentation'),('workflow_versions.export','Export workflow-version report'),('workflow_versions.manage_governance','Manage workflow-version governance'),('workflow_versions.emergency_override','Use workflow-version emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'workflow_versions.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'workflow-version-management' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=99, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',99);

MERGE workflow_definitions AS target
USING (VALUES
(@org,'WORKFLOW_VERSION_VALIDATION','Workflow Version Validation','workflow_versions'),(@org,'WORKFLOW_VERSION_COMPATIBILITY_CHECK','Workflow Version Compatibility Check','workflow_versions'),(@org,'WORKFLOW_VERSION_RELEASE','Workflow Version Release','workflow_versions'),(@org,'WORKFLOW_VERSION_CANARY_ROLLOUT','Workflow Version Canary Rollout','workflow_versions'),(@org,'WORKFLOW_VERSION_PROGRESSIVE_ROLLOUT','Workflow Version Progressive Rollout','workflow_versions'),(@org,'WORKFLOW_VERSION_AUTOMATIC_ROLLBACK','Workflow Version Automatic Rollback','workflow_versions'),(@org,'WORKFLOW_VERSION_INSTANCE_MIGRATION','Workflow Version Instance Migration','workflow_versions'),(@org,'WORKFLOW_VERSION_DRIFT_CORRECTION','Workflow Version Drift Correction','workflow_versions')
) AS source(organization_id,code,name,workflow_type)
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DECLARE @releaseDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='WORKFLOW_VERSION_RELEASE');
MERGE workflow_stages AS target
USING (VALUES
(@org,@releaseDef,'version_selected','Version Selected',1),(@org,@releaseDef,'validation_verified','Validation Verified',2),(@org,@releaseDef,'compatibility_verified','Compatibility Verified',3),(@org,@releaseDef,'dependencies_verified','Dependencies Verified',4),(@org,@releaseDef,'final_output_verified','Final Output Verified',5),(@org,@releaseDef,'release_risk_calculated','Release Risk Calculated',6),(@org,@releaseDef,'rollout_strategy_selected','Rollout Strategy Selected',7),(@org,@releaseDef,'release_plan_created','Release Plan Created',8),(@org,@releaseDef,'canary_deployed','Canary Deployed',9),(@org,@releaseDef,'canary_health_evaluated','Canary Health Evaluated',10),(@org,@releaseDef,'rollout_expanded','Rollout Expanded',11),(@org,@releaseDef,'production_health_evaluated','Production Health Evaluated',12),(@org,@releaseDef,'version_activated','Version Activated',13),(@org,@releaseDef,'previous_version_superseded','Previous Version Superseded',14),(@org,@releaseDef,'documentation_updated','Documentation Updated',15),(@org,@releaseDef,'audit_metrics_recorded','Audit and Metrics Recorded',16)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id=source.workflow_definition_id AND target.stage_code=source.stage_code
WHEN MATCHED THEN UPDATE SET name=source.name, sequence_no=source.sequence_no, display_order=source.sequence_no, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,workflow_definition_id,stage_code,name,display_order,sequence_no,stage_type,execution_mode,weight_percent,required_permission,status)
VALUES (source.organization_id,source.workflow_definition_id,source.stage_code,source.name,source.sequence_no,source.sequence_no,'release','sequential',6.25,'workflow_versions.release','active');

DECLARE @rows TABLE(code NVARCHAR(120), name NVARCHAR(220), version INT, status NVARCHAR(80), validation NVARCHAR(80), compat NVARCHAR(80), release NVARCHAR(80), env NVARCHAR(80), strategy NVARCHAR(120), rollout DECIMAL(8,2), health DECIMAL(8,2), success DECIMAL(8,2), fail DECIMAL(8,2), duration INT, cost DECIMAL(18,4), instances INT, deps INT, agents INT, models INT, prompts INT, perms INT, outputs INT, finalCompat DECIMAL(8,2), owner NVARCHAR(180));
INSERT INTO @rows VALUES
('CONTENT_LIFECYCLE','Content Lifecycle Workflow',5,'Active','Passed','Fully Compatible','Completed','production','Progressive',100,98.6,97.4,2.6,522000,14.80,86,1,2,1,3,0,1,96.4,'Workflow Release Engine'),
('VIDEO_RENDER','Video Rendering Workflow',4,'Canary','Passed','Compatible with Migration','Canary','production','Canary',12,94.2,95.0,5.0,380000,8.40,18,2,0,1,0,0,1,92.1,'Media Platform'),
('PUBLISHING','Publishing Workflow',7,'Rolling Out','Passed','Fully Compatible','Rolling Out','production','Percentage-Based',46,96.1,96.7,3.3,185000,2.70,44,1,0,0,0,1,2,94.8,'Publishing Core'),
('ANALYTICS_COLLECTION','Analytics Collection Workflow',3,'Draft','Not Evaluated','Unknown','Not Started','staging','Scheduled Release',0,88.0,91.2,8.8,90000,0.30,0,0,0,0,0,0,1,87.0,'Analytics Core'),
('AI_RESEARCH','AI Research Workflow',6,'Validating','Running','Unknown','Not Started','staging','Controlled Pilot',0,90.0,93.5,6.5,210000,5.10,0,2,3,2,2,0,1,89.4,'AI Orchestrator'),
('SYSTEM_STARTUP','System Startup Workflow',2,'Published','Passed','Fully Compatible','Completed','production','Immediate',100,99.5,99.2,0.8,64000,0.10,9,0,0,0,0,0,0,98.6,'Platform Core'),
('NEWSLETTER','Newsletter Workflow',2,'Validation Failed','Failed','Warning','Blocked','staging','Controlled Pilot',0,71.0,82.0,18.0,260000,3.80,0,3,1,1,2,1,2,69.0,'Content Automation'),
('IMAGE_GENERATION','Image Generation Workflow',3,'Rollback Pending','Passed','Breaking Change','Paused','production','Blue-Green',25,62.0,78.0,22.0,210000,5.40,12,4,2,2,3,1,3,61.5,'Creative Automation');

MERGE workflow_definitions AS target
USING (SELECT DISTINCT @org AS organization_id, code, name, 'workflow_versioned' AS workflow_type FROM @rows) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=COALESCE(target.workflow_type, source.workflow_type), status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',0);

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @version INT, @status NVARCHAR(80), @validation NVARCHAR(80), @compat NVARCHAR(80), @release NVARCHAR(80), @env NVARCHAR(80), @strategy NVARCHAR(120), @rollout DECIMAL(8,2), @health DECIMAL(8,2), @success DECIMAL(8,2), @fail DECIMAL(8,2), @duration INT, @cost DECIMAL(18,4), @instances INT, @deps INT, @agents INT, @models INT, @prompts INT, @perms INT, @outputs INT, @finalCompat DECIMAL(8,2), @owner NVARCHAR(180);
DECLARE version_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @rows;
OPEN version_cursor;
FETCH NEXT FROM version_cursor INTO @code,@name,@version,@status,@validation,@compat,@release,@env,@strategy,@rollout,@health,@success,@fail,@duration,@cost,@instances,@deps,@agents,@models,@prompts,@perms,@outputs,@finalCompat,@owner;
WHILE @@FETCH_STATUS=0
BEGIN
  DECLARE @def UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code=@code),(SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org ORDER BY created_at));
  DECLARE @ver UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definition_versions WHERE organization_id=@org AND ((workflow_code=@code AND version_number=@version) OR (workflow_definition_id=@def AND version_number=@version)));
  IF @ver IS NOT NULL
  BEGIN
    UPDATE workflow_definition_versions
      SET workflow_definition_id=@def, workflow_code=@code, workflow_name=@name, version_status=@status, environment=@env, validation_status=@validation, compatibility_status=@compat, release_status=@release, rollout_strategy=@strategy, rollout_percent=@rollout, health_percent=@health, success_rate=@success, failure_rate=@fail, average_duration_ms=@duration, average_cost=@cost, active_instances=@instances, dependency_changes=@deps, agent_changes=@agents, model_changes=@models, prompt_changes=@prompts, permission_changes=@perms, output_changes=@outputs, final_output_compatible=@finalCompat, owner=@owner, updated_at=SYSUTCDATETIME()
      WHERE id=@ver;
  END
  IF @ver IS NULL
  BEGIN
    SET @ver = NEWID();
    INSERT INTO workflow_definition_versions(id,organization_id,workflow_definition_id,workflow_code,workflow_name,version_number,version_status,environment,validation_status,compatibility_status,release_status,rollout_strategy,rollout_percent,health_percent,success_rate,failure_rate,average_duration_ms,average_cost,active_instances,dependency_changes,agent_changes,model_changes,prompt_changes,permission_changes,output_changes,final_output_compatible,created_by,owner,release_notes,created_at,published_at,updated_at)
    VALUES(@ver,@org,@def,@code,@name,@version,@status,@env,@validation,@compat,@release,@strategy,@rollout,@health,@success,@fail,@duration,@cost,@instances,@deps,@agents,@models,@prompts,@perms,@outputs,@finalCompat,'system',@owner,CONCAT(@name,' v',@version,' autonomous release notes.'),DATEADD(day,-@version*5,SYSUTCDATETIME()),CASE WHEN @status IN ('Published','Active','Canary','Rolling Out','Rollback Pending') THEN DATEADD(day,-@version,SYSUTCDATETIME()) ELSE NULL END,SYSUTCDATETIME());
    INSERT INTO workflow_version_status_history(workflow_definition_version_id,status,reason) VALUES(@ver,@status,'Seeded release governance state');
    INSERT INTO workflow_version_validations(workflow_definition_version_id,status,structural_status,configuration_status,business_status,security_status,recovery_status,final_output_status,error_count,warning_count,recommendation_count) VALUES(@ver,@validation,'Passed',CASE WHEN @validation='Failed' THEN 'Failed' ELSE 'Passed' END,CASE WHEN @finalCompat<75 THEN 'Warning' ELSE 'Passed' END,'Passed','Passed',CASE WHEN @finalCompat<75 THEN 'Failed' ELSE 'Passed' END,CASE WHEN @validation='Failed' THEN 2 ELSE 0 END,CASE WHEN @compat IN ('Warning','Breaking Change') THEN 3 ELSE 0 END,2);
    DECLARE @val UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_version_validations WHERE workflow_definition_version_id=@ver ORDER BY created_at DESC);
    INSERT INTO workflow_version_validation_results(workflow_version_validation_id,result_type,component,message,suggested_action) VALUES(@val,CASE WHEN @validation='Failed' THEN 'error' ELSE 'recommendation' END,'final-output','Final-output compatibility evaluated for release governance.','Use compatible output schema and rollout guardrails.');
    INSERT INTO workflow_version_simulations(workflow_definition_version_id,status,estimated_duration_ms,estimated_cost,risk_summary,final_output_readiness) VALUES(@ver,CASE WHEN @validation='Failed' THEN 'blocked' ELSE 'completed' END,@duration,@cost,CASE WHEN @compat='Breaking Change' THEN 'breaking change risk' ELSE 'inside guardrails' END,@finalCompat);
    INSERT INTO workflow_version_comparisons(workflow_definition_version_id,area,change_type,risk,suggested_action,breaking_change) VALUES(@ver,'Outputs',CASE WHEN @outputs>0 THEN 'Modified' ELSE 'Unchanged' END,CASE WHEN @compat='Breaking Change' THEN 'high' ELSE 'low' END,'Validate final-output contract before rollout',CASE WHEN @compat='Breaking Change' THEN 1 ELSE 0 END),(@ver,'AI','Modified','medium','Monitor agent/model performance during canary',0);
    INSERT INTO workflow_version_compatibility(workflow_definition_version_id,component,compatibility_status,change_summary,impact,affected_workflows,required_migration,auto_migration_available,rollback_impact) VALUES(@ver,'Final Output',CASE WHEN @finalCompat>=90 THEN 'Fully Compatible' WHEN @finalCompat>=75 THEN 'Compatible with Migration' ELSE 'Breaking Change' END,'Output contract checked','Final business result compatibility',@instances,CASE WHEN @finalCompat<90 THEN 'output schema migration' ELSE 'none' END,CASE WHEN @finalCompat>=75 THEN 1 ELSE 0 END,'previous version available'),(@ver,'Active Instances','Fully Compatible','Checkpoint compatibility preserved','low',@instances,'none',1,'safe');
    INSERT INTO workflow_version_dependencies(workflow_definition_version_id,dependency_type,dependency_name,expected_version,actual_version,status,risk) VALUES(@ver,'queue','workflow-version-management','v1','v1','valid','low'),(@ver,'agent','AI_RELEASE_ANALYZER','v2','v2','valid','low'),(@ver,'model','gpt-5','current','current','valid','low');
    INSERT INTO workflow_version_release_plans(workflow_definition_version_id,strategy,target_environment,initial_percentage,step_percentage,step_duration_minutes,health_threshold,failure_threshold,rollback_threshold,approval_required,status) VALUES(@ver,@strategy,@env,CASE WHEN @strategy='Immediate' THEN 100 ELSE 5 END,20,30,90,8,85,CASE WHEN @compat='Breaking Change' THEN 1 ELSE 0 END,CASE WHEN @release='Blocked' THEN 'blocked' ELSE 'ready' END);
    IF @release IN ('Canary','Rolling Out','Paused','Completed')
    BEGIN
      INSERT INTO workflow_version_rollouts(workflow_definition_version_id,workflow_name,version_number,strategy,environment,status,progress_percent,health_percent,success_rate,failure_rate,active_instances,current_step,next_step,rollback_readiness,eta_minutes) VALUES(@ver,@name,@version,@strategy,@env,CASE WHEN @release='Completed' THEN 'Completed' ELSE @release END,@rollout,@health,@success,@fail,@instances,CASE WHEN @release='Canary' THEN 'Canary health evaluation' ELSE 'Progressive expansion' END,CASE WHEN @rollout>=100 THEN 'Monitor' ELSE 'Expand next cohort' END,'ready',45);
      DECLARE @rolloutId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_version_rollouts WHERE workflow_definition_version_id=@ver ORDER BY created_at DESC);
      INSERT INTO workflow_version_canary_metrics(workflow_version_rollout_id,sample_size,health_score,new_success_rate,current_success_rate,regression_detected,improvement_detected,statistical_confidence,recommended_action,auto_promote_eligible,auto_rollback_eligible) VALUES(@rolloutId,120,@health,@success,@success-0.4,CASE WHEN @health<80 THEN 1 ELSE 0 END,CASE WHEN @health>=95 THEN 1 ELSE 0 END,91,CASE WHEN @health<80 THEN 'rollback' ELSE 'continue rollout' END,CASE WHEN @health>=95 THEN 1 ELSE 0 END,CASE WHEN @health<80 THEN 1 ELSE 0 END);
    END
    INSERT INTO workflow_version_health_metrics(workflow_definition_version_id,success_rate,failure_rate,recovery_rate,average_duration_ms,queue_wait_ms,average_cost,agent_success,output_validation,approval_completion,publishing_success,analytics_completion,learning_completion,final_output_rate,incident_rate) VALUES(@ver,@success,@fail,96,@duration,4200,@cost,95,@finalCompat,97,@finalCompat,96,95,@finalCompat,CASE WHEN @health<80 THEN 2.4 ELSE 0.4 END);
    IF @status='Rollback Pending' INSERT INTO workflow_version_rollbacks(workflow_definition_version_id,trigger_reason,evidence,status,previous_version_verified,instances_stabilized,health_revalidated,incident_or_learning) VALUES(@ver,'health below threshold','final-output rate degraded','in_progress',1,0,0,'INC-VERSION-001');
    INSERT INTO workflow_version_migrations(workflow_definition_version_id,active_instance,current_stage,current_version,target_version,migration_strategy,compatibility,risk,estimated_downtime_seconds,output_impact,migration_status) VALUES(@ver,CONCAT('instance-',@code),'Publishing',@version-1,@version,'Migrate at Checkpoint',CASE WHEN @compat='Breaking Change' THEN 'Warning' ELSE 'Compatible' END,CASE WHEN @compat='Breaking Change' THEN 'high' ELSE 'low' END,0,CASE WHEN @finalCompat<75 THEN 'at risk' ELSE 'none' END,'ready');
    IF @deps>1 INSERT INTO workflow_version_drift(workflow_definition_version_id,workflow_name,environment,expected_version,actual_version,component,drift_type,risk,autonomous_correction,outcome) VALUES(@ver,@name,@env,CONCAT('v',@version),CONCAT('v',@version-1),'worker cache','running worker mismatch','medium','refresh worker definition cache','queued');
    INSERT INTO workflow_version_release_notes(workflow_definition_version_id,title,summary) VALUES(@ver,CONCAT(@name,' v',@version,' release notes'),'Autogenerated release notes with validation, compatibility, rollout, and final-output impact.');
    INSERT INTO workflow_version_documentation(workflow_definition_version_id,doc_type,title,summary) VALUES(@ver,'release',CONCAT(@name,' v',@version,' documentation'),'Version documentation generated from workflow definition and release policy.');
    IF @compat='Breaking Change' INSERT INTO workflow_version_governance_approvals(workflow_definition_version_id,approval_reason,status,required_for) VALUES(@ver,'Breaking change detected','required','production rollout');
    INSERT INTO workflow_version_autonomous_decisions(workflow_definition_version_id,detection,decision,policy,confidence,risk,outcome,human_input_required) VALUES(@ver,'version state evaluated',CASE WHEN @health<80 THEN 'pause and prepare rollback' ELSE 'continue governed rollout' END,'Autonomous Release Guardrails',CASE WHEN @health<80 THEN 82 ELSE 94 END,CASE WHEN @health<80 THEN 'high' ELSE 'low' END,CASE WHEN @health<80 THEN 'rollback guard active' ELSE 'inside guardrails' END,CASE WHEN @compat='Breaking Change' THEN 1 ELSE 0 END);
    INSERT INTO workflow_version_final_output_compatibility(workflow_definition_version_id,inputs_compatible,execution_compatible,outputs_compatible,approval_compatible,publishing_compatible,analytics_compatible,learning_compatible,business_result_compatible,compatibility_percent,blocked_from_release,risk) VALUES(@ver,1,1,CASE WHEN @finalCompat>=75 THEN 1 ELSE 0 END,1,CASE WHEN @finalCompat>=80 THEN 1 ELSE 0 END,1,1,CASE WHEN @finalCompat>=85 THEN 1 ELSE 0 END,@finalCompat,CASE WHEN @finalCompat<75 THEN 1 ELSE 0 END,CASE WHEN @finalCompat<75 THEN 'high' WHEN @finalCompat<90 THEN 'medium' ELSE 'low' END);
    INSERT INTO workflow_version_audit_links(workflow_definition_version_id,audit_reference,event_type) VALUES(@ver,CONCAT('AUD-WV-',@code,'-',@version),'version.release.evaluated');
  END
  FETCH NEXT FROM version_cursor INTO @code,@name,@version,@status,@validation,@compat,@release,@env,@strategy,@rollout,@health,@success,@fail,@duration,@cost,@instances,@deps,@agents,@models,@prompts,@perms,@outputs,@finalCompat,@owner;
END
CLOSE version_cursor;
DEALLOCATE version_cursor;
END;
