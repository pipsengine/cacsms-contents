SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 51000, 'No organization exists for incident management seed.', 1;

DELETE FROM incident_communication_recipients WHERE communication_id IN (SELECT c.id FROM incident_communications c JOIN incidents i ON i.id = c.incident_id WHERE i.organization_id = @org);
DELETE FROM incident_bridge_participants WHERE bridge_session_id IN (SELECT b.id FROM incident_bridge_sessions b JOIN incidents i ON i.id = b.incident_id WHERE i.organization_id = @org);
DELETE FROM incident_bridge_notes WHERE bridge_session_id IN (SELECT b.id FROM incident_bridge_sessions b JOIN incidents i ON i.id = b.incident_id WHERE i.organization_id = @org);
DELETE FROM incident_root_cause_evidence WHERE root_cause_id IN (SELECT r.id FROM incident_root_causes r JOIN incidents i ON i.id = r.incident_id WHERE i.organization_id = @org);
DELETE FROM incident_postmortem_approvals WHERE postmortem_id IN (SELECT p.id FROM incident_postmortems p JOIN incidents i ON i.id = p.incident_id WHERE i.organization_id = @org);

DELETE t FROM incident_alert_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_log_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_trace_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_workflow_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_agent_run_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_job_links t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_assignments t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_events t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_status_history t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_severity_history t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_sla_tracking t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_communications t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_bridge_sessions t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_decisions t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_action_items t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_diagnostics t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_remediations t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_escalations t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_root_causes t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_postmortems t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_tags t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_comments t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE t FROM incident_attachments t JOIN incidents i ON i.id = t.incident_id WHERE i.organization_id = @org;
DELETE FROM incident_responders WHERE organization_id = @org;
DELETE FROM incidents WHERE organization_id = @org;
DELETE FROM incident_sources WHERE organization_id = @org;
DELETE FROM incident_services WHERE organization_id = @org;
DELETE FROM incident_modules WHERE organization_id = @org;
DELETE FROM incident_sla_policies WHERE organization_id = @org;
DELETE FROM incident_metrics WHERE organization_id = @org;
DELETE FROM incident_saved_views WHERE organization_id = @org;

INSERT INTO incident_sources(organization_id, source_type, source_name, service_name, module_name, environment, status, signal_count, last_signal_at)
VALUES
(@org, 'Service Health', 'Service Health Monitor', 'Workflow Engine', 'System Monitoring', 'production', 'Degraded', 8, DATEADD(minute, -3, SYSUTCDATETIME())),
(@org, 'API Status', 'API Gateway Status', 'Content API', 'System Monitoring', 'production', 'Warning', 12, DATEADD(minute, -5, SYSUTCDATETIME())),
(@org, 'Background Jobs', 'Queue Watcher', 'Publishing Queue', 'System Monitoring', 'production', 'Degraded', 15, DATEADD(minute, -7, SYSUTCDATETIME())),
(@org, 'Uptime', 'Regional Uptime Probe', 'Public Dashboard', 'System Monitoring', 'production', 'Warning', 4, DATEADD(minute, -11, SYSUTCDATETIME())),
(@org, 'Logs', 'Central Log Correlator', 'AI Orchestrator', 'System Monitoring', 'production', 'Critical', 21, DATEADD(minute, -2, SYSUTCDATETIME())),
(@org, 'Security', 'Security Event Stream', 'Auth Gateway', 'Security', 'production', 'Warning', 5, DATEADD(minute, -13, SYSUTCDATETIME()));

INSERT INTO incident_services(organization_id, service_name, service_tier, owner_team, health_status, active_incident_count)
VALUES
(@org, 'Workflow Engine', 'Tier 1', 'Automation Platform', 'Degraded', 2),
(@org, 'AI Orchestrator', 'Tier 1', 'AI Operations', 'Degraded', 3),
(@org, 'Publishing Queue', 'Tier 1', 'Publishing Operations', 'At Risk', 2),
(@org, 'Content API', 'Tier 1', 'Platform API', 'Warning', 2),
(@org, 'Database', 'Tier 1', 'Data Platform', 'Warning', 1),
(@org, 'Public Dashboard', 'Tier 2', 'Experience Platform', 'Operational', 1),
(@org, 'Storage', 'Tier 2', 'Infrastructure', 'Warning', 1),
(@org, 'External Integrations', 'Tier 2', 'Integration Platform', 'At Risk', 2);

