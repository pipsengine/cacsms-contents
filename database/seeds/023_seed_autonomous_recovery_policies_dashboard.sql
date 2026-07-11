SET NOCOUNT ON;

IF OBJECT_ID('recovery_policies', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

MERGE permissions AS target
USING (VALUES
('recovery_policies.view','View recovery policies'),('recovery_policies.create','Create recovery policies'),('recovery_policies.edit','Edit recovery policies'),('recovery_policies.validate','Validate recovery policies'),('recovery_policies.simulate','Simulate recovery policies'),('recovery_policies.publish','Publish recovery policies'),('recovery_policies.rollback','Rollback recovery policies'),('recovery_policies.duplicate','Duplicate recovery policies'),('recovery_policies.disable','Disable recovery policies'),('recovery_policies.archive','Archive recovery policies'),('recovery_policies.view_decision_trace','View recovery decision trace'),('recovery_policies.resolve_conflicts','Resolve recovery conflicts'),('recovery_policies.apply_recommendations','Apply recovery recommendations'),('recovery_policies.manage_guardrails','Manage recovery guardrails'),('recovery_policies.manage_compensation','Manage recovery compensation'),('recovery_policies.manage_escalation','Manage recovery escalation'),('recovery_policies.generate_ai','Generate recovery policies with AI'),('recovery_policies.generate_documentation','Generate recovery policy documentation'),('recovery_policies.export','Export recovery policies'),('recovery_policies.manage_governance','Manage recovery governance'),('recovery_policies.emergency_override','Use recovery emergency override')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'recovery_policies.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'recovery-policy-management' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);

MERGE workflow_definitions AS target
USING (VALUES
(@org,'RECOVERY_POLICY_VALIDATION','Recovery Policy Validation','recovery_policy'),(@org,'RECOVERY_POLICY_SIMULATION','Recovery Policy Simulation','recovery_policy'),(@org,'RECOVERY_POLICY_PUBLISH','Recovery Policy Publish','recovery_policy'),(@org,'RECOVERY_POLICY_CONFLICT_RESOLUTION','Recovery Policy Conflict Resolution','recovery_policy'),(@org,'RECOVERY_POLICY_OPTIMIZATION','Recovery Policy Optimization','recovery_policy'),(@org,'RECOVERY_POLICY_GOVERNANCE_APPROVAL','Recovery Policy Governance Approval','recovery_policy'),(@org,'RECOVERY_POLICY_EMERGENCY_ROLLBACK','Recovery Policy Emergency Rollback','recovery_policy')
) AS source(organization_id,code,name,workflow_type)
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DECLARE @simDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='RECOVERY_POLICY_SIMULATION');
MERGE workflow_stages AS target
USING (VALUES
(@org,@simDef,'failure_scenario_loaded','Failure Scenario Loaded',1),(@org,@simDef,'candidate_policies_selected','Candidate Policies Selected',2),(@org,@simDef,'scope_evaluated','Scope Evaluated',3),(@org,@simDef,'evidence_evaluated','Evidence Evaluated',4),(@org,@simDef,'confidence_calculated','Confidence Calculated',5),(@org,@simDef,'risk_calculated','Risk Calculated',6),(@org,@simDef,'cost_calculated','Cost Calculated',7),(@org,@simDef,'guardrails_evaluated','Guardrails Evaluated',8),(@org,@simDef,'primary_strategy_simulated','Primary Strategy Simulated',9),(@org,@simDef,'fallback_strategy_simulated','Fallback Strategy Simulated',10),(@org,@simDef,'compensation_simulated','Compensation Simulated',11),(@org,@simDef,'incident_threshold_evaluated','Incident Threshold Evaluated',12),(@org,@simDef,'final_output_impact_calculated','Final-Output Impact Calculated',13),(@org,@simDef,'simulation_result_generated','Simulation Result Generated',14),(@org,@simDef,'recommendation_recorded','Recommendation Recorded',15),(@org,@simDef,'completed','Completed',16)
) AS source(organization_id,workflow_definition_id,stage_code,name,sequence_no)
ON target.workflow_definition_id=source.workflow_definition_id AND target.stage_code=source.stage_code
WHEN MATCHED THEN UPDATE SET name=source.name, sequence_no=source.sequence_no, display_order=source.sequence_no, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,workflow_definition_id,stage_code,name,display_order,sequence_no,stage_type,execution_mode,weight_percent,required_permission,status)
VALUES (source.organization_id,source.workflow_definition_id,source.stage_code,source.name,source.sequence_no,source.sequence_no,'simulation','sequential',6.25,'recovery_policies.simulate','active');

