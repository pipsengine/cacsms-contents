IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '005_uptime_monitoring')
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE((SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'), (SELECT TOP 1 id FROM organizations ORDER BY created_at));
DECLARE @admin UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM users WHERE organization_id = @org ORDER BY created_at);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');
DECLARE @systemMonitoring UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM modules WHERE organization_id = @org AND slug = 'system-monitoring');

MERGE permissions AS target
USING (VALUES
  ('uptime_monitoring.view','View uptime monitoring'),
  ('uptime_monitoring.create','Create uptime monitors'),
  ('uptime_monitoring.edit','Edit uptime monitors'),
  ('uptime_monitoring.run_check','Run uptime checks'),
  ('uptime_monitoring.pause','Pause uptime monitoring'),
  ('uptime_monitoring.resume','Resume uptime monitoring'),
  ('uptime_monitoring.configure','Configure uptime monitoring'),
  ('uptime_monitoring.export','Export uptime reports'),
  ('uptime_monitoring.manage_sla','Manage uptime SLA policies'),
  ('uptime_monitoring.schedule_maintenance','Schedule uptime maintenance'),
  ('uptime_monitoring.manage_incidents','Manage uptime incidents')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id
FROM permissions p
WHERE @adminRole IS NOT NULL
  AND p.code LIKE 'uptime_monitoring.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id);

IF @systemMonitoring IS NOT NULL
BEGIN
  MERGE pages AS target
  USING (SELECT @org AS organization_id, @systemMonitoring AS module_id, 'Uptime Monitoring' AS name, 'uptime-monitoring' AS slug, '/dashboard/system-monitoring/uptime-monitoring' AS route_path) AS source
  ON target.organization_id = source.organization_id AND target.module_id = source.module_id AND target.slug = source.slug
  WHEN MATCHED THEN UPDATE SET name = source.name, status = 'completed', updated_at = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id, module_id, name, slug, status, created_by)
  VALUES (source.organization_id, source.module_id, source.name, source.slug, 'completed', @admin);

  MERGE routes AS target
  USING (
    SELECT @org AS organization_id, p.id AS page_id, '/dashboard/system-monitoring/uptime-monitoring' AS path
    FROM pages p WHERE p.organization_id = @org AND p.module_id = @systemMonitoring AND p.slug = 'uptime-monitoring'
  ) AS source
  ON target.organization_id = source.organization_id AND target.path = source.path AND target.http_method = 'GET'
  WHEN NOT MATCHED THEN INSERT (organization_id, page_id, path, http_method, status, created_by)
  VALUES (source.organization_id, source.page_id, source.path, 'GET', 'operational', @admin);
END;

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'uptime-monitoring' AS name) AS source
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent, created_by)
VALUES (source.organization_id, source.name, 'running', 100, @admin);

