SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
IF @org IS NULL THROW 51000, 'No organization exists for workflow dashboard seed.', 1;

DELETE FROM workflow_autonomous_decisions WHERE organization_id = @org;
DELETE FROM workflow_recovery_actions WHERE organization_id = @org;
DELETE FROM workflow_final_outputs WHERE organization_id = @org;
DELETE FROM workflow_dashboard_categories WHERE organization_id = @org;

MERGE workflow_dashboard_categories AS target
USING (VALUES
(@org,'System Startup','system_control','Automation Platform',98),
(@org,'System Shutdown','system_control','Automation Platform',97),
(@org,'Implementation Validation','validation','Build Operations',94),
(@org,'Research Workflows','research','AI Research',96),
(@org,'Content Production','content','Content Automation',95),
(@org,'Creative Generation','creative','Creative Operations',93),
(@org,'Voice Production','voice','Audio Operations',92),
(@org,'Video Production','video','Video Operations',91),
(@org,'Content Approval','approval','Governance Automation',99),
(@org,'Publishing','publishing','Publishing Operations',94),
(@org,'Analytics Collection','analytics','Data Platform',96),
(@org,'Learning Feedback','learning','AI Learning',97),
(@org,'System Monitoring','monitoring','Operations',98),
(@org,'Incident Recovery','incident_recovery','Incident Automation',92),
(@org,'Worker Recovery','worker_recovery','Automation Platform',90),
(@org,'Database Maintenance','database','Data Platform',95),
(@org,'Reporting','reporting','Reporting Automation',96),
(@org,'Notifications','notifications','Engagement Automation',98),
(@org,'Integrations','integrations','Integration Platform',91)
) AS source(organization_id, category_name, workflow_type, owner_team, health_percent)
ON target.organization_id = source.organization_id AND target.category_name = source.category_name
WHEN MATCHED THEN UPDATE SET workflow_type = source.workflow_type, owner_team = source.owner_team, health_percent = source.health_percent, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, category_name, workflow_type, owner_team, health_percent) VALUES (source.organization_id, source.category_name, source.workflow_type, source.owner_team, source.health_percent);

DECLARE @defs TABLE(code NVARCHAR(120), status NVARCHAR(40), progress DECIMAL(8,2), ref NVARCHAR(120), minutes_ago INT, stage_seq INT);
INSERT INTO @defs VALUES
('CONTENT_LIFECYCLE','running',58,'content-cycle-042',18,4),
('CONTENT_LIFECYCLE','queued',0,'content-cycle-043',4,1),
('CONTENT_PUBLISHING','running',71,'publish-window-017',22,3),
('ANALYTICS_COLLECTION','recovering',46,'analytics-batch-089',31,2),
('LEARNING_FEEDBACK','running',63,'learning-feedback-012',16,2),
('IMPLEMENTATION_VALIDATION','blocked',39,'validation-nightly',44,8),
('CONTENT_APPROVAL','completed',100,'approval-autonomous-009',75,1),
('CONTENT_LIFECYCLE','failed',36,'content-cycle-041',58,3);

DECLARE @inserted TABLE(id UNIQUEIDENTIFIER, workflow_definition_id UNIQUEIDENTIFIER, status NVARCHAR(40), progress DECIMAL(8,2));

INSERT INTO workflow_instances(organization_id, workflow_definition_id, workflow_version, reference_type, reference_id, status, current_stage_id, progress_percent, started_at, completed_at, initiated_by, correlation_id, context_json, created_at, updated_at)
OUTPUT INSERTED.id, INSERTED.workflow_definition_id, INSERTED.status, INSERTED.progress_percent INTO @inserted
SELECT @org, wd.id, wd.current_version, 'autonomous_scheduler', d.ref, d.status,
  (SELECT TOP 1 ws.id FROM workflow_stages ws WHERE ws.workflow_definition_id = wd.id ORDER BY ABS(COALESCE(ws.sequence_no, ws.display_order, 1) - d.stage_seq), COALESCE(ws.sequence_no, ws.display_order, 1)),
  d.progress,
  DATEADD(minute, -d.minutes_ago, SYSUTCDATETIME()),
  CASE WHEN d.status = 'completed' THEN DATEADD(minute, -5, SYSUTCDATETIME()) ELSE NULL END,
  'workflow-engine',
  CONCAT('wf-dashboard-', LOWER(d.code), '-', d.ref),
  CONCAT('{"dashboardSeed":true,"autonomous":true,"reference":"', d.ref, '"}'),
  DATEADD(minute, -d.minutes_ago, SYSUTCDATETIME()),
  SYSUTCDATETIME()