DELETE FROM recovery_policy_governance_approvals WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_final_output_links WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_documentation WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_change_history WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_recommendations WHERE organization_id=@org;
DELETE FROM recovery_policy_metrics WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_coverage WHERE organization_id=@org;
DELETE FROM recovery_policy_conflicts WHERE organization_id=@org;
DELETE FROM recovery_policy_decisions WHERE organization_id=@org;
DELETE FROM recovery_policy_execution_steps WHERE recovery_policy_execution_id IN (SELECT e.id FROM recovery_policy_executions e JOIN recovery_policies p ON p.id=e.recovery_policy_id WHERE p.organization_id=@org);
DELETE FROM recovery_policy_executions WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_simulation_steps WHERE recovery_policy_simulation_id IN (SELECT s.id FROM recovery_policy_simulations s JOIN recovery_policies p ON p.id=s.recovery_policy_id WHERE p.organization_id=@org);
DELETE FROM recovery_policy_simulations WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_validation_results WHERE recovery_policy_validation_id IN (SELECT v.id FROM recovery_policy_validations v JOIN recovery_policies p ON p.id=v.recovery_policy_id WHERE p.organization_id=@org);
DELETE FROM recovery_policy_validations WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_permissions WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_escalations WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_compensations WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_checkpoint_rules WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_guardrails WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_fallbacks WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_strategies WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_evidence_requirements WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_failure_mappings WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_scopes WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policy_versions WHERE recovery_policy_id IN (SELECT id FROM recovery_policies WHERE organization_id=@org);
DELETE FROM recovery_policies WHERE organization_id=@org;
DELETE FROM recovery_policy_categories WHERE organization_id=@org;

DECLARE @categories TABLE(category_name NVARCHAR(180), total INT, active INT, recoveries INT, success DECIMAL(8,2), seconds INT, blocks INT, escalations INT, output DECIMAL(8,2), health DECIMAL(8,2), strategy NVARCHAR(180), fallback NVARCHAR(180));
INSERT INTO @categories VALUES
('Workflow Retry Policies',10,9,60,96.0,128,0,0,98.5,97,'Exponential Backoff with Jitter','Open Incident'),
('Stage Retry Policies',9,8,48,95.4,142,0,0,97.9,96,'Fixed Backoff Retry','Resume from Checkpoint'),
('Checkpoint Recovery Policies',10,9,72,96.8,188,0,0,99.0,98,'Resume from Checkpoint','Reassign Worker'),
('Worker Failover Policies',8,7,64,94.2,210,1,0,98.1,94,'Reassign Worker','Switch Worker Pool'),
('Queue Failover Policies',8,7,52,93.6,196,1,0,98.4,93,'Move Queue','Rebalance Queue'),
('AI Provider Failover Policies',8,7,41,94.8,205,0,0,98.2,94,'Switch Provider','Switch Model'),
('AI Model Failover Policies',8,7,26,95.1,180,0,0,98.4,95,'Switch Model','Switch Agent'),
('Credential Recovery Policies',8,7,18,94.0,164,0,0,98.0,94,'Refresh Credentials','Open Incident'),
('Context Rebuild Policies',8,7,22,95.0,240,0,0,98.0,92,'Rebuild Context','Revalidate Output'),
('Output Revalidation Policies',9,8,38,95.6,172,0,0,98.4,96,'Revalidate Output','Regenerate Output'),
('Output Regeneration Policies',8,7,25,95.0,260,1,0,98.2,90,'Regenerate Output','Restore Previous Output Version'),
('Publishing Recovery Policies',8,7,34,95.8,218,0,0,98.3,93,'Roll Back Transition','Execute Compensation'),
('Analytics Recovery Policies',8,7,24,94.4,150,0,0,98.0,94,'Re-run Dependency','Open Incident'),
('Learning Recovery Policies',8,7,19,94.1,145,0,0,98.0,94,'Re-run Dependency','Start Alternate Workflow'),
('Database Recovery Policies',8,7,18,95.0,280,1,0,98.2,91,'Resume from Checkpoint','Open Incident'),
('Redis Recovery Policies',8,7,16,94.5,132,0,0,98.2,95,'Re-run Dependency','Move Queue'),
('Storage Recovery Policies',8,7,14,94.4,264,0,0,98.3,90,'Restore Previous Output Version','Open Incident'),
('Integration Recovery Policies',8,7,32,94.4,236,0,0,98.1,91,'Switch Provider','Start Alternate Workflow'),
('Compensation Policies',8,7,21,93.7,280,0,0,98.0,92,'Execute Compensation','Open Incident'),
('Rollback Policies',8,7,15,94.9,260,0,0,97.5,95,'Roll Back Transition','Restore Previous Output Version'),
('Incident Escalation Policies',8,7,10,94.0,90,0,2,97.5,90,'Open Incident','Escalate Exception'),
('Security Recovery Policies',12,9,15,94.8,220,0,1,96.96,91,'Refresh Credentials','Escalate Exception');

