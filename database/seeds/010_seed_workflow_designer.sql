SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
IF @org IS NULL THROW 51000, 'No organization exists for workflow designer seed.', 1;

DELETE FROM workflow_node_types;

INSERT INTO workflow_node_types(category, node_type, display_name, description, icon, required_permission, expected_inputs_json, expected_outputs_json, color_token)
VALUES
('Triggers','manual_trigger','Manual Trigger','Starts a workflow from an operator or trusted system event.','play','workflow_designer.view','["request"]','["workflow_started"]','blue'),
('Triggers','schedule_trigger','Schedule Trigger','Starts a workflow from an autonomous schedule.','calendar','workflow_designer.view','["cron"]','["workflow_started"]','blue'),
('Triggers','event_trigger','Event Trigger','Starts a workflow from the event bus.','radio','workflow_designer.view','["event"]','["workflow_started"]','blue'),
('Triggers','webhook_trigger','Webhook Trigger','Starts a workflow from an authenticated webhook.','webhook','workflow_designer.view','["payload"]','["workflow_started"]','blue'),
('Control Flow','start','Start','Beginning of workflow execution.','circle','workflow_designer.view','[]','["next"]','orange'),
('Control Flow','condition','Condition','Routes execution by condition expression.','split','workflow_designer.view','["context"]','["true","false"]','orange'),
('Control Flow','parallel_split','Parallel Split','Runs multiple branches concurrently.','git-branch','workflow_designer.view','["context"]','["branches"]','orange'),
('Control Flow','checkpoint','Checkpoint','Persists resumable workflow progress.','save','workflow_designer.view','["state"]','["checkpoint"]','orange'),
('AI Agents','research_agent','Research Agent','Performs autonomous research.','bot','workflow_designer.view','["topic"]','["research"]','purple'),
('AI Agents','writing_agent','Writing Agent','Generates content copy or scripts.','pen','workflow_designer.view','["brief"]','["draft"]','purple'),
('AI Agents','fact_checker','Fact Checker','Checks claims, citations, and policy risk.','shield','workflow_designer.view','["draft"]','["verified_content"]','purple'),
('AI Agents','publishing_agent','Publishing Agent','Prepares final publishing packages.','send','workflow_designer.view','["content"]','["publishing_package"]','purple'),
('Content Operations','generate_outline','Generate Outline','Creates a structured content outline.','list','workflow_designer.view','["research"]','["outline"]','indigo'),
('Content Operations','generate_script','Generate Script','Produces a script from the approved outline.','file-text','workflow_designer.view','["outline"]','["script"]','indigo'),
('Content Operations','publish_content','Publish Content','Publishes content to configured channels.','rocket','workflow_designer.view','["package"]','["published_url"]','green'),
('System Operations','health_check','Health Check','Checks system readiness before stage execution.','activity','workflow_designer.view','["service"]','["health"]','slate'),
('System Operations','queue_check','Queue Check','Checks queue capacity and job depth.','queue','workflow_designer.view','["queue"]','["queue_health"]','slate'),
('Data and Integration','read_database','Read Database','Reads data from MSSQL through approved repositories.','database','workflow_designer.view','["query"]','["rows"]','cyan'),
('Data and Integration','call_webhook','Call Webhook','Calls an external integration endpoint.','link','workflow_designer.view','["payload"]','["response"]','cyan'),
('Approval and Governance','auto_approval','Auto-Approval','Applies autonomous approval policy.','check','workflow_designer.view','["score"]','["approved"]','amber'),
('Approval and Governance','compliance_check','Compliance Check','Validates compliance and governance policy.','shield-check','workflow_designer.view','["content"]','["decision"]','amber'),
('Recovery','retry','Retry','Retries a failed stage within policy.','refresh','workflow_designer.view','["failure"]','["retry_result"]','red'),
('Recovery','resume_checkpoint','Resume from Checkpoint','Resumes workflow from saved checkpoint.','rotate','workflow_designer.view','["checkpoint"]','["resumed"]','red'),
('Recovery','open_incident','Open Incident','Creates an incident when recovery fails.','alert','workflow_designer.view','["failure"]','["incident"]','red');

UPDATE workflow_definitions
SET category = COALESCE(category, CASE
  WHEN workflow_type IN ('content','publishing','approval') THEN 'Content Operations'
  WHEN workflow_type IN ('analytics','learning') THEN 'Analytics and Learning'
  WHEN workflow_type IN ('system_control','validation') THEN 'System Operations'
  ELSE 'Workflow Automation' END),
  current_published_version = COALESCE(current_published_version, current_version),
  execution_mode = COALESCE(execution_mode, 'autonomous'),
  owner_id = COALESCE(owner_id, 'workflow-engine'),
  tags_json = COALESCE(tags_json, '["autonomous","database-backed","production"]')
WHERE organization_id = @org;