DECLARE @monitors TABLE(name NVARCHAR(180), type NVARCHAR(80), category NVARCHAR(120), endpoint NVARCHAR(500), region NVARCHAR(120), status NVARCHAR(40), uptime24 DECIMAL(8,4), uptime7 DECIMAL(8,4), uptime30 DECIMAL(8,4), responseMs INT, outageMinutes INT, owner NVARCHAR(160), frequency INT);
INSERT INTO @monitors VALUES
('Web Application','HTTP','Application','https://app.cacsms.local/health','West Africa','Operational',99.9900,99.9800,99.9600,74,0,'Platform Operations',60),
('API Gateway','API','API','https://api.cacsms.local/health','West Africa','Operational',99.9800,99.9700,99.9500,82,0,'Platform Operations',60),
('Authentication Service','API','Security','/api/v1/auth/me','Europe','Operational',99.9600,99.9200,99.9100,116,2,'Security Operations',60),
('MSSQL Database','Database','Database','mssql://db_Cacsms-Contents','West Africa','Operational',99.9900,99.9900,99.9800,18,0,'Database Operations',30),
('Redis Cache','TCP','Cache','redis://cache:6379','West Africa','Maintenance',99.9000,99.8700,99.8200,42,4,'Platform Operations',30),
('Queue Manager','Queue','Queue','queue://workflow-execution','West Africa','Operational',99.9500,99.9300,99.9000,96,3,'Workflow Operations',45),
('Workflow Engine','Internal Service','Workflow','workflow://engine','West Africa','Operational',99.9700,99.9500,99.9300,104,1,'Workflow Operations',45),
('AI Orchestrator','Internal Service','AI','ai://orchestrator','West Africa','Operational',99.9400,99.9100,99.8600,128,5,'AI Operations',60),
('AI Provider Gateway','AI Provider','AI','ai://providers','Europe','Degraded',99.7000,99.4500,99.1200,310,16,'AI Operations',60),
('Research Agents','Worker','AI Agents','worker://research-agents','North America','Operational',99.9600,99.9300,99.8900,140,1,'AI Operations',120),
('Writing Agents','Worker','AI Agents','worker://writing-agents','West Africa','Operational',99.9500,99.9200,99.8800,134,2,'AI Operations',120),
('Creative Agents','Worker','AI Agents','worker://creative-agents','Europe','Degraded',99.6200,99.4100,99.0600,428,21,'Creative Operations',120),
('Voice Service','AI Provider','Media','voice://tts','Europe','Operational',99.9100,99.8800,99.7400,206,6,'Audio Operations',120),
('Video Render Engine','Worker','Media','render://video','North America','Partial Outage',98.9000,98.6000,98.1200,860,52,'Video Operations',120),
('Publishing Engine','Internal Service','Publishing','publishing://engine','West Africa','Operational',99.9300,99.9100,99.8700,147,2,'Publishing Operations',60),
('Analytics Engine','Internal Service','Analytics','analytics://engine','West Africa','Operational',99.9600,99.9300,99.9000,133,1,'Analytics Operations',120),
('Notification Service','Internal Service','Notifications','notifications://service','West Africa','Operational',99.9500,99.9300,99.8900,91,2,'Platform Operations',60),
('Object Storage','Storage','Storage','storage://assets','Europe','Operational',99.9800,99.9700,99.9400,65,0,'Storage Operations',60),
('Vector Database','Database','Retrieval','vector://knowledge','North America','Operational',99.9000,99.8500,99.7000,176,8,'AI Operations',120),
('YouTube API','External Integration','Social API','https://youtube.googleapis.com','North America','Operational',99.9400,99.9000,99.8400,244,3,'Publishing Operations',180),
('Facebook API','External Integration','Social API','https://graph.facebook.com','Europe','Operational',99.8900,99.8200,99.6200,262,9,'Publishing Operations',180),
('TikTok API','External Integration','Social API','https://open.tiktokapis.com','Asia Pacific','Major Outage',96.2000,97.1000,98.4000,1240,180,'Publishing Operations',180),
('Instagram API','External Integration','Social API','https://graph.instagram.com','Europe','Operational',99.8800,99.8000,99.6100,288,10,'Publishing Operations',180),
('LinkedIn API','External Integration','Social API','https://api.linkedin.com','North America','Operational',99.9200,99.8600,99.7400,232,6,'Publishing Operations',180),
('Email Service','External Integration','Email','smtp://mailer','West Africa','Operational',99.9700,99.9500,99.9000,119,1,'Notification Operations',120),
('Payment Gateway','External Integration','Payments','https://payments.cacsms.local/health','Europe','Paused',99.8000,99.7400,99.6000,180,12,'Revenue Operations',300);

MERGE uptime_monitors AS target
USING @monitors AS source
ON target.organization_id = @org AND target.name = source.name
WHEN MATCHED THEN UPDATE SET monitor_type = source.type, service_category = source.category, endpoint_resource = source.endpoint, region = source.region, status = source.status, uptime_24h = source.uptime24, uptime_7d = source.uptime7, uptime_30d = source.uptime30, response_time_ms = source.responseMs, downtime_minutes = source.outageMinutes, check_frequency_seconds = source.frequency, owner = source.owner, last_checked_at = DATEADD(minute, -ABS(CHECKSUM(source.name)) % 20, SYSUTCDATETIME()), updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, name, description, monitor_type, service_category, endpoint_resource, http_method, expected_status_code, region, status, uptime_24h, uptime_7d, uptime_30d, response_time_ms, last_outage_at, downtime_minutes, check_frequency_seconds, sla_target, owner, alert_policy, last_checked_at)
VALUES (@org, source.name, CONCAT(source.name, ' availability monitor'), source.type, source.category, source.endpoint, 'GET', 200, source.region, source.status, source.uptime24, source.uptime7, source.uptime30, source.responseMs, CASE WHEN source.outageMinutes > 0 THEN DATEADD(day, -ABS(CHECKSUM(source.name)) % 12, SYSUTCDATETIME()) ELSE NULL END, source.outageMinutes, source.frequency, 99.9000, source.owner, 'Operations escalation', DATEADD(minute, -ABS(CHECKSUM(source.name)) % 20, SYSUTCDATETIME()));

