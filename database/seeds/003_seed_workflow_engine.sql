IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003_workflow_engine_runtime')
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE(
  (SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'),
  (SELECT TOP 1 id FROM organizations ORDER BY created_at)
);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('system.start', 'Start system services'),
  ('system.stop', 'Stop system services'),
  ('system.pause', 'Pause system workflows'),
  ('system.resume', 'Resume system workflows'),
  ('system.restart', 'Restart system services'),
  ('system.force_stop', 'Force stop system services'),
  ('workflow.view', 'View workflow instances'),
  ('workflow.create', 'Create workflow instances'),
  ('workflow.execute', 'Execute workflows'),
  ('workflow.pause', 'Pause workflows'),
  ('workflow.resume', 'Resume workflows'),
  ('workflow.cancel', 'Cancel workflows'),
  ('workflow.retry', 'Retry workflows'),
  ('workflow.approve', 'Approve workflows'),
  ('workflow.reject', 'Reject workflows'),
  ('workflow.request_changes', 'Request workflow changes'),
  ('implementation_validation.run', 'Run implementation validation'),
  ('implementation_validation.recheck', 'Recheck implementation module'),
  ('background_jobs.retry', 'Retry background jobs'),
  ('background_jobs.cancel', 'Cancel background jobs')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT @adminRole, p.id
FROM permissions p
WHERE @adminRole IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

MERGE job_queues AS target
USING (VALUES
  (@org, 'system-control'),
  (@org, 'implementation-validation'),
  (@org, 'workflow-execution'),
  (@org, 'publishing'),
  (@org, 'analytics'),
  (@org, 'learning'),
  (@org, 'notifications')
) AS source(organization_id, name)
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN NOT MATCHED THEN INSERT (organization_id, name, status) VALUES (source.organization_id, source.name, 'running');

MERGE workflow_definitions AS target
USING (VALUES
  (@org, 'SYSTEM_STARTUP', 'System Startup', 'system_control', 1),
  (@org, 'SYSTEM_SHUTDOWN', 'System Shutdown', 'system_control', 1),
  (@org, 'IMPLEMENTATION_VALIDATION', 'Implementation Validation', 'validation', 1),
  (@org, 'CONTENT_LIFECYCLE', 'Content Lifecycle', 'content', 0),
  (@org, 'CONTENT_APPROVAL', 'Content Approval', 'approval', 0),
  (@org, 'CONTENT_PUBLISHING', 'Content Publishing', 'publishing', 0),
  (@org, 'ANALYTICS_COLLECTION', 'Analytics Collection', 'analytics', 0),
  (@org, 'LEARNING_FEEDBACK', 'Learning Feedback', 'learning', 0)
) AS source(organization_id, code, name, workflow_type, is_system_workflow)
ON target.organization_id = source.organization_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, workflow_type = source.workflow_type, status = 'active', is_system_workflow = source.is_system_workflow, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, workflow_type, status, is_system_workflow)
VALUES (source.organization_id, source.code, source.name, source.workflow_type, 'active', source.is_system_workflow);

