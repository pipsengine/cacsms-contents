SET NOCOUNT ON;

IF OBJECT_ID('automation_rules', 'U') IS NOT NULL
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('automation_rules.view','View automation rules'),
  ('automation_rules.create','Create automation rules'),
  ('automation_rules.edit','Edit automation rules'),
  ('automation_rules.validate','Validate automation rules'),
  ('automation_rules.simulate','Simulate automation rules'),
  ('automation_rules.publish','Publish automation rules'),
  ('automation_rules.rollback','Roll back automation rules'),
  ('automation_rules.disable','Disable automation rules'),
  ('automation_rules.archive','Archive automation rules'),
  ('automation_rules.duplicate','Duplicate automation rules'),
  ('automation_rules.execute','Execute automation rules'),
  ('automation_rules.view_decision_trace','View automation rule decision trace'),
  ('automation_rules.resolve_conflicts','Resolve automation rule conflicts'),
  ('automation_rules.apply_recommendations','Apply automation rule recommendations'),
  ('automation_rules.generate_ai','Generate automation rules with AI'),
  ('automation_rules.export','Export automation rules'),
  ('automation_rules.manage_guardrails','Manage automation rule guardrails'),
  ('automation_rules.emergency_override','Use automation rule emergency override')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'automation_rules.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'automation-rules' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET status = 'running', health_percent = 99, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', 99);

MERGE workflow_definitions AS target
USING (VALUES
  (@org, 'AUTOMATION_RULE_VALIDATION', 'Automation Rule Validation', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_SIMULATION', 'Automation Rule Simulation', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_EXECUTION', 'Automation Rule Execution', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_RECOVERY', 'Automation Rule Recovery', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_CONFLICT_RESOLUTION', 'Automation Rule Conflict Resolution', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_OPTIMIZATION', 'Automation Rule Optimization', 'automation_rules'),
  (@org, 'AUTOMATION_RULE_VERSION_PUBLISH', 'Automation Rule Version Publish', 'automation_rules')
) AS source(organization_id, code, name, workflow_type)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow) VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', 1);

DECLARE @executionDefinition UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id = @org AND code = 'AUTOMATION_RULE_EXECUTION');
MERGE workflow_stages AS target
USING (VALUES
  (@org, @executionDefinition, 'event_received', 'Event Received', 1),
  (@org, @executionDefinition, 'context_loaded', 'Context Loaded', 2),
  (@org, @executionDefinition, 'candidate_rules_selected', 'Candidate Rules Selected', 3),
  (@org, @executionDefinition, 'scope_evaluated', 'Scope Evaluated', 4),
  (@org, @executionDefinition, 'conditions_evaluated', 'Conditions Evaluated', 5),
  (@org, @executionDefinition, 'priority_resolved', 'Priority Resolved', 6),
  (@org, @executionDefinition, 'conflict_detection', 'Conflict Detection', 7),
  (@org, @executionDefinition, 'decision_calculated', 'Decision Calculated', 8),
  (@org, @executionDefinition, 'guardrails_validated', 'Guardrails Validated', 9),
  (@org, @executionDefinition, 'action_plan_created', 'Action Plan Created', 10),
  (@org, @executionDefinition, 'actions_executed', 'Actions Executed', 11),
  (@org, @executionDefinition, 'results_validated', 'Results Validated', 12),
  (@org, @executionDefinition, 'recovery_executed', 'Recovery Executed if Required', 13),
  (@org, @executionDefinition, 'outcome_persisted', 'Outcome Persisted', 14),
  (@org, @executionDefinition, 'audit_logged', 'Audit Logged', 15),
  (@org, @executionDefinition, 'learning_recorded', 'Learning Recorded', 16),
  (@org, @executionDefinition, 'completed', 'Completed', 17)
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no)
ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
WHEN MATCHED THEN UPDATE SET name = source.name, sequence_no = source.sequence_no, display_order = source.sequence_no, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'automation', 'sequential', 5.88, 'automation_rules.execute', 'active');