INSERT INTO incident_modules(organization_id, module_name, module_group, owner_team)
VALUES
(@org, 'System Monitoring', 'Operations', 'Automation Platform'),
(@org, 'AI Orchestrator', 'Intelligence', 'AI Operations'),
(@org, 'Workflow Engine', 'Automation', 'Automation Platform'),
(@org, 'Publishing', 'Distribution', 'Publishing Operations'),
(@org, 'Analytics', 'Intelligence', 'Data Platform'),
(@org, 'Security', 'Risk', 'Security Operations');

INSERT INTO incident_sla_policies(organization_id, policy_name, severity, acknowledge_minutes, resolve_minutes, escalation_minutes)
VALUES
(@org, 'Critical Production Incident', 'Critical', 5, 60, 10),
(@org, 'High Production Incident', 'High', 15, 180, 30),
(@org, 'Medium Production Incident', 'Medium', 45, 480, 90),
(@org, 'Low Production Incident', 'Low', 120, 1440, 240);

DECLARE @services TABLE(name NVARCHAR(160), id UNIQUEIDENTIFIER);
INSERT INTO @services SELECT service_name, id FROM incident_services WHERE organization_id = @org;
DECLARE @modules TABLE(name NVARCHAR(160), id UNIQUEIDENTIFIER);
INSERT INTO @modules SELECT module_name, id FROM incident_modules WHERE organization_id = @org;

