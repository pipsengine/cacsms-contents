DECLARE @org_id UNIQUEIDENTIFIER;
DECLARE @admin_id UNIQUEIDENTIFIER;
DECLARE @system_monitoring_id UNIQUEIDENTIFIER;
DECLARE @section_id UNIQUEIDENTIFIER;

IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'ai-media-group')
BEGIN
  INSERT INTO organizations(name, slug, status) VALUES ('AI Media Group', 'ai-media-group', 'operational');
END;

SELECT @org_id = id FROM organizations WHERE slug = 'ai-media-group';

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'system.admin@cacsms.local')
BEGIN
  INSERT INTO users(organization_id, full_name, email, status)
  VALUES (@org_id, 'System Administrator', 'system.admin@cacsms.local', 'active');
END;

SELECT @admin_id = id FROM users WHERE email = 'system.admin@cacsms.local';

IF NOT EXISTS (SELECT 1 FROM roles WHERE organization_id = @org_id AND code = 'super_admin')
BEGIN
  INSERT INTO roles(organization_id, name, code, created_by) VALUES (@org_id, 'Super Admin', 'super_admin', @admin_id);
END;

DECLARE @modules TABLE(name NVARCHAR(160), slug NVARCHAR(120), sort_order INT);
INSERT INTO @modules(name, slug, sort_order) VALUES
('Executive Office','executive-office',1),('Organization Management','organization-management',2),('Brand Management','brand-management',3),('Channel Management','channel-management',4),
('AI Research Intelligence','research-intelligence',5),('Content Strategy','content-strategy',6),('Content Production','content-production',7),('Creative Studio','creative-studio',8),('Video Studio','video-studio',9),('Audio & Voice Studio','audio-voice-studio',10),
('SEO Intelligence','seo-intelligence',11),('Publishing Center','publishing-center',12),('Marketing Automation','marketing-automation',13),('Community Management','community-management',14),('Monetization Center','monetization-center',15),
('Analytics & Intelligence','analytics-intelligence',16),('AI Learning Center','ai-learning-center',17),('AI Agents','ai-agents',18),('Workflow Automation','workflow-automation',19),('Digital Asset Management','digital-asset-management',20),
('Knowledge Hub','knowledge-hub',21),('Integrations','integrations',22),('Notifications','notifications',23),('Reports','reports',24),('Compliance & Governance','compliance-governance',25),('Security Center','security-center',26),
('Administration','administration',27),('Developer Center','developer-center',28),('System Monitoring','system-monitoring',29),('Help & Support','help-support',30);

MERGE modules AS target
USING @modules AS source
ON target.organization_id = @org_id AND target.slug = source.slug
WHEN NOT MATCHED THEN
  INSERT (organization_id, name, slug, display_order, created_by)
  VALUES (@org_id, source.name, source.slug, source.sort_order, @admin_id);

SELECT @system_monitoring_id = id FROM modules WHERE organization_id = @org_id AND slug = 'system-monitoring';

DECLARE @pages TABLE(name NVARCHAR(160), slug NVARCHAR(120), route_path NVARCHAR(300), sort_order INT);
INSERT INTO @pages(name, slug, route_path, sort_order) VALUES
('Workflow Status','workflow-status','/dashboard/system-monitoring/workflow-status',1),
('Implementation Status','implementation-status','/dashboard/system-monitoring/implementation-status',2),
('Service Health','service-health','/dashboard/system-monitoring/service-health',3),
('API Status','api-status','/dashboard/system-monitoring/api-status',4),
('Background Jobs','background-jobs','/dashboard/system-monitoring/background-jobs',5),
('Uptime Monitoring','uptime-monitoring','/dashboard/system-monitoring/uptime-monitoring',6),
('Logs','logs','/dashboard/system-monitoring/logs',7),
('Incident Management','incident-management','/dashboard/system-monitoring/incident-management',8);

MERGE pages AS target
USING @pages AS source
ON target.organization_id = @org_id AND target.module_id = @system_monitoring_id AND target.slug = source.slug
WHEN NOT MATCHED THEN
  INSERT (organization_id, module_id, name, slug, status, created_by)
  VALUES (@org_id, @system_monitoring_id, source.name, source.slug, 'completed', @admin_id);