DECLARE @regions TABLE(region NVARCHAR(120), availability DECIMAL(8,4), latency INT, failed INT, degraded INT, status NVARCHAR(40));
INSERT INTO @regions VALUES
('West Africa',99.9600,118,3,1,'Operational'),('Europe',99.8800,164,6,2,'Degraded'),('North America',99.9200,146,4,1,'Operational'),('Asia Pacific',98.7600,324,12,3,'Degraded'),('Middle East',99.8100,212,5,1,'Operational'),('South America',99.7400,238,7,1,'Operational');

DELETE FROM uptime_monitor_regions WHERE monitor_id IN (SELECT id FROM uptime_monitors WHERE organization_id = @org);
INSERT INTO uptime_monitor_regions(monitor_id, region, availability_percent, avg_latency_ms, failed_checks, degraded_services, last_incident_at, health_status)
SELECT m.id, r.region, r.availability, r.latency, r.failed, r.degraded, DATEADD(day, -r.failed, SYSUTCDATETIME()), r.status
FROM uptime_monitors m CROSS JOIN @regions r
WHERE m.organization_id = @org AND m.name IN ('Web Application','API Gateway','AI Orchestrator','Publishing Engine');

MERGE uptime_sla_policies AS target
USING (SELECT id AS monitor_id, sla_target, CASE WHEN sla_target >= 99.95 THEN 22 ELSE 43 END AS allowed_minutes, owner FROM uptime_monitors WHERE organization_id = @org) AS source
ON target.monitor_id = source.monitor_id
WHEN MATCHED THEN UPDATE SET sla_target = source.sla_target, allowed_downtime_minutes = source.allowed_minutes, owner = source.owner, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (monitor_id, sla_target, allowed_downtime_minutes, owner)
VALUES (source.monitor_id, source.sla_target, source.allowed_minutes, source.owner);

MERGE uptime_sla_results AS target
USING (
  SELECT id AS monitor_id, CAST(DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(GETUTCDATE()), 1) AS DATE) AS period_start, CAST(EOMONTH(GETUTCDATE()) AS DATE) AS period_end, uptime_30d AS actual_uptime, downtime_minutes AS actual_downtime, CASE WHEN downtime_minutes > 43 THEN 0 ELSE 43 - downtime_minutes END AS remaining_allowance, CASE WHEN uptime_30d >= sla_target THEN 'Compliant' WHEN uptime_30d >= sla_target - 0.2 THEN 'At Risk' ELSE 'Breached' END AS breach_status, CASE WHEN uptime_30d >= sla_target THEN 'Low' WHEN uptime_30d >= sla_target - 0.2 THEN 'Medium' ELSE 'High' END AS current_risk
  FROM uptime_monitors WHERE organization_id = @org
) AS source
ON target.monitor_id = source.monitor_id AND target.period_start = source.period_start
WHEN MATCHED THEN UPDATE SET actual_uptime = source.actual_uptime, actual_downtime_minutes = source.actual_downtime, remaining_allowance_minutes = source.remaining_allowance, breach_status = source.breach_status, current_risk = source.current_risk
WHEN NOT MATCHED THEN INSERT (monitor_id, period_start, period_end, actual_uptime, actual_downtime_minutes, remaining_allowance_minutes, breach_status, current_risk)
VALUES (source.monitor_id, source.period_start, source.period_end, source.actual_uptime, source.actual_downtime, source.remaining_allowance, source.breach_status, source.current_risk);

DELETE FROM monitor_status_history WHERE monitor_id IN (SELECT id FROM uptime_monitors WHERE organization_id = @org);
INSERT INTO monitor_status_history(monitor_id, status, started_at, ended_at, response_time_ms, incident_reference, error_message)
SELECT m.id, v.status, DATEADD(hour, -v.block_no, SYSUTCDATETIME()), DATEADD(hour, -v.block_no + 1, SYSUTCDATETIME()), m.response_time_ms + (v.block_no % 5) * 8,
       CASE WHEN v.status IN ('Major Outage','Partial Outage') THEN CONCAT('INC-', RIGHT(CONVERT(nvarchar(36), m.id), 4)) ELSE NULL END,
       CASE WHEN v.status IN ('Major Outage','Partial Outage') THEN 'Availability check failed during seeded monitoring window' ELSE NULL END
