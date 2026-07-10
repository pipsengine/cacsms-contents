SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 51000, 'No organization exists for logs seed.', 1;

DECLARE @sources TABLE(source_type NVARCHAR(80), source_name NVARCHAR(160), service_name NVARCHAR(160), module_name NVARCHAR(160), region NVARCHAR(80), host NVARCHAR(160), status NVARCHAR(40), health DECIMAL(8,2), lpm INT, delay_ms INT, dropped INT, parsing INT, destination NVARCHAR(160));
INSERT INTO @sources VALUES
('Application','web-application','Next Web App','dashboard','Nigeria','web-01','Healthy',99.8,1840,900,0,2,'hot-storage'),
('API','api-gateway','API Gateway','platform-api','Nigeria','api-01','Healthy',99.2,2260,1200,1,4,'hot-storage'),
('Authentication','auth-service','Authentication Service','identity','Nigeria','auth-01','Healthy',99.6,720,800,0,1,'security-storage'),
('Security','security-monitor','Security Center','security','Nigeria','sec-01','Healthy',98.9,410,1400,0,0,'security-storage'),
('Database','mssql-database','MSSQL Database','database','Nigeria','sql-01','Healthy',97.7,980,1800,2,0,'warm-storage'),
('Workflow','workflow-engine','Workflow Engine','workflow-automation','Nigeria','wf-01','Healthy',99.1,1180,1300,0,3,'hot-storage'),
('AI Agent','ai-orchestrator','AI Orchestrator','ai-agents','Nigeria','ai-01','Degraded',92.4,890,2400,8,7,'hot-storage'),
('Queue','background-queue','Background Jobs','queues','Nigeria','queue-01','Healthy',96.8,650,1600,1,1,'hot-storage'),
('Publishing','publishing-engine','Publishing Engine','publishing-center','Nigeria','pub-01','Healthy',98.2,520,1100,0,2,'warm-storage'),
('Analytics','analytics-engine','Analytics Engine','analytics','Nigeria','analytics-01','Healthy',99.0,610,1000,0,1,'warm-storage'),
('Storage','storage-service','Storage','digital-assets','Nigeria','storage-01','Healthy',98.6,430,1700,0,0,'archive-storage'),
('Integration','provider-integrations','External Integrations','integrations','Nigeria','int-01','Degraded',91.7,370,3100,12,6,'hot-storage');

MERGE log_sources AS target
USING @sources AS source
ON target.organization_id = @org AND target.source_name = source.source_name
WHEN MATCHED THEN UPDATE SET source_type = source.source_type, service_name = source.service_name, module_name = source.module_name, region = source.region, host = source.host, status = source.status, health_percent = source.health, logs_per_minute = source.lpm, ingestion_delay_ms = source.delay_ms, dropped_events = source.dropped, parsing_errors = source.parsing, storage_destination = source.destination, last_event_at = DATEADD(second, -source.delay_ms / 1000, SYSUTCDATETIME()), updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, source_type, source_name, service_name, module_name, region, host, status, health_percent, logs_per_minute, ingestion_delay_ms, dropped_events, parsing_errors, storage_destination, last_event_at)
VALUES (@org, source.source_type, source.source_name, source.service_name, source.module_name, source.region, source.host, source.status, source.health, source.lpm, source.delay_ms, source.dropped, source.parsing, source.destination, DATEADD(second, -source.delay_ms / 1000, SYSUTCDATETIME()));