DECLARE @startup UNIQUEIDENTIFIER = (SELECT id FROM workflow_definitions WHERE organization_id = @org AND code = 'SYSTEM_STARTUP');
DECLARE @shutdown UNIQUEIDENTIFIER = (SELECT id FROM workflow_definitions WHERE organization_id = @org AND code = 'SYSTEM_SHUTDOWN');
DECLARE @validation UNIQUEIDENTIFIER = (SELECT id FROM workflow_definitions WHERE organization_id = @org AND code = 'IMPLEMENTATION_VALIDATION');
DECLARE @content UNIQUEIDENTIFIER = (SELECT id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_LIFECYCLE');

MERGE workflow_stages AS target
USING (VALUES
  (@org, @startup, 'validate_environment', 'Validate Environment', 1, 6.25, 'system.start'),
  (@org, @startup, 'connect_database', 'Connect Database', 2, 6.25, 'system.start'),
  (@org, @startup, 'initialize_cache', 'Initialize Cache', 3, 6.25, 'system.start'),
  (@org, @startup, 'initialize_event_bus', 'Initialize Event Bus', 4, 6.25, 'system.start'),
  (@org, @startup, 'start_queue_manager', 'Start Queue Manager', 5, 6.25, 'system.start'),
  (@org, @startup, 'start_workers', 'Start Workers', 6, 6.25, 'system.start'),
  (@org, @startup, 'initialize_core_services', 'Initialize Core Services', 7, 6.25, 'system.start'),
  (@org, @startup, 'initialize_ai_providers', 'Initialize AI Providers', 8, 6.25, 'system.start'),
  (@org, @startup, 'initialize_ai_orchestrator', 'Initialize AI Orchestrator', 9, 6.25, 'system.start'),
  (@org, @startup, 'initialize_workflow_engine', 'Initialize Workflow Engine', 10, 6.25, 'system.start'),
  (@org, @startup, 'initialize_content_pipeline', 'Initialize Content Pipeline', 11, 6.25, 'system.start'),
  (@org, @startup, 'initialize_publishing_services', 'Initialize Publishing Services', 12, 6.25, 'system.start'),
  (@org, @startup, 'initialize_analytics_services', 'Initialize Analytics Services', 13, 6.25, 'system.start'),
  (@org, @startup, 'initialize_monitoring_services', 'Initialize Monitoring Services', 14, 6.25, 'system.start'),
  (@org, @startup, 'run_readiness_checks', 'Run Readiness Checks', 15, 6.25, 'system.start'),
  (@org, @startup, 'mark_system_operational', 'Mark System Operational', 16, 6.25, 'system.start'),
  (@org, @shutdown, 'block_new_requests', 'Block New Requests', 1, 9.09, 'system.stop'),
  (@org, @shutdown, 'pause_schedulers', 'Pause Schedulers', 2, 9.09, 'system.stop'),
  (@org, @shutdown, 'drain_queues', 'Drain Queues', 3, 9.09, 'system.stop'),
  (@org, @shutdown, 'finish_critical_jobs', 'Finish Critical Jobs', 4, 9.09, 'system.stop'),
  (@org, @shutdown, 'stop_workers', 'Stop Non-Critical Workers', 5, 9.09, 'system.stop'),
  (@org, @shutdown, 'stop_publishing', 'Stop Publishing Tasks', 6, 9.09, 'system.stop'),
  (@org, @shutdown, 'stop_ai_runs', 'Stop AI Agent Runs', 7, 9.09, 'system.stop'),
  (@org, @shutdown, 'flush_logs_metrics', 'Flush Logs and Metrics', 8, 9.09, 'system.stop'),
  (@org, @shutdown, 'close_cache', 'Close Cache Connections', 9, 9.09, 'system.stop'),
  (@org, @shutdown, 'close_database', 'Close Database Connections', 10, 9.09, 'system.stop'),
  (@org, @shutdown, 'mark_stopped', 'Mark System Stopped', 11, 9.10, 'system.stop'),
  (@org, @validation, 'validate_sidebar', 'Validate Sidebar Registration', 1, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_routes', 'Validate Route Registration', 2, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_pages', 'Validate Page Files', 3, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_components', 'Validate Components', 4, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_api', 'Validate API Endpoints', 5, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_services', 'Validate Services', 6, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_repositories', 'Validate Repositories', 7, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_tables', 'Validate MSSQL Tables', 8, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_ai', 'Validate AI Agent Linkage', 9, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_workflow', 'Validate Workflow Linkage', 10, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_storage', 'Validate Storage Linkage', 11, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_rbac', 'Validate RBAC', 12, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_approval', 'Validate Approval Flow', 13, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_publishing', 'Validate Publishing Flow', 14, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_analytics', 'Validate Analytics Flow', 15, 5, 'implementation_validation.run'),
  (@org, @validation, 'validate_learning', 'Validate Learning Feedback', 16, 5, 'implementation_validation.run'),
  (@org, @validation, 'linkage_matrix', 'Generate Linkage Matrix', 17, 5, 'implementation_validation.run'),
  (@org, @validation, 'blocker_report', 'Generate Blocker Report', 18, 5, 'implementation_validation.run'),
  (@org, @validation, 'readiness_score', 'Calculate Readiness Score', 19, 5, 'implementation_validation.run'),
  (@org, @validation, 'complete_validation', 'Complete Validation', 20, 5, 'implementation_validation.run'),
  (@org, @content, 'idea_created', 'Idea Created', 1, 4.55, 'workflow.execute'),
  (@org, @content, 'research', 'Research', 2, 4.55, 'workflow.execute'),
  (@org, @content, 'approval', 'Approval', 15, 4.55, 'workflow.approve'),
  (@org, @content, 'publishing', 'Publishing', 17, 4.55, 'workflow.execute'),
  (@org, @content, 'analytics_collection', 'Analytics Collection', 18, 4.55, 'workflow.execute'),
  (@org, @content, 'learning_feedback', 'Learning Feedback', 20, 4.55, 'workflow.execute'),
  (@org, @content, 'completed', 'Completed', 22, 4.55, 'workflow.execute')
) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no, weight_percent, required_permission)
ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
WHEN MATCHED THEN UPDATE SET name = source.name, display_order = source.sequence_no, sequence_no = source.sequence_no, weight_percent = source.weight_percent, required_permission = source.required_permission, status = 'active', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'task', 'queued', source.weight_percent, source.required_permission, 'active');
END;