INSERT INTO recovery_policy_categories(organization_id,category_name,total_policies,active_policies,recoveries_today,success_rate,average_recovery_time_seconds,guardrail_blocks,escalations,final_output_protection_rate,health_percent,last_execution)
SELECT @org, category_name, total, active, recoveries, success, seconds, blocks, escalations, output, health, DATEADD(minute,-recoveries,SYSUTCDATETIME()) FROM @categories;

INSERT INTO recovery_policies(organization_id,policy_code,policy_name,description,category_id,status,current_version,published_version,priority,failure_scope,severity_range,primary_strategy,fallback_strategy,confidence_threshold,risk_ceiling,cost_ceiling,time_ceiling_seconds,max_attempts,checkpoint_required,compensation_enabled,incident_threshold,human_escalation_enabled,owner_id,organization_name,environment,executions_today,success_rate,average_recovery_time_seconds,final_output_protection_rate)
SELECT @org, CONCAT('RP-', RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY c.category_name) AS NVARCHAR(3)), 3)), c.category_name, CONCAT('Autonomous ', c.category_name, ' guardrail policy.'), pc.id,
  CASE WHEN c.health<90 THEN 'Warning' ELSE 'Active' END, 3, 3, 100-ROW_NUMBER() OVER (ORDER BY c.category_name), c.category_name, CASE WHEN c.health<90 THEN 'high-critical' ELSE 'medium-high' END, c.strategy, c.fallback, CASE WHEN c.health<90 THEN 86 ELSE 91 END, CASE WHEN c.health<90 THEN 70 ELSE 78 END, 25.00, c.seconds+180, CASE WHEN c.health<90 THEN 2 ELSE 3 END, 1, CASE WHEN c.category_name IN ('Compensation Policies','Publishing Recovery Policies','Rollback Policies') THEN 1 ELSE 0 END, CASE WHEN c.health<90 THEN 2 ELSE 3 END, CASE WHEN c.escalations>0 THEN 1 ELSE 0 END, 'Recovery Governance Engine', 'AI Media Group', 'production', c.recoveries, c.success, c.seconds, c.output
FROM @categories c JOIN recovery_policy_categories pc ON pc.organization_id=@org AND pc.category_name=c.category_name;