DECLARE @rules TABLE(code NVARCHAR(120), name NVARCHAR(220), category NVARCHAR(120), trigger_type NVARCHAR(80), trigger_source NVARCHAR(180), priority NVARCHAR(40), status NVARCHAR(40), mode NVARCHAR(80), success DECIMAL(8,2), eval_ms INT, executions INT, duplicate_count INT, recovery_rate DECIMAL(8,2), impact DECIMAL(8,2));
INSERT INTO @rules VALUES
('AR-SYSTEM-STARTUP-001','Autonomous Startup Readiness Gate','System Control','Event','system-runtime','critical','active','fully_autonomous',99.2,31,1420,18,0.9,91),
('AR-WORKFLOW-QUEUE-002','Workflow Queue Pressure Rebalance','Workflow Execution','Queue Threshold','workflow-execution','high','active','fully_autonomous',98.1,44,2310,42,1.8,88),
('AR-AI-PROVIDER-003','AI Provider Latency Switch','AI Agent Orchestration','AI Agent Result','ai-orchestrator','high','active','fully_autonomous',97.4,52,1840,33,3.4,84),
('AR-CONTENT-QUALITY-004','Content Quality Gate Auto Decision','Content Production','Workflow State Change','content-lifecycle','high','active','fully_autonomous',98.9,38,1688,24,0.8,90),
('AR-CREATIVE-005','Creative Asset Regeneration Rule','Creative Automation','Event','creative-engine','medium','active','fully_autonomous',96.8,49,1030,15,4.2,76),
('AR-VOICE-006','Voice Render Retry and Provider Switch','Audio and Voice','Worker Health','voice-render','medium','active','fully_autonomous',97.2,45,884,12,5.8,73),
('AR-VIDEO-007','Video Render Pool Scale Rule','Video Production','Queue Threshold','video-render','critical','warning','fully_autonomous',94.6,67,1299,39,8.1,72),
('AR-APPROVAL-008','Auto Approval Quality Gate','Approval Automation','Workflow State Change','approval-engine','high','active','fully_autonomous',99.0,35,1510,21,0.4,94),
('AR-PUBLISH-009','Publishing Window Protection','Publishing Automation','Publishing Event','publishing','critical','active','fully_autonomous',98.3,41,943,17,2.2,92),
('AR-ANALYTICS-010','Analytics Collection Trigger','Analytics Automation','Analytics Threshold','analytics','medium','active','fully_autonomous',99.4,28,1894,27,0.5,86),
('AR-LEARNING-011','Learning Feedback Completion Rule','Learning Automation','Learning Recommendation','learning','medium','active','fully_autonomous',98.0,33,742,9,1.4,81),
('AR-MONITOR-012','Service Health Incident Guard','Monitoring','Service Health','service-health','critical','active','fully_autonomous',97.8,43,1200,14,5.0,80),
('AR-INCIDENT-013','Incident Recovery Exhaustion Escalation','Incident Response','Incident Event','incident-manager','critical','active','fully_autonomous',96.5,56,410,4,12.2,79),
('AR-WORKER-014','Worker Heartbeat Recovery','Worker Recovery','Worker Health','workers','high','active','fully_autonomous',98.6,39,996,19,6.6,83),
('AR-QUEUE-015','Duplicate Queue Event Suppression','Queue Management','Queue Threshold','bullmq','high','active','fully_autonomous',99.1,24,2440,342,0.2,87),
('AR-NOTIFY-016','Operational Digest Routing','Notification Automation','Schedule','notifications','low','active','fully_autonomous',99.6,22,360,7,0.0,67),
('AR-INTEGRATION-017','Webhook Retry with Idempotency','Integration Automation','Webhook','integrations','medium','conflicted','fully_autonomous',92.5,78,532,28,9.5,58),
('AR-COST-018','AI Cost Threshold Guardrail','Cost Optimization','Cost Threshold','ai-usage','high','active','fully_autonomous',98.7,36,815,10,1.6,89),
('AR-COMPLIANCE-019','Compliance Publishing Boundary','Compliance','Security Event','compliance','critical','active','fully_autonomous',99.3,46,620,6,0.8,93),
('AR-SECURITY-020','Security Boundary Incident Rule','Security','Security Event','security','critical','active','fully_autonomous',98.2,50,488,5,3.2,85),
('AR-MAINT-021','Archive Expired Rules','Maintenance','Schedule','automation-rules','low','active','fully_autonomous',99.7,29,257,3,0.0,64);