MERGE routes AS target
USING (
  SELECT p.id AS page_id, pg.route_path
  FROM @pages pg
  JOIN pages p ON p.organization_id = @org_id AND p.module_id = @system_monitoring_id AND p.slug = pg.slug
) AS source
ON target.organization_id = @org_id AND target.path = source.route_path AND target.http_method = 'GET'
WHEN NOT MATCHED THEN
  INSERT (organization_id, page_id, path, http_method, status, created_by)
  VALUES (@org_id, source.page_id, source.route_path, 'GET', 'operational', @admin_id);

IF NOT EXISTS (SELECT 1 FROM sidebar_sections WHERE organization_id = @org_id AND title = 'Governance & Operations')
BEGIN
  INSERT INTO sidebar_sections(organization_id, title, display_order) VALUES (@org_id, 'Governance & Operations', 6);
END;
SELECT @section_id = id FROM sidebar_sections WHERE organization_id = @org_id AND title = 'Governance & Operations';

MERGE sidebar_items AS target
USING (
  SELECT @org_id AS organization_id, @section_id AS sidebar_section_id, @system_monitoring_id AS module_id,
         CAST(NULL AS UNIQUEIDENTIFIER) AS page_id, 'System Monitoring' AS title, '/system-monitoring' AS href, 'Monitor' AS icon, 7 AS display_order
) AS source
ON target.organization_id = source.organization_id AND target.href = source.href
WHEN NOT MATCHED THEN
  INSERT (organization_id, sidebar_section_id, module_id, page_id, title, href, icon, display_order)
  VALUES (source.organization_id, source.sidebar_section_id, source.module_id, source.page_id, source.title, source.href, source.icon, source.display_order);

DECLARE @sidebar_map TABLE(section_title NVARCHAR(120), module_slug NVARCHAR(120), sort_order INT);
INSERT INTO @sidebar_map(section_title, module_slug, sort_order) VALUES
('Command Center','executive-office',1),('Command Center','organization-management',2),('Command Center','brand-management',3),('Command Center','channel-management',4),
('Content Intelligence','research-intelligence',1),('Content Intelligence','content-strategy',2),('Content Intelligence','seo-intelligence',3),('Content Intelligence','analytics-intelligence',4),('Content Intelligence','ai-learning-center',5),
('Production Studios','content-production',1),('Production Studios','creative-studio',2),('Production Studios','video-studio',3),('Production Studios','audio-voice-studio',4),('Production Studios','digital-asset-management',5),
('Distribution & Growth','publishing-center',1),('Distribution & Growth','marketing-automation',2),('Distribution & Growth','community-management',3),('Distribution & Growth','monetization-center',4),
('Automation & Agents','ai-agents',1),('Automation & Agents','workflow-automation',2),('Automation & Agents','knowledge-hub',3),('Automation & Agents','integrations',4),
('Governance & Operations','notifications',1),('Governance & Operations','reports',2),('Governance & Operations','compliance-governance',3),('Governance & Operations','security-center',4),('Governance & Operations','administration',5),('Governance & Operations','developer-center',6),('Governance & Operations','system-monitoring',7),('Governance & Operations','help-support',8);

MERGE sidebar_sections AS target
USING (SELECT DISTINCT @org_id AS organization_id, section_title FROM @sidebar_map) AS source
ON target.organization_id = source.organization_id AND target.title = source.section_title
WHEN NOT MATCHED THEN
  INSERT (organization_id, title, display_order)
  VALUES (source.organization_id, source.section_title,
    CASE source.section_title
      WHEN 'Command Center' THEN 1
      WHEN 'Content Intelligence' THEN 2
      WHEN 'Production Studios' THEN 3
      WHEN 'Distribution & Growth' THEN 4
      WHEN 'Automation & Agents' THEN 5
      ELSE 6
    END);