IF NOT EXISTS (SELECT 1 FROM log_entries WHERE organization_id = @org)
BEGIN
  DECLARE @i INT = 0;
  DECLARE @levels TABLE(idx INT IDENTITY(1,1), level NVARCHAR(40));
  INSERT INTO @levels(level) VALUES ('Information'),('Information'),('Warning'),('Error'),('Critical'),('Debug'),('Notice');

  WHILE @i < 180
  BEGIN
    DECLARE @level NVARCHAR(40) = (SELECT level FROM @levels WHERE idx = ((@i % 7) + 1));
    DECLARE @sourceName NVARCHAR(160) = (SELECT source_name FROM (SELECT source_name, ROW_NUMBER() OVER (ORDER BY source_name) rn FROM log_sources WHERE organization_id = @org) s WHERE rn = ((@i % 12) + 1));
    DECLARE @sourceType NVARCHAR(80), @serviceName NVARCHAR(160), @moduleName NVARCHAR(160), @region NVARCHAR(80), @host NVARCHAR(160);
    SELECT @sourceType = source_type, @serviceName = service_name, @moduleName = module_name, @region = region, @host = host FROM log_sources WHERE organization_id = @org AND source_name = @sourceName;
    DECLARE @trace NVARCHAR(120) = CONCAT('trace-', FORMAT(@i % 24, '0000'));
    DECLARE @corr NVARCHAR(120) = CONCAT('corr-', FORMAT(@i % 18, '0000'));
    DECLARE @request NVARCHAR(120) = CONCAT('req-', FORMAT(@i, '000000'));
    DECLARE @endpoint NVARCHAR(260) = CASE WHEN @sourceType = 'API' THEN CONCAT('/api/v1/system-monitoring/', CASE WHEN @i % 3 = 0 THEN 'logs' WHEN @i % 3 = 1 THEN 'workflow-status' ELSE 'uptime' END) ELSE NULL END;
    DECLARE @duration INT = 40 + ((@i * 97) % 6200);
    DECLARE @statusCode INT = CASE WHEN @level IN ('Error','Critical') THEN 500 WHEN @level = 'Warning' THEN 429 ELSE 200 END;
    DECLARE @message NVARCHAR(MAX) = CASE
      WHEN @level = 'Critical' THEN CONCAT(@serviceName, ' critical event detected for correlation ', @corr)
      WHEN @level = 'Error' THEN CONCAT(@serviceName, ' failed operation with timeout after ', @duration, ' ms')
      WHEN @level = 'Warning' THEN CONCAT(@serviceName, ' warning threshold exceeded for ', @moduleName)
      ELSE CONCAT(@serviceName, ' processed operational event for ', @moduleName)
    END;
    INSERT INTO log_entries (
      organization_id, timestamp, level, source_type, source_name, service_name, module_name, environment, message, message_template, error_code, exception_type, stack_trace,
      request_id, trace_id, span_id, correlation_id, workflow_instance_id, workflow_stage_id, agent_run_id, job_id, user_id, endpoint, http_method, status_code, duration_ms, region, host, ip_address, metadata_json, is_sensitive
    )
    VALUES (
      @org, DATEADD(minute, -@i * 7, SYSUTCDATETIME()), @level, @sourceType, @sourceName, @serviceName, @moduleName, 'production', @message, '{service} processed event', CASE WHEN @level IN ('Error','Critical') THEN CONCAT(UPPER(REPLACE(@moduleName, '-', '_')), '_', @level) ELSE NULL END, CASE WHEN @level IN ('Error','Critical') THEN 'OperationalException' ELSE NULL END, CASE WHEN @level IN ('Error','Critical') THEN 'at Cacsms.Runtime.Execute()' ELSE NULL END,
      @request, @trace, CONCAT('span-', FORMAT(@i % 48, '0000')), @corr, NULL, NULL, NULL, NULL, 'build-mode-user', @endpoint, CASE WHEN @endpoint IS NULL THEN NULL ELSE 'GET' END, CASE WHEN @endpoint IS NULL THEN NULL ELSE @statusCode END, @duration, @region, @host, CONCAT('10.0.0.', (@i % 220) + 10), CONCAT('{"sequence":', @i, ',"redactedToken":"[REDACTED]","tenant":"ai-media-group"}'), CASE WHEN @sourceType IN ('Security','Authentication') THEN 1 ELSE 0 END
    );
    SET @i += 1;
  END;
END;