INSERT INTO recovery_policy_versions(recovery_policy_id,version_number,status,change_summary) SELECT id, current_version, 'published', 'Seeded autonomous recovery governance version' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_scopes(recovery_policy_id,failure_categories,workflow_categories,stage_types,error_codes,provider_types,queue_types,worker_types,organization_scope,brand_scope,environment_scope) SELECT id, failure_scope, category_name, 'AI, queue, worker, publishing, analytics, learning', 'timeout, provider_error, worker_lost, output_invalid', 'OpenAI, internal providers', 'workflow queues', 'standard and GPU pools', 'AI Media Group', 'all brands', environment FROM vw_recovery_policies_list WHERE organization_id=@org;
INSERT INTO recovery_policy_failure_mappings(recovery_policy_id,failure_type,severity,recovery_enabled) SELECT id, failure_scope, severity_range, 1 FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_evidence_requirements(recovery_policy_id,required_logs,required_health_signals,required_checkpoint,required_output_state,required_dependency_state,minimum_evidence_count,confidence_threshold) SELECT id, 1,1,checkpoint_required,1,1,3,confidence_threshold FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_strategies(recovery_policy_id,strategy_name,strategy_type,execution_order,execution_mode,backoff,cooldown_seconds,timeout_seconds) SELECT id, primary_strategy, 'primary', 1, 'sequential', 'exponential jitter', 30, time_ceiling_seconds FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_fallbacks(recovery_policy_id,fallback_strategy,maximum_attempts,fallback_order) SELECT id, fallback_strategy, 2, 1 FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_guardrails(recovery_policy_id,risk_ceiling,cost_ceiling,time_ceiling_seconds,maximum_retries,maximum_workflow_delay_seconds,security_boundary,data_integrity_boundary,publishing_boundary,human_escalation_boundary) SELECT id,risk_ceiling,cost_ceiling,time_ceiling_seconds,max_attempts,time_ceiling_seconds+300,'tenant-safe','no destructive overwrite','rollback required','escalate after approved paths' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_checkpoint_rules(recovery_policy_id,required,checkpoint_type,maximum_checkpoint_age_minutes,context_validation,output_validation,resume_point,data_loss_tolerance) SELECT id, checkpoint_required, 'stage checkpoint', 60, 1, 1, 'last completed safe stage', 'none for published output' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_compensations(recovery_policy_id,enabled,compensation_actions,rollback_action,reversibility,maximum_compensation_risk,verification) SELECT id, compensation_enabled, 'reverse side effects and restore output state', fallback_strategy, 'reversible', 35, 'post-recovery output validation' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_escalations(recovery_policy_id,incident_threshold,incident_severity,escalation_level,required_role,notification_policy,human_attention_criteria) SELECT id, incident_threshold, CASE WHEN human_escalation_enabled=1 THEN 'critical' ELSE 'warning' END, 'exception-only', 'recovery_policies.emergency_override', 'operational digest plus critical alerts', 'approved paths exhausted or security boundary risk' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_permissions(recovery_policy_id,permission_code,required) SELECT id, 'recovery_policies.view', 1 FROM recovery_policies WHERE organization_id=@org;