DECLARE @code NVARCHAR(120), @name NVARCHAR(220), @category NVARCHAR(120), @triggerType NVARCHAR(80), @triggerSource NVARCHAR(180), @priority NVARCHAR(40), @status NVARCHAR(40), @mode NVARCHAR(80), @success DECIMAL(8,2), @eval INT, @exec INT, @dups INT, @recovery DECIMAL(8,2), @impact DECIMAL(8,2);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @rules;
OPEN c;
FETCH NEXT FROM c INTO @code, @name, @category, @triggerType, @triggerSource, @priority, @status, @mode, @success, @eval, @exec, @dups, @recovery, @impact;
WHILE @@FETCH_STATUS = 0
BEGIN
  DECLARE @rule UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM automation_rules WHERE organization_id = @org AND rule_code = @code);
  IF @rule IS NULL
  BEGIN
    SET @rule = NEWID();
    INSERT INTO automation_rules(id, organization_id, rule_code, rule_name, description, category, status, current_version, published_version, priority, execution_mode, environment, owner_id, recovery_enabled, human_escalation_enabled, effective_at)
    VALUES (@rule, @org, @code, @name, CONCAT('Autonomous rule for ', LOWER(@category), ' with policy-based decisions, recovery, idempotency, audit, and final-output continuity.'), @category, @status, 3, 3, @priority, @mode, 'production', 'automation-engine', 1, 1, DATEADD(day, -30, SYSUTCDATETIME()));
  END
  ELSE
    UPDATE automation_rules SET rule_name = @name, category = @category, status = @status, priority = @priority, execution_mode = @mode, updated_at = SYSUTCDATETIME() WHERE id = @rule;

  IF NOT EXISTS (SELECT 1 FROM automation_rule_triggers WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_triggers(automation_rule_id, trigger_type, trigger_source, event_name, data_source, scope, debounce_seconds, throttle_seconds, idempotency_key)
    VALUES (@rule, @triggerType, @triggerSource, LOWER(REPLACE(@name, ' ', '.')), @triggerSource, 'organization', 30, 60, CONCAT(@code, ':{{reference}}'));
  IF NOT EXISTS (SELECT 1 FROM automation_rule_condition_groups WHERE automation_rule_id = @rule)
  BEGIN
    DECLARE @group UNIQUEIDENTIFIER = NEWID();
    INSERT INTO automation_rule_condition_groups(id, automation_rule_id, boolean_operator, group_order) VALUES (@group, @rule, 'AND', 1);
    INSERT INTO automation_rule_conditions(condition_group_id, data_source, field_path, operator, compare_value, time_window, fallback_value)
    VALUES (@group, @triggerSource, 'event.healthPercent', 'greater than or equal', '80', '5 minutes', '100');
  END
  IF NOT EXISTS (SELECT 1 FROM automation_rule_actions WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_actions(automation_rule_id, action_name, action_type, execution_order, execution_mode, retry_policy, timeout_seconds, worker_pool, queue_name, required_permission, output_mapping)
    VALUES (@rule, CONCAT('Execute ', @category, ' automation'), 'Execute Remediation', 1, 'sequential', 'retry:3 exponential', 180, 'automation-workers', 'automation-rules', 'automation_rules.execute', '{"decision":"persisted"}');
  IF NOT EXISTS (SELECT 1 FROM automation_rule_recovery_actions WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_recovery_actions(automation_rule_id, recovery_policy, retry_strategy, compensation_action, fallback_action, incident_creation, escalation_rule)
    VALUES (@rule, 'approved autonomous recovery', 'checkpoint retry', 'compensate partial action', 'open incident if exhausted', CASE WHEN @priority = 'critical' THEN 1 ELSE 0 END, 'escalate only outside guardrails');
  IF NOT EXISTS (SELECT 1 FROM automation_rule_guardrails WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_guardrails(automation_rule_id, cost_limit, risk_threshold, confidence_threshold, rate_limit_per_minute, concurrency_limit, security_boundary, data_classification, human_escalation_boundary)
    VALUES (@rule, 50, 80, 75, 120, 8, 'tenant-boundary', 'internal', 'guardrail exceeded');
  IF NOT EXISTS (SELECT 1 FROM automation_rule_versions WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_versions(automation_rule_id, version_number, status, change_summary, validation_status, simulation_status, published_environment, execution_count, success_rate, rollback_eligible, created_by)
    VALUES (@rule, 3, 'published', 'Production autonomous-rule baseline', 'passed', 'passed', 'production', @exec, @success, 1, 'automation-engine');

  MERGE automation_rule_metrics AS target
  USING (SELECT @rule AS automation_rule_id, CAST(SYSUTCDATETIME() AS DATE) AS metric_date) AS source
  ON target.automation_rule_id = source.automation_rule_id AND target.metric_date = source.metric_date
  WHEN MATCHED THEN UPDATE SET execution_count_today = @exec, success_rate = @success, failure_rate = 100 - @success, avg_evaluation_ms = @eval, avg_action_duration_ms = @eval * 4, cost_per_execution = 0.003, recovery_rate = @recovery, duplicate_suppression_count = @dups, conflict_rate = CASE WHEN @status = 'conflicted' THEN 12 ELSE 0 END, human_escalation_rate = 0, final_output_impact_score = @impact, sla_improvement_percent = @impact / 10, cost_savings = @dups * 0.14
  WHEN NOT MATCHED THEN INSERT (automation_rule_id, execution_count_today, success_rate, failure_rate, avg_evaluation_ms, avg_action_duration_ms, cost_per_execution, recovery_rate, duplicate_suppression_count, conflict_rate, human_escalation_rate, final_output_impact_score, sla_improvement_percent, cost_savings)
  VALUES (@rule, @exec, @success, 100 - @success, @eval, @eval * 4, 0.003, @recovery, @dups, CASE WHEN @status = 'conflicted' THEN 12 ELSE 0 END, 0, @impact, @impact / 10, @dups * 0.14);

  IF NOT EXISTS (SELECT 1 FROM automation_rule_executions WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_executions(automation_rule_id, organization_id, trigger_event, matched, conditions_passed, decision, actions_executed, status, duration_ms, cost, recovery_used, conflict_detected, workflow_reference, reference_id, created_at)
    VALUES (@rule, @org, LOWER(REPLACE(@name, ' ', '.')), 1, 1, 'execute autonomous action', 1, CASE WHEN @status = 'conflicted' THEN 'Recovering' ELSE 'Completed' END, @eval * 5, 0.01, CASE WHEN @recovery > 5 THEN 1 ELSE 0 END, CASE WHEN @status = 'conflicted' THEN 1 ELSE 0 END, 'AUTOMATION_RULE_EXECUTION', @code, DATEADD(minute, -@eval, SYSUTCDATETIME()));
  IF NOT EXISTS (SELECT 1 FROM automation_rule_decisions WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_decisions(automation_rule_id, triggering_event, evaluated_values, matched_conditions, alternative_rules, conflict_resolution, selected_actions, confidence_percent, risk_level, outcome, final_output_impact)
    VALUES (@rule, LOWER(REPLACE(@name, ' ', '.')), '{"healthPercent":99}', 'event.healthPercent >= 80', '[]', CASE WHEN @status = 'conflicted' THEN 'suppressed lower-priority duplicate' ELSE 'not required' END, '["execute autonomous action"]', @success, CASE WHEN @status = 'conflicted' THEN 'medium' ELSE 'low' END, CASE WHEN @status = 'conflicted' THEN 'recovered' ELSE 'completed' END, 'workflow continuity protected');
  IF NOT EXISTS (SELECT 1 FROM automation_rule_recommendations WHERE automation_rule_id = @rule)
    INSERT INTO automation_rule_recommendations(automation_rule_id, recommendation_type, title, description, impact, confidence_percent, inside_guardrails)
    VALUES (@rule, 'optimization', CONCAT('Tune ', @category, ' threshold'), 'Autonomous optimizer recommends a small threshold adjustment based on execution outcomes.', CASE WHEN @impact > 85 THEN 'high' ELSE 'medium' END, 87, 1);

  FETCH NEXT FROM c INTO @code, @name, @category, @triggerType, @triggerSource, @priority, @status, @mode, @success, @eval, @exec, @dups, @recovery, @impact;
END
CLOSE c;
DEALLOCATE c;

DECLARE @conflictRule UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM automation_rules WHERE rule_code = 'AR-INTEGRATION-017' AND organization_id = @org);
DECLARE @otherRule UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM automation_rules WHERE rule_code = 'AR-WORKFLOW-QUEUE-002' AND organization_id = @org);
IF @conflictRule IS NOT NULL AND NOT EXISTS (SELECT 1 FROM automation_rule_conflicts WHERE primary_rule_id = @conflictRule)
  INSERT INTO automation_rule_conflicts(organization_id, primary_rule_id, conflicting_rule_id, trigger_name, conflict_type, impact, risk_score, execution_ambiguity, suggested_resolution, auto_resolution_available, governance_review_required)
  VALUES (@org, @conflictRule, @otherRule, 'webhook.retry', 'duplicate action', 'Two rules may retry the same webhook action.', 74, 'competing retry timing', 'Prefer idempotent integration retry rule and suppress workflow duplicate.', 1, 0);
END;