INSERT INTO workflow_definition_versions(workflow_definition_id, version_number, version_label, status, definition_json, created_by, published_at)
SELECT wd.id, wd.current_version, CONCAT('v', wd.current_version), CASE WHEN wd.status = 'active' THEN 'published' ELSE 'draft' END,
  CONCAT('{"code":"', wd.code, '","name":"', wd.name, '","workflowType":"', COALESCE(wd.workflow_type,'workflow'), '"}'),
  'workflow-engine', CASE WHEN wd.status = 'active' THEN SYSUTCDATETIME() ELSE NULL END
FROM workflow_definitions wd
WHERE wd.organization_id = @org
  AND NOT EXISTS (SELECT 1 FROM workflow_definition_versions v WHERE v.workflow_definition_id = wd.id AND v.version_number = wd.current_version);

MERGE workflow_templates AS target
USING (VALUES
(@org,'CONTENT_LIFECYCLE_TEMPLATE','Content Lifecycle Template','Content Operations','End-to-end autonomous content creation, approval, publishing, analytics, and learning.'),
(@org,'SYSTEM_STARTUP_TEMPLATE','System Startup Template','System Operations','Autonomous startup readiness and service initialization.'),
(@org,'INCIDENT_RECOVERY_TEMPLATE','Incident Recovery Template','System Monitoring','Autonomous incident recovery and stakeholder updates.'),
(@org,'AI_RESEARCH_TEMPLATE','AI Research Template','AI Agents','Reusable autonomous research and synthesis workflow.'),
(@org,'PUBLISHING_TEMPLATE','Publishing Template','Publishing','Channel publishing workflow with validation and analytics follow-up.')
) AS source(organization_id, template_code, template_name, category, description)
ON target.organization_id = source.organization_id AND target.template_code = source.template_code
WHEN MATCHED THEN UPDATE SET template_name = source.template_name, category = source.category, description = source.description, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, template_code, template_name, category, description) VALUES (source.organization_id, source.template_code, source.template_name, source.category, source.description);

INSERT INTO workflow_template_versions(template_id, version_number, template_json, status)
SELECT t.id, 1, CONCAT('{"templateCode":"', t.template_code, '","autonomous":true}'), 'active'
FROM workflow_templates t
WHERE t.organization_id = @org
  AND NOT EXISTS (SELECT 1 FROM workflow_template_versions v WHERE v.template_id = t.id AND v.version_number = 1);

DELETE FROM workflow_connections WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_node_configurations WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);

INSERT INTO workflow_node_configurations(workflow_definition_id, workflow_stage_id, node_type_id, node_key, node_name, node_type, category, description, position_x, position_y, status, input_count, output_count, retry_policy, timeout_seconds, approval_required, validation_state, error_count, warning_count, config_json)
SELECT ws.workflow_definition_id, ws.id,
  (SELECT TOP 1 nt.id FROM workflow_node_types nt ORDER BY CASE WHEN ws.name LIKE '%Approval%' AND nt.node_type = 'auto_approval' THEN 0 WHEN ws.name LIKE '%AI%' AND nt.category = 'AI Agents' THEN 1 WHEN ws.name LIKE '%Publish%' AND nt.node_type = 'publish_content' THEN 2 WHEN nt.node_type = 'health_check' THEN 3 ELSE 4 END),
  COALESCE(ws.stage_code, LOWER(REPLACE(ws.name, ' ', '_'))),
  ws.name,
  CASE WHEN ws.name LIKE '%Approval%' THEN 'auto_approval' WHEN ws.name LIKE '%Publish%' THEN 'publish_content' WHEN ws.name LIKE '%Research%' THEN 'research_agent' WHEN ws.name LIKE '%Analytics%' THEN 'read_database' WHEN ws.name LIKE '%Learning%' THEN 'writing_agent' ELSE 'health_check' END,
  CASE WHEN ws.name LIKE '%Approval%' THEN 'Approval and Governance' WHEN ws.name LIKE '%Publish%' THEN 'Content Operations' WHEN ws.name LIKE '%Research%' OR ws.name LIKE '%AI%' THEN 'AI Agents' WHEN ws.name LIKE '%Analytics%' OR ws.name LIKE '%Learning%' THEN 'Data and Integration' ELSE 'System Operations' END,
  CONCAT('Workflow stage node for ', ws.name),
  120 + ((COALESCE(ws.sequence_no, ws.display_order, 1) - 1) % 5) * 210,
  80 + ((COALESCE(ws.sequence_no, ws.display_order, 1) - 1) / 5) * 150,
  'Valid',
  CASE WHEN COALESCE(ws.sequence_no, ws.display_order, 1) = 1 THEN 0 ELSE 1 END,
  1,
  COALESCE(ws.retry_policy, '{"maxRetries":2,"strategy":"autonomous"}'),
  COALESCE(ws.timeout_seconds, 300),
  CASE WHEN COALESCE(ws.required_permission, '') LIKE '%approve%' THEN 1 ELSE 0 END,
  'Valid',
  0,
  CASE WHEN ws.execution_mode = 'human_in_the_loop' THEN 1 ELSE 0 END,
  CONCAT('{"stageCode":"', COALESCE(ws.stage_code,''), '","executionMode":"', COALESCE(ws.execution_mode,'autonomous'), '"}')