INSERT INTO recovery_policy_validations(recovery_policy_id,status,error_count,warning_count,recommendation_count,validation_score) SELECT id, CASE WHEN status='Warning' THEN 'Warning' ELSE 'Passed' END, 0, CASE WHEN status='Warning' THEN 2 ELSE 0 END, 2, CASE WHEN status='Warning' THEN 86 ELSE 96 END FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_validation_results(recovery_policy_validation_id,result_type,affected_section,message,suggested_fix,auto_fix_available) SELECT v.id, CASE WHEN v.status='Warning' THEN 'warning' ELSE 'recommendation' END, 'guardrails', 'Policy validated against retry, checkpoint, compensation, escalation, and final-output boundaries.', 'Tune recovery limits inside approved guardrails.', 1 FROM recovery_policy_validations v JOIN recovery_policies p ON p.id=v.recovery_policy_id WHERE p.organization_id=@org;
INSERT INTO recovery_policy_simulations(recovery_policy_id,simulation_mode,failure_type,selected_policy,confidence,risk,estimated_duration_seconds,estimated_cost,final_output_impact,incident_likelihood,human_attention_likelihood,status) SELECT id, 'Dry Run', failure_scope, policy_name, confidence_threshold, risk_ceiling-8, average_recovery_time_seconds, cost_ceiling*0.35, CASE WHEN final_output_protection_rate<95 THEN 'watch' ELSE 'protected' END, CASE WHEN status='Warning' THEN 18 ELSE 4 END, CASE WHEN human_escalation_enabled=1 THEN 12 ELSE 0 END, 'completed' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_simulation_steps(recovery_policy_simulation_id,step_name,step_order,outcome,duration_ms) SELECT s.id, stages.step_name, stages.step_order, 'completed', stages.step_order*120 FROM recovery_policy_simulations s CROSS APPLY (VALUES('Failure Scenario Loaded',1),('Candidate Policies Selected',2),('Scope Evaluated',3),('Evidence Evaluated',4),('Confidence Calculated',5),('Risk Calculated',6),('Cost Calculated',7),('Guardrails Evaluated',8),('Primary Strategy Simulated',9),('Fallback Strategy Simulated',10),('Compensation Simulated',11),('Incident Threshold Evaluated',12),('Final-Output Impact Calculated',13),('Simulation Result Generated',14),('Recommendation Recorded',15),('Completed',16)) stages(step_name,step_order) JOIN recovery_policies p ON p.id=s.recovery_policy_id WHERE p.organization_id=@org;
INSERT INTO recovery_policy_executions(recovery_policy_id,failure_context,selected_strategy,fallback_used,guardrail_result,compensation,escalation,final_output_impact,outcome,duration_seconds,cost) SELECT id, CONCAT(failure_scope,' recovery context'), primary_strategy, CASE WHEN success_rate<93 THEN 1 ELSE 0 END, 'inside guardrails', CASE WHEN compensation_enabled=1 THEN 'compensation available' ELSE 'not required' END, CASE WHEN human_escalation_enabled=1 THEN 'incident threshold armed' ELSE 'none' END, 'protected', 'workflow resumed', average_recovery_time_seconds, cost_ceiling*0.22 FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_execution_steps(recovery_policy_execution_id,step_name,step_order,confidence,risk,cost,outcome,audit_reference) SELECT e.id, trace.step_name, trace.step_order, 92, 35, e.cost/12, 'completed', CONCAT('AUD-RP-', trace.step_order) FROM recovery_policy_executions e CROSS APPLY (VALUES('Failure Detected',1),('Evidence Collected',2),('Candidate Policies',3),('Applicability Evaluated',4),('Confidence Calculated',5),('Risk Calculated',6),('Cost Calculated',7),('Policy Selected',8),('Guardrails Evaluated',9),('Recovery Executed',10),('Outcome Validated',11),('Learning Updated',12)) trace(step_name,step_order) JOIN recovery_policies p ON p.id=e.recovery_policy_id WHERE p.organization_id=@org;
INSERT INTO recovery_policy_decisions(organization_id,recovery_policy_id,failure_context,candidate_policies,evidence,confidence,risk,cost,selected_policy,selected_strategy,fallback,guardrail_result,final_output_impact,outcome,human_input_required) SELECT @org,id,CONCAT(failure_scope,' detected'),policy_name,'logs, health, checkpoint, output state',confidence_threshold,risk_ceiling-10,cost_ceiling*0.2,policy_name,primary_strategy,fallback_strategy,'passed','protected','workflow resumed',0 FROM recovery_policies WHERE organization_id=@org;

INSERT INTO recovery_policy_conflicts(organization_id,policies_involved,failure_scope,conflict_type,risk,execution_ambiguity,recommended_resolution,auto_resolution_available,governance_review_required,status) VALUES
(@org,'Queue Failover Policies; Worker Failover Policies','worker queue timeout','queue reassignment conflict','medium','two policies can move the same job','prefer worker failover before queue move',1,0,'open'),
(@org,'Output Regeneration Policies; Output Revalidation Policies','invalid generated output','different retry limits','medium','regeneration may start before revalidation completes','require revalidation first',1,0,'open'),
(@org,'Incident Escalation Policies; Security Recovery Policies','credential compromise','different incident thresholds','high','security path must escalate sooner','security threshold wins',0,1,'open');