DELETE FROM log_ingestion_metrics WHERE organization_id = @org;
DECLARE @b INT = 0;
WHILE @b < 48
BEGIN
  INSERT INTO log_ingestion_metrics(organization_id, bucket_start, total_logs, error_logs, warning_logs, critical_logs, avg_ingestion_delay_ms)
  VALUES (@org, DATEADD(minute, -15 * @b, SYSUTCDATETIME()), 4200 + ((@b * 83) % 1600), 30 + (@b % 20), 160 + (@b % 70), CASE WHEN @b % 12 = 0 THEN 4 ELSE 0 END, 900 + ((@b * 71) % 2100));
  SET @b += 1;
END;

MERGE log_error_clusters AS target
USING (VALUES
  (@org, 'AI provider timeout spike', 'AI_PROVIDER_TIMEOUT', 'TimeoutException', 'Provider timeout while generating output', 'AI Orchestrator', 'ai-agents', 426, DATEADD(day,-3,SYSUTCDATETIME()), DATEADD(minute,-8,SYSUTCDATETIME()), 2, 0, 'Medium', 'Rising', 'Investigating', 'INC-2026-0710-01', 'AI Platform', 'Provider latency above contract'),
  (@org, 'Workflow stage retry exceeded', 'WORKFLOW_RETRY_EXCEEDED', 'OperationalException', 'Workflow stage failed after retry policy', 'Workflow Engine', 'workflow-automation', 96, DATEADD(day,-2,SYSUTCDATETIME()), DATEADD(minute,-19,SYSUTCDATETIME()), 1, 0, 'High', 'Flat', 'Open', NULL, 'Workflow Platform', 'Downstream queue delay'),
  (@org, 'Slow API response', 'API_P95_LATENCY', 'LatencyThresholdException', 'API latency above target', 'API Gateway', 'platform-api', 810, DATEADD(day,-7,SYSUTCDATETIME()), DATEADD(minute,-3,SYSUTCDATETIME()), 4, 0, 'Medium', 'Falling', 'Monitoring', NULL, 'Platform API', 'High request burst')
) AS source(organization_id, title, error_code, exception_type, message_signature, service_name, module_name, occurrence_count, first_seen_at, last_seen_at, affected_services, affected_users, impact, trend, resolution_status, linked_incident, owner, root_cause)
ON target.organization_id = source.organization_id AND target.error_code = source.error_code
WHEN MATCHED THEN UPDATE SET occurrence_count = source.occurrence_count, last_seen_at = source.last_seen_at, trend = source.trend, resolution_status = source.resolution_status
WHEN NOT MATCHED THEN INSERT (organization_id, title, error_code, exception_type, message_signature, service_name, module_name, occurrence_count, first_seen_at, last_seen_at, affected_services, affected_users, impact, trend, resolution_status, linked_incident, owner, root_cause)
VALUES (source.organization_id, source.title, source.error_code, source.exception_type, source.message_signature, source.service_name, source.module_name, source.occurrence_count, source.first_seen_at, source.last_seen_at, source.affected_services, source.affected_users, source.impact, source.trend, source.resolution_status, source.linked_incident, source.owner, source.root_cause);

MERGE log_saved_views AS target
USING (VALUES
  (@org, 'All Errors', 'Errors across services', 'level:error OR level:critical', '{"level":["Error","Critical"]}', 'Organization'),
  (@org, 'Failed Workflows', 'Workflow failures and retries', 'service:workflow-engine AND level:error', '{"sourceType":["Workflow"]}', 'Team'),
  (@org, 'Slow API Requests', 'API requests above latency target', 'durationMs:>2000', '{"sourceType":["API"]}', 'Organization'),
  (@org, 'Authentication Failures', 'Security and auth failures', 'sourceType:authentication AND level:error', '{"sourceType":["Authentication","Security"]}', 'System')
) AS source(organization_id, name, description, query_text, filters_json, visibility)
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET description = source.description, query_text = source.query_text, filters_json = source.filters_json
WHEN NOT MATCHED THEN INSERT (organization_id, name, description, query_text, filters_json, columns_json, sort_json, owner, visibility, default_date_range, alert_attached)
VALUES (source.organization_id, source.name, source.description, source.query_text, source.filters_json, '["timestamp","level","service","message","traceId"]', '{"timestamp":"desc"}', 'Operations', source.visibility, 'Last 24 Hours', CASE WHEN source.name = 'All Errors' THEN 1 ELSE 0 END);