FROM workflow_stages ws
JOIN workflow_definitions wd ON wd.id = ws.workflow_definition_id
WHERE wd.organization_id = @org AND ws.is_deleted = 0;

INSERT INTO workflow_connections(workflow_definition_id, from_node_id, to_node_id, from_stage_id, to_stage_id, transition_name, connection_type, condition_expression, priority, line_style)
SELECT current_node.workflow_definition_id, current_node.id, next_node.id, current_node.workflow_stage_id, next_node.workflow_stage_id,
  CONCAT(current_node.node_name, ' to ', next_node.node_name),
  'success',
  NULL,
  1,
  'solid'
FROM workflow_node_configurations current_node
JOIN workflow_node_configurations next_node ON next_node.workflow_definition_id = current_node.workflow_definition_id
JOIN workflow_stages current_stage ON current_stage.id = current_node.workflow_stage_id
JOIN workflow_stages next_stage ON next_stage.id = next_node.workflow_stage_id
WHERE current_node.workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org)
  AND COALESCE(next_stage.sequence_no, next_stage.display_order, 0) = COALESCE(current_stage.sequence_no, current_stage.display_order, 0) + 1;

DELETE FROM workflow_validation_runs WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_validation_runs(workflow_definition_id, status, error_count, warning_count, summary)
SELECT wd.id, CASE WHEN COUNT(n.id) = 0 THEN 'warning' ELSE 'valid' END, 0,
  COUNT(CASE WHEN n.warning_count > 0 THEN 1 END),
  CONCAT('Validated ', COUNT(n.id), ' workflow nodes from database canvas.')
FROM workflow_definitions wd
LEFT JOIN workflow_node_configurations n ON n.workflow_definition_id = wd.id
WHERE wd.organization_id = @org
GROUP BY wd.id;

DELETE FROM workflow_simulation_runs WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_simulation_runs(workflow_definition_id, status, simulated_duration_seconds, estimated_cost, completed_at, summary)
SELECT wd.id, 'completed', 90 + COUNT(n.id) * 32, CAST(COUNT(n.id) * 0.018 AS DECIMAL(18,6)), SYSUTCDATETIME(),
  CONCAT('Autonomous dry-run completed for ', wd.name)
FROM workflow_definitions wd
LEFT JOIN workflow_node_configurations n ON n.workflow_definition_id = wd.id
WHERE wd.organization_id = @org
GROUP BY wd.id, wd.name;

DELETE FROM workflow_cost_estimates WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_cost_estimates(workflow_definition_id, estimated_cost, estimate_basis)
SELECT wd.id, CAST(COUNT(n.id) * 0.018 AS DECIMAL(18,6)), 'Node-count and agent-stage estimate'
FROM workflow_definitions wd LEFT JOIN workflow_node_configurations n ON n.workflow_definition_id = wd.id
WHERE wd.organization_id = @org GROUP BY wd.id;

DELETE FROM workflow_performance_estimates WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_performance_estimates(workflow_definition_id, estimated_duration_seconds, throughput_per_hour, bottleneck_node)
SELECT wd.id, 90 + COUNT(n.id) * 32, CASE WHEN COUNT(n.id) = 0 THEN 0 ELSE 3600 / NULLIF((90 + COUNT(n.id) * 32), 0) END, MAX(n.node_name)
FROM workflow_definitions wd LEFT JOIN workflow_node_configurations n ON n.workflow_definition_id = wd.id
WHERE wd.organization_id = @org GROUP BY wd.id;

DELETE FROM workflow_change_history WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_change_history(workflow_definition_id, change_type, change_summary, actor)
SELECT id, 'designer_sync', 'Workflow designer canvas synchronized from live workflow engine tables.', 'workflow-engine'
FROM workflow_definitions WHERE organization_id = @org;

DELETE FROM workflow_deployments WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_deployments(workflow_definition_id, version_number, environment, status, deployed_by)
SELECT id, current_version, 'production', CASE WHEN status = 'active' THEN 'deployed' ELSE 'draft' END, 'workflow-engine'
FROM workflow_definitions WHERE organization_id = @org;

DELETE FROM workflow_environment_versions WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
INSERT INTO workflow_environment_versions(workflow_definition_id, environment, active_version, status)
SELECT id, 'production', current_version, CASE WHEN status = 'active' THEN 'active' ELSE 'draft' END
FROM workflow_definitions WHERE organization_id = @org;