INSERT INTO incidents(organization_id, incident_number, title, description, source_type, source_reference_id, severity, priority, status, environment, affected_service_id, affected_module_id, customer_impact, impact_scope, assigned_team_id, assigned_team_name, incident_commander_id, incident_commander_name, acknowledged_at, investigating_at, mitigated_at, resolved_at, closed_at, sla_deadline, root_cause_status, resolution_summary, detection_signal, escalation_level, communication_status, created_at, updated_at)
VALUES
(@org, 'INC-2026-000001', 'AI orchestration retries elevated for content synthesis', 'Central log correlation detected repeated agent retry loops during synthesis.', 'Logs', 'cluster-ai-retry', 'Critical', 'P1', 'Investigating', 'production', (SELECT id FROM @services WHERE name = 'AI Orchestrator'), (SELECT id FROM @modules WHERE name = 'AI Orchestrator'), 'High', 'Scheduled content generation delayed for two priority campaigns', 'team-ai-ops', 'AI Operations', 'ic-ife', 'Ife Adeyemi', DATEADD(minute,-17,SYSUTCDATETIME()), DATEADD(minute,-15,SYSUTCDATETIME()), NULL, NULL, NULL, DATEADD(minute,42,SYSUTCDATETIME()), 'In Progress', NULL, 'Error cluster threshold crossed', 2, 'Stakeholder updates automated every 10 minutes', DATEADD(minute,-22,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000002', 'Publishing queue latency above SLA', 'Background job queue is processing below target throughput.', 'Background Jobs', 'queue-publishing', 'Critical', 'P1', 'Mitigating', 'production', (SELECT id FROM @services WHERE name = 'Publishing Queue'), (SELECT id FROM @modules WHERE name = 'Publishing'), 'Medium', 'Publishing schedule delayed for regional channels', 'team-publishing', 'Publishing Operations', 'ic-chioma', 'Chioma Nwosu', DATEADD(minute,-35,SYSUTCDATETIME()), DATEADD(minute,-32,SYSUTCDATETIME()), DATEADD(minute,-8,SYSUTCDATETIME()), NULL, NULL, DATEADD(minute,24,SYSUTCDATETIME()), 'Identified', NULL, 'Queue age exceeded policy', 1, 'Automated queue status updates active', DATEADD(minute,-41,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000003', 'Workflow stage completion events delayed', 'Workflow Engine completion event writes are lagging behind queue execution.', 'Workflow Engine', 'workflow-content-lifecycle', 'Critical', 'P1', 'Acknowledged', 'production', (SELECT id FROM @services WHERE name = 'Workflow Engine'), (SELECT id FROM @modules WHERE name = 'Workflow Engine'), 'Medium', 'Dashboard status updates delayed', 'team-automation', 'Automation Platform', 'ic-tunde', 'Tunde Balogun', DATEADD(minute,-8,SYSUTCDATETIME()), NULL, NULL, NULL, NULL, DATEADD(minute,51,SYSUTCDATETIME()), 'Not Started', NULL, 'Workflow telemetry gap detected', 1, 'Internal operations channel updated', DATEADD(minute,-13,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000004', 'Content API p95 latency spike', 'API status checks detected elevated p95 latency on content metadata endpoints.', 'API Status', 'api-content-p95', 'High', 'P2', 'Assigned', 'production', (SELECT id FROM @services WHERE name = 'Content API'), (SELECT id FROM @modules WHERE name = 'System Monitoring'), 'Low', 'Some dashboard reads are slower than normal', 'team-api', 'Platform API', NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,154,SYSUTCDATETIME()), 'Not Started', NULL, 'API latency threshold crossed', 0, 'Automated monitoring only', DATEADD(minute,-26,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000005', 'Database lock waits increasing', 'Data platform monitor observed elevated lock wait duration on workflow tables.', 'Database', 'db-lock-waits', 'High', 'P2', 'Triaged', 'production', (SELECT id FROM @services WHERE name = 'Database'), (SELECT id FROM @modules WHERE name = 'Workflow Engine'), 'Medium', 'Workflow writes may queue during peak processing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,132,SYSUTCDATETIME()), 'In Progress', NULL, 'SQL wait profile threshold crossed', 0, 'Automated DB notification sent', DATEADD(minute,-48,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000006', 'External video provider webhook failures', 'Integration failure rate exceeded normal operating band.', 'External integrations', 'provider-video-webhook', 'High', 'P2', 'Investigating', 'production', (SELECT id FROM @services WHERE name = 'External Integrations'), (SELECT id FROM @modules WHERE name = 'Publishing'), 'Medium', 'Video publishing confirmations delayed', 'team-integrations', 'Integration Platform', 'ic-amaka', 'Amaka Okoro', DATEADD(minute,-54,SYSUTCDATETIME()), DATEADD(minute,-47,SYSUTCDATETIME()), NULL, NULL, NULL, DATEADD(minute,87,SYSUTCDATETIME()), 'In Progress', NULL, 'Webhook error rate anomaly', 1, 'Partner status watch active', DATEADD(minute,-59,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000007', 'Security anomaly on API token refresh flow', 'Security event stream flagged abnormal refresh token retry pattern.', 'Security', 'sec-token-refresh', 'High', 'P2', 'Detected', 'production', (SELECT id FROM @services WHERE name = 'Content API'), (SELECT id FROM @modules WHERE name = 'Security'), 'None', 'No customer data exposure detected', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,163,SYSUTCDATETIME()), 'Not Started', NULL, 'Security anomaly score exceeded threshold', 1, 'Security channel notified automatically', DATEADD(minute,-9,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000008', 'Analytics aggregation freshness delayed', 'Analytics freshness check detected stale channel performance aggregates.', 'Analytics', 'analytics-freshness', 'Medium', 'P3', 'Monitoring', 'production', (SELECT id FROM @services WHERE name = 'Database'), (SELECT id FROM @modules WHERE name = 'Analytics'), 'Low', 'Reports may show delayed metrics', 'team-data', 'Data Platform', 'ic-seyi', 'Seyi Bello', DATEADD(minute,-81,SYSUTCDATETIME()), DATEADD(minute,-79,SYSUTCDATETIME()), DATEADD(minute,-31,SYSUTCDATETIME()), NULL, NULL, DATEADD(minute,301,SYSUTCDATETIME()), 'Identified', NULL, 'Freshness watermark drifted', 0, 'Automated report banner active', DATEADD(minute,-93,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000009', 'Storage replication lag for media derivatives', 'Storage telemetry shows replication lag above target for derivative assets.', 'Storage', 'storage-replication', 'Medium', 'P3', 'Assigned', 'production', (SELECT id FROM @services WHERE name = 'Storage'), (SELECT id FROM @modules WHERE name = 'Publishing'), 'Low', 'Some previews may arrive late', 'team-infra', 'Infrastructure', NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,405,SYSUTCDATETIME()), 'Not Started', NULL, 'Storage replication lag threshold crossed', 0, 'Automated infrastructure update sent', DATEADD(minute,-73,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000010', 'Regional uptime probe warning for public dashboard', 'Lagos and London probes reported intermittent dashboard latency.', 'Uptime', 'uptime-public-dashboard', 'Medium', 'P3', 'Triaged', 'production', (SELECT id FROM @services WHERE name = 'Public Dashboard'), (SELECT id FROM @modules WHERE name = 'System Monitoring'), 'Low', 'Intermittent dashboard slowness for operations users', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,396,SYSUTCDATETIME()), 'Not Started', NULL, 'Regional probe latency warning', 0, 'Monitoring notices automated', DATEADD(minute,-64,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000011', 'AI quality scoring job retries above threshold', 'Background processing detected repeated quality scoring retries.', 'AI Orchestrator', 'agent-quality-scoring', 'High', 'P2', 'Created', 'production', (SELECT id FROM @services WHERE name = 'AI Orchestrator'), (SELECT id FROM @modules WHERE name = 'AI Orchestrator'), 'Medium', 'Quality checks may complete late', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,174,SYSUTCDATETIME()), 'Not Started', NULL, 'Agent run retry threshold crossed', 0, 'Automated AI ops notice created', DATEADD(minute,-6,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000012', 'Workflow integration callback failures', 'External integration callbacks into workflow runtime are intermittently failing.', 'Workflow Engine', 'workflow-callback', 'High', 'P2', 'Detected', 'production', (SELECT id FROM @services WHERE name = 'Workflow Engine'), (SELECT id FROM @modules WHERE name = 'Workflow Engine'), 'Medium', 'Some integration-driven stages may wait for retry', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, DATEADD(minute,165,SYSUTCDATETIME()), 'Not Started', NULL, 'Callback failure correlation', 0, 'Automated correlation active', DATEADD(minute,-4,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000013', 'Caption service response variance elevated', 'Publishing quality checks detected intermittent caption generation variance.', 'Publishing', 'caption-service', 'Medium', 'P3', 'Resolved', 'production', (SELECT id FROM @services WHERE name = 'Publishing Queue'), (SELECT id FROM @modules WHERE name = 'Publishing'), 'Low', 'Caption generation recovered after retry normalization', 'team-publishing', 'Publishing Operations', 'ic-chioma', 'Chioma Nwosu', DATEADD(hour,-3,SYSUTCDATETIME()), DATEADD(hour,-3,SYSUTCDATETIME()), DATEADD(hour,-2,SYSUTCDATETIME()), DATEADD(hour,-1,SYSUTCDATETIME()), NULL, DATEADD(hour,-1,SYSUTCDATETIME()), 'Identified', 'Retry backoff normalized and caption variance returned to baseline.', 'Publishing quality monitor', 0, 'Resolved notice sent automatically', DATEADD(hour,-4,SYSUTCDATETIME()), SYSUTCDATETIME()),
(@org, 'INC-2026-000014', 'Search index delay after metadata update', 'Content search index lag exceeded expected window.', 'Background Jobs', 'search-index-delay', 'Low', 'P4', 'Closed', 'production', (SELECT id FROM @services WHERE name = 'Content API'), (SELECT id FROM @modules WHERE name = 'System Monitoring'), 'None', 'No current user-facing impact', 'team-api', 'Platform API', 'ic-tunde', 'Tunde Balogun', DATEADD(hour,-9,SYSUTCDATETIME()), DATEADD(hour,-8,SYSUTCDATETIME()), DATEADD(hour,-7,SYSUTCDATETIME()), DATEADD(hour,-6,SYSUTCDATETIME()), DATEADD(hour,-5,SYSUTCDATETIME()), DATEADD(hour,-6,SYSUTCDATETIME()), 'Complete', 'Index queue caught up after shard balancing.', 'Index lag monitor', 0, 'Closed summary archived', DATEADD(hour,-10,SYSUTCDATETIME()), SYSUTCDATETIME());

INSERT INTO incident_sla_tracking(incident_id, policy_id, acknowledge_due_at, resolve_due_at, sla_status, minutes_remaining, breached_at)
SELECT i.id, p.id, DATEADD(minute, p.acknowledge_minutes, i.created_at), i.sla_deadline,
  CASE WHEN i.sla_deadline < SYSUTCDATETIME() AND i.status NOT IN ('Resolved','Closed') THEN 'Breached'
       WHEN DATEDIFF(minute, SYSUTCDATETIME(), i.sla_deadline) <= 45 AND i.status NOT IN ('Resolved','Closed') THEN 'At Risk'
       ELSE 'Within SLA' END,
  DATEDIFF(minute, SYSUTCDATETIME(), i.sla_deadline),
  CASE WHEN i.sla_deadline < SYSUTCDATETIME() AND i.status NOT IN ('Resolved','Closed') THEN SYSUTCDATETIME() ELSE NULL END
FROM incidents i
JOIN incident_sla_policies p ON p.organization_id = i.organization_id AND p.severity = i.severity
WHERE i.organization_id = @org;

INSERT INTO incident_events(organization_id, incident_id, event_type, event_title, event_detail, actor_type, actor_name, event_time)
SELECT @org, id, 'incident.created', 'Incident created', detection_signal, 'system', 'Incident Correlator', created_at FROM incidents WHERE organization_id = @org
UNION ALL
SELECT @org, id, 'incident.triaged', 'Automated triage completed', CONCAT('Severity ', severity, ', priority ', priority), 'system', 'Incident Triage Service', DATEADD(minute, 2, created_at) FROM incidents WHERE organization_id = @org AND status NOT IN ('Detected','Created')
UNION ALL
SELECT @org, id, 'incident.acknowledged', 'Incident acknowledged', CONCAT('Commander: ', COALESCE(incident_commander_name, assigned_team_name, 'awaiting automatic assignment')), 'system', 'Incident Lifecycle Service', acknowledged_at FROM incidents WHERE organization_id = @org AND acknowledged_at IS NOT NULL
UNION ALL
SELECT @org, id, 'incident.investigating', 'Investigation started', 'Related logs, queues, workflows, and agents linked automatically.', 'system', 'Incident Correlation Service', investigating_at FROM incidents WHERE organization_id = @org AND investigating_at IS NOT NULL
UNION ALL
SELECT @org, id, 'incident.mitigating', 'Mitigation applied', 'Automated mitigation workflow updated the incident state.', 'system', 'Incident Remediation Service', mitigated_at FROM incidents WHERE organization_id = @org AND mitigated_at IS NOT NULL
UNION ALL
SELECT @org, id, 'incident.resolved', 'Service recovered', resolution_summary, 'system', 'Incident Resolution Service', resolved_at FROM incidents WHERE organization_id = @org AND resolved_at IS NOT NULL;

INSERT INTO incident_assignments(incident_id, assigned_team_name, assignee_name, assignment_status, assigned_at)
SELECT id, assigned_team_name, incident_commander_name, CASE WHEN status IN ('Resolved','Closed') THEN 'Completed' ELSE 'Active' END, COALESCE(acknowledged_at, DATEADD(minute, 3, created_at))
FROM incidents WHERE organization_id = @org AND assigned_team_name IS NOT NULL;

INSERT INTO incident_responders(organization_id, incident_id, responder_name, responder_role, team_name, on_call_status, joined_at)
SELECT organization_id, id, COALESCE(incident_commander_name, CONCAT(assigned_team_name, ' responder')), 'Incident Commander', assigned_team_name, CASE WHEN status IN ('Resolved','Closed') THEN 'Released' ELSE 'Engaged' END, COALESCE(acknowledged_at, created_at)
FROM incidents WHERE organization_id = @org AND assigned_team_name IS NOT NULL
UNION ALL SELECT @org, NULL, 'Automation Platform On-Call', 'Primary On-Call', 'Automation Platform', 'Available', NULL
UNION ALL SELECT @org, NULL, 'AI Operations On-Call', 'Primary On-Call', 'AI Operations', 'Available', NULL
UNION ALL SELECT @org, NULL, 'Publishing Operations On-Call', 'Primary On-Call', 'Publishing Operations', 'Available', NULL
UNION ALL SELECT @org, NULL, 'Data Platform On-Call', 'Primary On-Call', 'Data Platform', 'Available', NULL;

INSERT INTO incident_log_links(incident_id, log_query)
SELECT id, CONCAT('incidentNumber:', incident_number, ' source:', source_type) FROM incidents WHERE organization_id = @org;
INSERT INTO incident_trace_links(incident_id, trace_id)
SELECT id, CONCAT('trace-', RIGHT(incident_number, 6)) FROM incidents WHERE organization_id = @org;
INSERT INTO incident_workflow_links(incident_id, workflow_name)
SELECT id, CASE WHEN source_type IN ('Workflow Engine','Publishing','AI Orchestrator') THEN 'CONTENT_LIFECYCLE' ELSE 'INCIDENT_RESPONSE' END FROM incidents WHERE organization_id = @org;
INSERT INTO incident_job_links(incident_id, queue_name, job_name)
SELECT id, 'incident-management', CONCAT('correlate-', LOWER(REPLACE(incident_number, '-', ''))) FROM incidents WHERE organization_id = @org;

INSERT INTO incident_communications(incident_id, channel, subject, message, status, sent_at)
SELECT id, 'operations-channel', CONCAT(incident_number, ' ', status), CONCAT('Automated incident update: ', title), 'Sent', DATEADD(minute, 4, created_at)
FROM incidents WHERE organization_id = @org;

INSERT INTO incident_diagnostics(incident_id, diagnostic_name, status, result_summary, started_at, completed_at)
SELECT id, CONCAT(source_type, ' diagnostic'), CASE WHEN status IN ('Resolved','Closed','Monitoring','Mitigating') THEN 'Completed' ELSE 'Running' END, detection_signal, DATEADD(minute, 3, created_at), CASE WHEN status IN ('Resolved','Closed','Monitoring','Mitigating') THEN DATEADD(minute, 9, created_at) ELSE NULL END
FROM incidents WHERE organization_id = @org;

INSERT INTO incident_remediations(incident_id, remediation_name, status, result_summary, started_at, completed_at)
SELECT id, 'Autonomous remediation workflow', CASE WHEN status IN ('Resolved','Closed','Monitoring','Mitigating') THEN 'Completed' ELSE 'Queued' END, COALESCE(resolution_summary, 'Awaiting automated remediation window'), DATEADD(minute, 8, created_at), CASE WHEN status IN ('Resolved','Closed','Monitoring') THEN DATEADD(minute, 25, created_at) ELSE NULL END
FROM incidents WHERE organization_id = @org;

INSERT INTO incident_root_causes(incident_id, status, summary, category, confirmed_at)
SELECT id, root_cause_status, COALESCE(resolution_summary, 'Evidence collection in progress'), source_type, CASE WHEN root_cause_status IN ('Identified','Complete') THEN updated_at ELSE NULL END
FROM incidents WHERE organization_id = @org;

INSERT INTO incident_postmortems(incident_id, status, summary, lessons_learned, owner, due_at, completed_at)
SELECT id, CASE WHEN severity IN ('Critical','High') AND status IN ('Resolved','Closed') THEN 'Required' WHEN status = 'Closed' THEN 'Completed' ELSE 'Not Required' END, resolution_summary, NULL, assigned_team_name, DATEADD(day, 3, COALESCE(resolved_at, SYSUTCDATETIME())), CASE WHEN status = 'Closed' THEN closed_at ELSE NULL END
FROM incidents WHERE organization_id = @org;

INSERT INTO incident_action_items(incident_id, title, owner, status, due_at)
SELECT id, CONCAT('Verify sustained recovery for ', title), assigned_team_name, CASE WHEN status = 'Closed' THEN 'Completed' ELSE 'Open' END, DATEADD(day, 2, SYSUTCDATETIME())
FROM incidents WHERE organization_id = @org AND severity IN ('Critical','High');

INSERT INTO incident_metrics(organization_id, metric_date, active_incidents, critical_incidents, resolved_incidents, mt_ack_seconds, mt_resolve_minutes, sla_breaches)
VALUES
(@org, CAST(SYSUTCDATETIME() AS DATE),
 (SELECT COUNT(*) FROM incidents WHERE organization_id = @org AND status NOT IN ('Resolved','Closed')),
 (SELECT COUNT(*) FROM incidents WHERE organization_id = @org AND severity = 'Critical' AND status NOT IN ('Resolved','Closed')),
 (SELECT COUNT(*) FROM incidents WHERE organization_id = @org AND CAST(COALESCE(resolved_at, closed_at) AS DATE) = CAST(SYSUTCDATETIME() AS DATE)),
 258, 46,
 (SELECT COUNT(*) FROM incident_sla_tracking s JOIN incidents i ON i.id = s.incident_id WHERE i.organization_id = @org AND s.sla_status = 'Breached'));

INSERT INTO incident_saved_views(organization_id, name, description, filters_json, columns_json, owner, visibility)
VALUES
(@org, 'Critical Incidents', 'Active critical incidents requiring immediate autonomous response', '{"severity":"Critical","status":"active"}', '["incidentNumber","title","severity","status","slaDeadline","assignedTeam"]', 'System', 'Organization'),
(@org, 'Unassigned Incidents', 'Incidents waiting for automatic team assignment', '{"assignedTeam":"unassigned"}', '["incidentNumber","title","severity","sourceType","createdAt"]', 'System', 'Organization'),
(@org, 'SLA At Risk', 'Incidents approaching SLA deadline', '{"slaStatus":"At Risk"}', '["incidentNumber","title","slaStatus","slaDeadline","incidentCommander"]', 'System', 'Organization'),
(@org, 'Recently Resolved', 'Incidents resolved or closed recently', '{"status":["Resolved","Closed"]}', '["incidentNumber","title","resolvedAt","resolutionSummary"]', 'System', 'Organization');