FROM @defs d
JOIN workflow_definitions wd ON wd.organization_id = @org AND wd.code = d.code
WHERE NOT EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = d.ref);

INSERT INTO workflow_instance_steps(workflow_instance_id, workflow_stage_id, status, progress_percent, started_at, completed_at, retry_count, worker_id, output_reference)
SELECT i.id, ws.id,
  CASE
    WHEN i.status = 'completed' THEN 'completed'
    WHEN COALESCE(ws.sequence_no, ws.display_order, 1) < 3 THEN 'completed'
    WHEN COALESCE(ws.sequence_no, ws.display_order, 1) = 3 AND i.status IN ('running','recovering','blocked','failed') THEN CASE WHEN i.status = 'failed' THEN 'failed' ELSE 'running' END
    ELSE 'queued'
  END,
  CASE
    WHEN i.status = 'completed' THEN 100
    WHEN COALESCE(ws.sequence_no, ws.display_order, 1) < 3 THEN 100
    WHEN COALESCE(ws.sequence_no, ws.display_order, 1) = 3 THEN i.progress
    ELSE 0
  END,
  DATEADD(minute, -20, SYSUTCDATETIME()),
  CASE WHEN i.status = 'completed' OR COALESCE(ws.sequence_no, ws.display_order, 1) < 3 THEN DATEADD(minute, -10, SYSUTCDATETIME()) ELSE NULL END,
  CASE WHEN i.status IN ('recovering','failed') THEN 1 ELSE 0 END,
  CONCAT('worker-', LOWER(LEFT(wd.code, 8))),
  CASE WHEN i.status = 'completed' OR COALESCE(ws.sequence_no, ws.display_order, 1) < 3 THEN CONCAT(ws.stage_code, ':', CONVERT(NVARCHAR(36), i.id)) ELSE NULL END
FROM @inserted i
JOIN workflow_definitions wd ON wd.id = i.workflow_definition_id
JOIN workflow_stages ws ON ws.workflow_definition_id = wd.id
WHERE NOT EXISTS (SELECT 1 FROM workflow_instance_steps wis WHERE wis.workflow_instance_id = i.id AND wis.workflow_stage_id = ws.id);

INSERT INTO workflow_events(organization_id, workflow_instance_id, event_name, payload_json, correlation_id, created_at)
SELECT @org, id, CASE status WHEN 'failed' THEN 'workflow.failed' WHEN 'recovering' THEN 'workflow.recovering' WHEN 'blocked' THEN 'workflow.blocked' WHEN 'completed' THEN 'workflow.completed' ELSE 'workflow.stage.progress' END,
  CONCAT('{"status":"', status, '","progress":', CONVERT(NVARCHAR(20), progress), '}'),
  CONCAT('event-', CONVERT(NVARCHAR(36), id)),
  SYSUTCDATETIME()
FROM @inserted;

INSERT INTO workflow_failures(workflow_instance_id, workflow_stage_id, failure_code, failure_message, is_retryable, resolution_status)
SELECT TOP 2 i.id, wi.current_stage_id, 'AUTO_RECOVERY_REQUIRED', 'Autonomous recovery policy detected a retryable workflow fault.', 1, CASE WHEN i.status = 'recovering' THEN 'recovering' ELSE 'open' END
FROM @inserted i JOIN workflow_instances wi ON wi.id = i.id
WHERE i.status IN ('recovering','failed');