FROM uptime_monitors m
CROSS APPLY (VALUES
(24, CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN m.status ELSE 'Operational' END),(23,'Operational'),(22,'Operational'),(21,'Operational'),(20,'Operational'),(19,'Operational'),(18, CASE WHEN m.status = 'Degraded' THEN 'Degraded' ELSE 'Operational' END),(17,'Operational'),(16,'Operational'),(15,'Operational'),(14,'Operational'),(13,'Operational'),(12, CASE WHEN m.status = 'Maintenance' THEN 'Maintenance' ELSE 'Operational' END),(11,'Operational'),(10,'Operational'),(9,'Operational'),(8,'Operational'),(7,'Operational'),(6,'Operational'),(5,'Operational'),(4,'Operational'),(3,'Operational'),(2,'Operational'),(1,m.status)
) v(block_no, status)
WHERE m.organization_id = @org;

DELETE FROM uptime_incidents WHERE organization_id = @org;
INSERT INTO uptime_incidents(organization_id, monitor_id, incident_key, severity, status, started_at, resolved_at, duration_minutes, root_cause, user_impact, sla_impact, assigned_team, postmortem_status)
SELECT TOP 8 @org, m.id, CONCAT('UP-', FORMAT(ROW_NUMBER() OVER (ORDER BY m.downtime_minutes DESC), '0000')),
  CASE WHEN m.status = 'Major Outage' THEN 'Critical' WHEN m.status = 'Partial Outage' THEN 'High' WHEN m.status = 'Degraded' THEN 'Medium' ELSE 'Low' END,
  CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN 'Open' ELSE 'Resolved' END,
  DATEADD(hour, -ROW_NUMBER() OVER (ORDER BY m.downtime_minutes DESC) * 9, SYSUTCDATETIME()),
  CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN NULL ELSE DATEADD(hour, -ROW_NUMBER() OVER (ORDER BY m.downtime_minutes DESC) * 9 + 1, SYSUTCDATETIME()) END,
  m.downtime_minutes,
  CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN 'External provider availability degradation' ELSE 'Transient latency spike' END,
  CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN 'Publishing and render operations delayed' ELSE 'Limited retry latency observed' END,
  CASE WHEN m.uptime_30d < m.sla_target THEN 'SLA impacted' ELSE 'No SLA impact' END,
  m.owner,
  CASE WHEN m.status IN ('Major Outage','Partial Outage') THEN 'Required' ELSE 'Complete' END
FROM uptime_monitors m WHERE m.organization_id = @org AND m.downtime_minutes > 0 ORDER BY m.downtime_minutes DESC;

DELETE FROM maintenance_services WHERE maintenance_window_id IN (SELECT id FROM maintenance_windows WHERE organization_id = @org);
DELETE FROM maintenance_windows WHERE organization_id = @org;
INSERT INTO maintenance_windows(organization_id, title, start_time, end_time, expected_impact, owner, approval_status, notification_status, current_state)
VALUES
(@org, 'Redis cache rolling maintenance', DATEADD(hour, 6, SYSUTCDATETIME()), DATEADD(hour, 8, SYSUTCDATETIME()), 'Brief cache miss increase', 'Platform Operations', 'Approved', 'Sent', 'Upcoming'),
(@org, 'Video render engine patch', DATEADD(hour, -2, SYSUTCDATETIME()), DATEADD(hour, 1, SYSUTCDATETIME()), 'Render jobs may queue for retry', 'Video Operations', 'Approved', 'Sent', 'Active'),
(@org, 'Analytics warehouse maintenance', DATEADD(day, -3, SYSUTCDATETIME()), DATEADD(day, -3, DATEADD(hour, 2, SYSUTCDATETIME())), 'Analytics refresh delayed', 'Analytics Operations', 'Approved', 'Sent', 'Completed');

INSERT INTO maintenance_services(maintenance_window_id, monitor_id)
SELECT mw.id, m.id
FROM maintenance_windows mw
JOIN uptime_monitors m ON m.organization_id = mw.organization_id
WHERE mw.organization_id = @org
  AND ((mw.title LIKE '%Redis%' AND m.name = 'Redis Cache') OR (mw.title LIKE '%Video%' AND m.name = 'Video Render Engine') OR (mw.title LIKE '%Analytics%' AND m.name = 'Analytics Engine'));

DELETE FROM monitor_alert_rules WHERE monitor_id IN (SELECT id FROM uptime_monitors WHERE organization_id = @org);
INSERT INTO monitor_alert_rules(monitor_id, rule_name, threshold_type, threshold_value, severity)
SELECT id, 'High latency threshold', 'response_time_ms', 500, 'High' FROM uptime_monitors WHERE organization_id = @org
UNION ALL
SELECT id, 'SLA at-risk threshold', 'uptime_30d', 99.70, 'Medium' FROM uptime_monitors WHERE organization_id = @org;
END;
