DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50044, 'No organization exists for Agent Operations Center seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');
DECLARE @aiAgents UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM modules WHERE organization_id=@org AND slug='ai-agents');
DECLARE @admin UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM users WHERE organization_id=@org ORDER BY created_at);

DECLARE @perms TABLE(code NVARCHAR(120), description NVARCHAR(255));
INSERT INTO @perms VALUES
('operations.view','View Agent Operations Center'),
('operations.manage','Manage governed operations workflows'),
('operations.restart','Request governed worker restart'),
('operations.emergency','Request emergency global operations stop');

MERGE permissions AS target
USING (SELECT code, description FROM @perms) AS source
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

IF @adminRole IS NOT NULL
INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id
FROM permissions p JOIN @perms x ON x.code=p.code
WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

IF @aiAgents IS NOT NULL
BEGIN
  MERGE pages AS target
  USING (SELECT @org AS organization_id, @aiAgents AS module_id, 'Agent Operations Center' AS name, 'operations-center' AS slug) AS source
  ON target.organization_id=source.organization_id AND target.module_id=source.module_id AND target.slug=source.slug
  WHEN MATCHED THEN UPDATE SET name=source.name, status='implemented', updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,module_id,name,slug,status,created_by) VALUES (source.organization_id,source.module_id,source.name,source.slug,'implemented',@admin);

  DECLARE @page UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM pages WHERE organization_id=@org AND module_id=@aiAgents AND slug='operations-center');
  MERGE routes AS target
  USING (SELECT @org AS organization_id, @page AS page_id, '/dashboard/ai-agents/operations-center' AS path, 'GET' AS http_method) AS source
  ON target.organization_id=source.organization_id AND target.path=source.path AND target.http_method=source.http_method
  WHEN MATCHED THEN UPDATE SET page_id=source.page_id, status='operational', required_permission='operations.view', updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,page_id,path,http_method,status,created_by,required_permission) VALUES (source.organization_id,source.page_id,source.path,source.http_method,'operational',@admin,'operations.view');

  MERGE implementation_linkage_matrix AS target
  USING (SELECT @org AS organization_id, @aiAgents AS module_id, @page AS page_id) AS source
  ON target.organization_id=source.organization_id AND target.module_id=source.module_id AND target.page_id=source.page_id
  WHEN MATCHED THEN UPDATE SET status='implemented', health_percent=100, route_linked=1, component_ready=1, api_linked=1, storage_validated=1, final_output_ready=1, updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,module_id,page_id,status,health_percent,route_linked,component_ready,api_linked,storage_validated,final_output_ready,created_by)
  VALUES (source.organization_id,source.module_id,source.page_id,'implemented',100,1,1,1,1,1,@admin);
END;

MERGE job_queues AS target
USING (SELECT @org organization_id, 'operations-center' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=100, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',100);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('OPERATIONS_HEALTH_MONITOR','Operations Health Monitor'),
('OPERATIONS_QUEUE_SUPERVISION','Operations Queue Supervision'),
('OPERATIONS_WORKER_RECOVERY','Operations Worker Recovery'),
('OPERATIONS_SECURITY_ESCALATION','Operations Security Escalation'),
('OPERATIONS_GOVERNANCE_ESCALATION','Operations Governance Escalation'),
('OPERATIONS_REPORT_EXPORT','Operations Report Export');

MERGE workflow_definitions AS target
USING (SELECT @org organization_id, code, name, 'operations_center' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);