MERGE sidebar_items AS target
USING (
  SELECT @org_id AS organization_id, ss.id AS sidebar_section_id, m.id AS module_id, m.name AS title,
         CASE WHEN m.slug = 'system-monitoring' THEN '/system-monitoring' ELSE '/' + m.slug END AS href,
         m.display_order AS display_order
  FROM @sidebar_map sm
  JOIN sidebar_sections ss ON ss.organization_id = @org_id AND ss.title = sm.section_title
  JOIN modules m ON m.organization_id = @org_id AND m.slug = sm.module_slug
) AS source
ON target.organization_id = source.organization_id AND target.module_id = source.module_id AND target.href = source.href
WHEN NOT MATCHED THEN
  INSERT (organization_id, sidebar_section_id, module_id, title, href, display_order)
  VALUES (source.organization_id, source.sidebar_section_id, source.module_id, source.title, source.href, source.display_order);

MERGE implementation_linkage_matrix AS target
USING (
  SELECT p.id AS page_id, p.module_id, p.name
  FROM pages p
  WHERE p.organization_id = @org_id AND p.slug IN ('workflow-status','implementation-status','service-health','api-status','background-jobs')
) AS source
ON target.organization_id = @org_id AND target.page_id = source.page_id
WHEN NOT MATCHED THEN
  INSERT (organization_id, module_id, page_id, status, health_percent, route_linked, component_ready, api_linked, storage_validated, final_output_ready, created_by)
  VALUES (@org_id, source.module_id, source.page_id, 'in_progress', 92, 1, 1, 1, 0, 0, @admin_id);

DECLARE @services TABLE(name NVARCHAR(160), status NVARCHAR(40), health DECIMAL(5,2), latency INT);
INSERT INTO @services VALUES
('Web App','operational',99,74),('API Gateway','operational',99,82),('Database','operational',99,18),('AI Orchestrator','degraded',84,241),('Workflow Engine','operational',97,116),
('Scheduler','running',93,190),('Render Engine','degraded',78,420),('Analytics Engine','operational',94,133),('Notification Service','operational',95,91),('Publishing Engine','operational',93,147);
MERGE system_services AS target
USING @services AS source
ON target.organization_id = @org_id AND target.name = source.name
WHEN NOT MATCHED THEN
  INSERT (organization_id, name, status, health_percent, latency_ms, last_checked_at, created_by)
  VALUES (@org_id, source.name, source.status, source.health, source.latency, SYSUTCDATETIME(), @admin_id);

DECLARE @apis TABLE(api_group NVARCHAR(120), endpoint NVARCHAR(300), method NVARCHAR(10));
INSERT INTO @apis VALUES
('Core','/api/health','GET'),('Navigation','/api/navigation','GET'),('Monitoring','/api/system-monitoring/implementation-status','GET'),('Monitoring','/api/system-monitoring/service-health','GET'),
('Monitoring','/api/system-monitoring/api-status','GET'),('Monitoring','/api/system-monitoring/background-jobs','GET');
MERGE api_endpoints AS target
USING @apis AS source
ON target.organization_id = @org_id AND target.endpoint = source.endpoint AND target.http_method = source.method
WHEN NOT MATCHED THEN
  INSERT (organization_id, api_group, endpoint, http_method, status, health_percent, avg_latency_ms, error_rate, created_by)
  VALUES (@org_id, source.api_group, source.endpoint, source.method, 'operational', 98, 128, 0.12, @admin_id);

DECLARE @queues TABLE(name NVARCHAR(160), health DECIMAL(5,2));
INSERT INTO @queues VALUES ('AI Generation Queue',96),('Video Rendering Queue',84),('Publishing Queue',93),('Analytics Queue',98),('Notification Queue',99),('Learning Queue',91),('Workflow Queue',97);
MERGE job_queues AS target
USING @queues AS source
ON target.organization_id = @org_id AND target.name = source.name
WHEN NOT MATCHED THEN
  INSERT (organization_id, name, status, health_percent, created_by)
  VALUES (@org_id, source.name, 'running', source.health, @admin_id);

IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'seed_version')
BEGIN
  INSERT INTO system_settings(organization_id, setting_key, setting_value, value_type, created_by)
  VALUES (@org_id, 'seed_version', '001_seed_core_data', 'string', @admin_id);
END;