INSERT INTO recovery_policy_coverage(organization_id,coverage_row,retry_status,checkpoint_status,worker_failover_status,queue_failover_status,provider_failover_status,model_failover_status,output_recovery_status,compensation_status,incident_escalation_status,final_output_protection_status)
SELECT @org, category_name, 'Covered', CASE WHEN health<91 THEN 'Partially Covered' ELSE 'Covered' END, 'Covered', 'Covered', 'Covered', 'Covered', CASE WHEN output<95 THEN 'Partially Covered' ELSE 'Covered' END, CASE WHEN category_name LIKE '%Compensation%' THEN 'Covered' ELSE 'Partially Covered' END, 'Covered', CASE WHEN output<95 THEN 'Partially Covered' ELSE 'Covered' END FROM @categories;

INSERT INTO recovery_policy_metrics(recovery_policy_id,executions,success_rate,failure_rate,average_recovery_time_seconds,average_recovery_cost,retry_success,checkpoint_success,worker_failover_success,queue_failover_success,provider_failover_success,model_failover_success,compensation_success,incident_creation_rate,human_escalation_rate,final_output_protection_rate,sla_protection_rate)
SELECT id, executions_today, success_rate, 100-success_rate, average_recovery_time_seconds, cost_ceiling*0.22, 94, 96, 93, 92, 94, 95, CASE WHEN compensation_enabled=1 THEN 93 ELSE 0 END, CASE WHEN human_escalation_enabled=1 THEN 4 ELSE 0.4 END, CASE WHEN human_escalation_enabled=1 THEN 2 ELSE 0 END, final_output_protection_rate, 96 FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_recommendations(organization_id,recovery_policy_id,policy_code,problem,recommendation,expected_time_improvement,expected_cost_improvement,expected_output_improvement,confidence,risk,auto_apply_eligible,applied_status) SELECT @org,id,policy_code,CASE WHEN success_rate<93 THEN 'success below target' ELSE 'safe tuning opportunity' END, CASE WHEN checkpoint_required=0 THEN 'require checkpoint' WHEN success_rate<93 THEN 'adjust backoff and fallback order' ELSE 'lower recovery time ceiling inside guardrails' END, 12, 8, CASE WHEN final_output_protection_rate<95 THEN 14 ELSE 4 END, 88, CASE WHEN status='Warning' THEN 'medium' ELSE 'low' END, CASE WHEN status='Active' THEN 1 ELSE 0 END, CASE WHEN status='Active' THEN 'applied to draft version' ELSE 'requires governance' END FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_change_history(recovery_policy_id,change_type,change_summary,changed_by) SELECT id,'seeded','Autonomous recovery policy governance baseline seeded','system' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_documentation(recovery_policy_id,title,summary) SELECT id, CONCAT(policy_name,' documentation'), 'Generated policy documentation covering scope, evidence, guardrails, compensation, escalation, and final-output protection.' FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_final_output_links(recovery_policy_id,output_chain,protection_status,publishing_recovery,analytics_recovery,learning_recovery,degradation_risk) SELECT id, 'Failure -> Recovery Policy -> Recovery Action -> Workflow Resume -> Output Completion -> Approval -> Publishing -> Analytics -> Learning -> Final Business Result', CASE WHEN final_output_protection_rate>=95 THEN 'fully protected' ELSE 'partially protected' END, 1,1,1, CASE WHEN final_output_protection_rate<95 THEN 'medium' ELSE 'low' END FROM recovery_policies WHERE organization_id=@org;
INSERT INTO recovery_policy_governance_approvals(recovery_policy_id,approval_reason,status,required_for) SELECT id,'Governance required for production policy changes','not_required','draft-only autonomous tuning' FROM recovery_policies WHERE organization_id=@org AND status='Active';
INSERT INTO recovery_policy_governance_approvals(recovery_policy_id,approval_reason,status,required_for) SELECT id,'Warning policy requires guardrail review before production change','required','production policy change' FROM recovery_policies WHERE organization_id=@org AND status='Warning';
END;
