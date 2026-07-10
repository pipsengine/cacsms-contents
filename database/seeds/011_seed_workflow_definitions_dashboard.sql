SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
IF @org IS NULL THROW 51000, 'No organization exists for workflow definitions seed.', 1;

DELETE FROM workflow_definition_health WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_definition_dependencies WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_definition_recommendations WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_definition_owners WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_definition_tags WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);
DELETE FROM workflow_documentation WHERE workflow_definition_id IN (SELECT id FROM workflow_definitions WHERE organization_id = @org);

UPDATE workflow_definitions
SET category = CASE
    WHEN code LIKE 'SYSTEM_%' THEN 'System Control'
    WHEN code LIKE '%VALIDATION%' THEN 'System Monitoring'
    WHEN code LIKE '%CONTENT%' AND code LIKE '%APPROVAL%' THEN 'Approval and Governance'
    WHEN code LIKE '%CONTENT%' THEN 'Content Production'
    WHEN code LIKE '%PUBLISH%' THEN 'Publishing'
    WHEN code LIKE '%ANALYTICS%' THEN 'Analytics'
    WHEN code LIKE '%LEARNING%' THEN 'Learning'
    ELSE COALESCE(category, 'Workflow Automation')
  END,
  current_published_version = COALESCE(current_published_version, current_version),
  current_draft_version = COALESCE(current_draft_version, current_version),
  execution_mode = COALESCE(execution_mode, 'autonomous'),
  owner_id = COALESCE(owner_id, 'workflow-engine')
WHERE organization_id = @org;

INSERT INTO workflow_definition_health(workflow_definition_id, health_percent, health_status, recovery_enabled, final_output_ready, analytics_enabled, learning_enabled, permissions_complete, outdated_agents_models)
SELECT wd.id,
  CAST(CASE
    WHEN wd.status IN ('disabled','deprecated','archived') THEN 62
    WHEN COUNT(ws.id) = 0 THEN 45
    WHEN wd.workflow_type IN ('content','publishing','analytics','learning') THEN 94
    ELSE 97
  END AS DECIMAL(8,2)),
  CASE
    WHEN wd.status IN ('disabled','deprecated','archived') THEN 'Disabled'
    WHEN COUNT(ws.id) = 0 THEN 'Invalid'
    WHEN COUNT(CASE WHEN ws.required_permission IS NULL THEN 1 END) > 0 THEN 'Warning'
    ELSE 'Healthy'
  END,
  CASE WHEN wd.workflow_type IN ('content','publishing','analytics','learning') THEN 1 ELSE 1 END,
  CASE WHEN wd.workflow_type IN ('content','publishing','analytics','learning') THEN 1 ELSE CASE WHEN wd.code LIKE 'SYSTEM_%' THEN 1 ELSE 0 END END,
  CASE WHEN wd.workflow_type IN ('content','analytics','learning') THEN 1 ELSE 0 END,
  CASE WHEN wd.workflow_type IN ('content','learning') THEN 1 ELSE 0 END,
  CASE WHEN COUNT(CASE WHEN ws.required_permission IS NULL THEN 1 END) = 0 THEN 1 ELSE 0 END,
  0
FROM workflow_definitions wd
LEFT JOIN workflow_stages ws ON ws.workflow_definition_id = wd.id AND ws.is_deleted = 0
WHERE wd.organization_id = @org
GROUP BY wd.id, wd.status, wd.workflow_type, wd.code;

INSERT INTO workflow_definition_owners(workflow_definition_id, owner_name, owner_team, ownership_role)
SELECT id, COALESCE(owner_id, 'workflow-engine'), CASE
  WHEN category LIKE '%System%' THEN 'Automation Platform'
  WHEN category LIKE '%Content%' THEN 'Content Automation'
  WHEN category LIKE '%Publishing%' THEN 'Publishing Operations'
  WHEN category LIKE '%Analytics%' THEN 'Data Platform'
  ELSE 'Workflow Automation'
END, 'Owner'
FROM workflow_definitions WHERE organization_id = @org;

INSERT INTO workflow_definition_dependencies(workflow_definition_id, dependency_type, dependency_name, dependency_reference, status, required)
SELECT id, 'queue', CASE WHEN workflow_type = 'publishing' THEN 'Publishing Queue' WHEN workflow_type = 'analytics' THEN 'Analytics Queue' ELSE 'Workflow Execution Queue' END, workflow_type, 'healthy', 1
FROM workflow_definitions WHERE organization_id = @org
UNION ALL
SELECT id, 'database', 'MSSQL workflow runtime', 'db_Cacsms-Contents', 'healthy', 1
FROM workflow_definitions WHERE organization_id = @org
UNION ALL
SELECT id, 'event_bus', 'Workflow event stream', 'event-bus://workflow', 'healthy', 1
FROM workflow_definitions WHERE organization_id = @org;

INSERT INTO workflow_definition_recommendations(workflow_definition_id, recommendation_type, title, description, impact, confidence_percent, status)
SELECT wd.id, 'optimization', CONCAT('Review permission coverage for ', wd.name), 'Some stages can be made safer by explicit permission policy and audit metadata.', 'Medium', 82, 'open'
FROM workflow_definitions wd
JOIN workflow_definition_health h ON h.workflow_definition_id = wd.id
WHERE wd.organization_id = @org AND h.permissions_complete = 0
UNION ALL
SELECT wd.id, 'final_output', CONCAT('Add final-output readiness contract for ', wd.name), 'Definition should declare expected output schema, storage, analytics, and learning completion signals.', 'High', 88, 'open'
FROM workflow_definitions wd
JOIN workflow_definition_health h ON h.workflow_definition_id = wd.id
WHERE wd.organization_id = @org AND h.final_output_ready = 0;

INSERT INTO workflow_documentation(workflow_definition_id, documentation_type, title, content_markdown, generated_by)
SELECT id, 'summary', CONCAT(name, ' operational definition'), CONCAT('# ', name, CHAR(10), 'Database-backed autonomous workflow definition used by CACSMS Contents.'), 'workflow-definition-service'
FROM workflow_definitions WHERE organization_id = @org;

INSERT INTO workflow_definition_tags(workflow_definition_id, tag)
SELECT id, 'autonomous' FROM workflow_definitions WHERE organization_id = @org
UNION ALL SELECT id, 'production' FROM workflow_definitions WHERE organization_id = @org
UNION ALL SELECT id, LOWER(REPLACE(COALESCE(workflow_type, 'workflow'), ' ', '-')) FROM workflow_definitions WHERE organization_id = @org;
