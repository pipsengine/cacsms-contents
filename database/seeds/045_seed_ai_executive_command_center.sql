DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50045, 'No organization exists for AI Executive Command Center seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');
DECLARE @aiAgents UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM modules WHERE organization_id=@org AND slug='ai-agents');
DECLARE @admin UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM users WHERE organization_id=@org ORDER BY created_at);

DECLARE @perms TABLE(code NVARCHAR(120), description NVARCHAR(255));
INSERT INTO @perms VALUES
('executive_command.view','View AI Executive Command Center'),
('executive_command.view_objectives','View executive strategic objectives'),
('executive_command.view_portfolio','View executive AI portfolio'),
('executive_command.view_initiatives','View executive AI initiatives'),
('executive_command.view_financial','View executive financial metrics'),
('executive_command.view_revenue','View revenue attribution'),
('executive_command.view_risks','View executive risks'),
('executive_command.view_governance','View governance readiness'),
('executive_command.view_security','View security readiness'),
('executive_command.view_investments','View investment planning'),
('executive_command.view_comparisons','View organization and brand comparisons'),
('executive_command.run_scenarios','Request governed executive scenarios'),
('executive_command.run_forecasts','Request governed executive forecasts'),
('executive_command.manage_objectives','Manage executive objectives'),
('executive_command.manage_initiatives','Manage executive initiatives'),
('executive_command.manage_investments','Manage executive investments'),
('executive_command.review_recommendations','Review executive recommendations'),
('executive_command.make_decisions','Record executive decisions'),
('executive_command.generate_reports','Generate executive reports'),
('executive_command.schedule_reports','Schedule executive reports'),
('executive_command.export_board_reports','Export board reports'),
('executive_command.manage_alerts','Manage executive alerts'),
('executive_command.manage_settings','Manage executive command settings');

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
  USING (SELECT @org AS organization_id, @aiAgents AS module_id, 'AI Executive Command Center' AS name, 'executive-command-center' AS slug) AS source
  ON target.organization_id=source.organization_id AND target.module_id=source.module_id AND target.slug=source.slug
  WHEN MATCHED THEN UPDATE SET name=source.name, status='implemented', updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,module_id,name,slug,status,created_by) VALUES (source.organization_id,source.module_id,source.name,source.slug,'implemented',@admin);

  DECLARE @page UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM pages WHERE organization_id=@org AND module_id=@aiAgents AND slug='executive-command-center');
  MERGE routes AS target
  USING (SELECT @org AS organization_id, @page AS page_id, '/dashboard/ai-agents/executive-command-center' AS path, 'GET' AS http_method) AS source
  ON target.organization_id=source.organization_id AND target.path=source.path AND target.http_method=source.http_method
  WHEN MATCHED THEN UPDATE SET page_id=source.page_id, status='operational', required_permission='executive_command.view', updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,page_id,path,http_method,status,created_by,required_permission) VALUES (source.organization_id,source.page_id,source.path,source.http_method,'operational',@admin,'executive_command.view');

  MERGE implementation_linkage_matrix AS target
  USING (SELECT @org AS organization_id, @aiAgents AS module_id, @page AS page_id) AS source
  ON target.organization_id=source.organization_id AND target.module_id=source.module_id AND target.page_id=source.page_id
  WHEN MATCHED THEN UPDATE SET status='implemented', health_percent=100, route_linked=1, component_ready=1, api_linked=1, storage_validated=1, final_output_ready=1, updated_at=SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id,module_id,page_id,status,health_percent,route_linked,component_ready,api_linked,storage_validated,final_output_ready,created_by)
  VALUES (source.organization_id,source.module_id,source.page_id,'implemented',100,1,1,1,1,1,@admin);
END;

MERGE job_queues AS target
USING (SELECT @org organization_id, 'executive-intelligence' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=100, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',100);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('EXECUTIVE_INTELLIGENCE_REFRESH','Executive Intelligence Refresh'),
('EXECUTIVE_OBJECTIVE_MONITORING','Executive Objective Monitoring'),
('EXECUTIVE_PORTFOLIO_REVIEW','Executive Portfolio Review'),
('EXECUTIVE_BUSINESS_VALUE_CALCULATION','Executive Business Value Calculation'),
('EXECUTIVE_ROI_CALCULATION','Executive ROI Calculation'),
('EXECUTIVE_MATURITY_ASSESSMENT','Executive Maturity Assessment'),
('EXECUTIVE_RISK_REVIEW','Executive Risk Review'),
('EXECUTIVE_CAPACITY_FORECAST','Executive Capacity Forecast'),
('EXECUTIVE_INVESTMENT_PLANNING','Executive Investment Planning'),
('EXECUTIVE_SCENARIO_ANALYSIS','Executive Scenario Analysis'),
('EXECUTIVE_RECOMMENDATION_GENERATION','Executive Recommendation Generation'),
('EXECUTIVE_DECISION_PROCESS','Executive Decision Process'),
('EXECUTIVE_REPORT_GENERATION','Executive Report Generation'),
('EXECUTIVE_REPORT_DELIVERY','Executive Report Delivery');

MERGE workflow_definitions AS target
USING (SELECT @org organization_id, code, name, 'executive_command' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);