MERGE log_alert_rules AS target
USING (VALUES
  (@org, 'Workflow failure burst', 'More than 10 workflow failures in 5 minutes', 'sourceType:workflow AND level:error', 'Critical', 10, '5 minutes', '1 minute', '5 minutes', 'Operations', 1, 1, 1),
  (@org, 'API latency above target', 'API P95 latency above 2 seconds', 'sourceType:api AND durationMs:>2000', 'Warning', 50, '10 minutes', '5 minutes', '15 minutes', 'Platform API', 1, 0, 0),
  (@org, 'AI provider timeout rate', 'Provider timeout rate above threshold', 'service:ai-orchestrator AND errorCode:AI_PROVIDER_TIMEOUT', 'Error', 20, '15 minutes', '5 minutes', '30 minutes', 'AI Platform', 1, 1, 0)
) AS source(organization_id, name, description, query_text, severity, threshold_value, evaluation_window, frequency, cooldown, owner, enabled, auto_create_incident, auto_run_remediation_workflow)
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN MATCHED THEN UPDATE SET query_text = source.query_text, severity = source.severity, threshold_value = source.threshold_value, enabled = source.enabled
WHEN NOT MATCHED THEN INSERT (organization_id, name, description, query_text, severity, threshold_value, evaluation_window, frequency, cooldown, notification_channels, owner, enabled, auto_create_incident, auto_run_remediation_workflow)
VALUES (source.organization_id, source.name, source.description, source.query_text, source.severity, source.threshold_value, source.evaluation_window, source.frequency, source.cooldown, '["email","teams","in_app"]', source.owner, source.enabled, source.auto_create_incident, source.auto_run_remediation_workflow);

MERGE log_investigations AS target
USING (VALUES
  (@org, 'AI provider timeout investigation', 'Investigating', 'AI Platform', 'INC-2026-0710-01', '["ai","provider","timeout"]'),
  (@org, 'Workflow queue latency review', 'Monitoring', 'Workflow Platform', NULL, '["workflow","queue"]')
) AS source(organization_id, title, status, owner, linked_incident, tags_json)
ON target.organization_id = source.organization_id AND target.title = source.title
WHEN MATCHED THEN UPDATE SET status = source.status, owner = source.owner, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, title, status, owner, linked_incident, tags_json)
VALUES (source.organization_id, source.title, source.status, source.owner, source.linked_incident, source.tags_json);

MERGE log_retention_policies AS target
USING (VALUES
  (@org, 'Critical', 365, 'Archive', 1),
  (@org, 'Fatal', 365, 'Archive', 1),
  (@org, 'Security', 730, 'Archive', 1),
  (@org, 'Audit', 730, 'Archive', 1),
  (@org, 'Error', 180, 'Warm', 1),
  (@org, 'Warning', 90, 'Warm', 1),
  (@org, 'Information', 30, 'Hot', 0),
  (@org, 'Debug', 7, 'Hot', 0),
  (@org, 'Trace', 7, 'Hot', 0)
) AS source(organization_id, level, retention_days, storage_tier, archive_enabled)
ON target.organization_id = source.organization_id AND target.level = source.level
WHEN MATCHED THEN UPDATE SET retention_days = source.retention_days, storage_tier = source.storage_tier, archive_enabled = source.archive_enabled
WHEN NOT MATCHED THEN INSERT (organization_id, level, retention_days, storage_tier, archive_enabled)
VALUES (source.organization_id, source.level, source.retention_days, source.storage_tier, source.archive_enabled);

DELETE FROM log_source_health WHERE source_id IN (SELECT id FROM log_sources WHERE organization_id = @org);
INSERT INTO log_source_health(source_id, status, logs_per_minute, ingestion_delay_ms, dropped_events, parsing_errors, health_percent)
SELECT id, status, logs_per_minute, ingestion_delay_ms, dropped_events, parsing_errors, health_percent FROM log_sources WHERE organization_id = @org;