INSERT INTO workflow_recovery_actions(organization_id, workflow_instance_id, failure_reason, recovery_strategy, recovery_stage, jobs_protected, checkpoint_used, retry_count, alternative_provider, expected_recovery_minutes, confidence_percent, final_outcome, status)
SELECT @org, wi.id, 'AI provider latency caused stage timeout', 'Switch AI Provider', 'Validate Worker', 7, 'stage-checkpoint-analytics', 1, 'Fallback Model Pool', 6, 88, 'Recovery in progress', 'in_progress'
FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = 'analytics-batch-089'
UNION ALL
SELECT @org, wi.id, 'Output validation failed schema consistency', 'Revalidate Output', 'Record Learning', 4, 'content-stage-3', 2, NULL, 0, 94, 'Recovered', 'completed'
FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = 'content-cycle-041';

INSERT INTO workflow_autonomous_decisions(organization_id, workflow_instance_id, decision_type, decision_title, confidence_percent, action_taken, outcome, risk_level, policy_used, created_at)
SELECT @org, wi.id, 'recovery', 'Switched analytics workflow to fallback provider', 88, 'Provider switched and job checkpoint preserved', 'in_progress', 'Medium', 'AUTONOMOUS_RECOVERY', DATEADD(minute,-6,SYSUTCDATETIME())
FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = 'analytics-batch-089'
UNION ALL
SELECT @org, wi.id, 'approval', 'Bypassed manual content approval via autonomous quality rule', 96, 'Auto-approved with compliance score above threshold', 'completed', 'Low', 'AUTONOMOUS_APPROVAL', DATEADD(minute,-15,SYSUTCDATETIME())
FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = 'approval-autonomous-009'
UNION ALL
SELECT @org, wi.id, 'queue', 'Rebalanced publishing workflow jobs to healthy queue workers', 91, 'Reassigned jobs to publishing worker pool', 'completed', 'Low', 'QUEUE_REBALANCE', DATEADD(minute,-11,SYSUTCDATETIME())
FROM workflow_instances wi WHERE wi.organization_id = @org AND wi.reference_id = 'publish-window-017';

INSERT INTO workflow_final_outputs(organization_id, workflow_instance_id, output_type, output_reference, readiness_status, validation_status, publishing_status, analytics_status, learning_status)
SELECT @org, wi.id, 'content_package', CONCAT('workflow-output:', wi.reference_id), CASE WHEN wi.status = 'completed' THEN 'Ready' WHEN wi.status = 'failed' THEN 'Blocked' ELSE 'Pending' END,
  CASE WHEN wi.status = 'completed' THEN 'Validated' WHEN wi.status = 'failed' THEN 'Failed' ELSE 'Pending' END,
  CASE WHEN wi.status = 'completed' THEN 'Completed' ELSE 'Pending' END,
  CASE WHEN wi.status = 'completed' THEN 'Completed' ELSE 'Pending' END,
  CASE WHEN wi.status = 'completed' THEN 'Completed' ELSE 'Pending' END
FROM workflow_instances wi
WHERE wi.organization_id = @org AND wi.reference_id IN ('approval-autonomous-009','content-cycle-041','content-cycle-042','publish-window-017');

MERGE job_queues AS target
USING (VALUES
(@org,'System Control Queue',98),(@org,'Workflow Execution Queue',97),(@org,'AI Generation Queue',95),(@org,'Research Queue',96),
(@org,'Creative Queue',93),(@org,'Voice Queue',94),(@org,'Video Rendering Queue',91),(@org,'Approval Queue',99),
(@org,'Publishing Queue',93),(@org,'Analytics Queue',92),(@org,'Learning Queue',96),(@org,'Notifications Queue',98),
(@org,'Integrations Queue',91),(@org,'Recovery Queue',94)
) AS source(organization_id, name, health_percent)
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET health_percent = source.health_percent, status = 'running', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent) VALUES (source.organization_id, source.name, 'running', source.health_percent);
