IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema')
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE(
  (SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'),
  (SELECT TOP 1 id FROM organizations ORDER BY created_at)
);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id = @org AND code = 'super_admin');

MERGE permissions AS target
USING (VALUES
  ('navigation:read', 'Read navigation'),
  ('permissions:read', 'Read permissions'),
  ('system-monitoring:read', 'Read system monitoring'),
  ('system-monitoring:diagnostics:run', 'Run monitoring diagnostics'),
  ('audit:read', 'Read audit logs'),
  ('configuration:manage', 'Manage configuration'),
  ('workflow:execute', 'Execute workflows'),
  ('queue:manage', 'Manage queues'),
  ('notifications:send', 'Send notifications'),
  ('events:publish', 'Publish domain events'),
  ('storage:manage', 'Manage storage assets'),
  ('ai:orchestrate', 'Run AI orchestration')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT @adminRole, p.id
FROM permissions p
WHERE @adminRole IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp.role_id = @adminRole AND rp.permission_id = p.id
  );

MERGE feature_flags AS target
USING (VALUES
  (@org, 'system_monitoring_v1', 1, 'all', 'Enable system monitoring dashboards'),
  (@org, 'ai_orchestration_v1', 1, 'all', 'Enable AI orchestration engine'),
  (@org, 'workflow_engine_v1', 1, 'all', 'Enable dynamic workflow engine')
) AS source(organization_id, flag_key, is_enabled, environment, description)
ON target.organization_id = source.organization_id AND target.flag_key = source.flag_key AND target.environment = source.environment
WHEN MATCHED THEN UPDATE SET is_enabled = source.is_enabled, description = source.description, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, flag_key, is_enabled, environment, description)
VALUES (source.organization_id, source.flag_key, source.is_enabled, source.environment, source.description);

MERGE notification_templates AS target
USING (VALUES
  (@org, 'approval.requested', 'in_app', 'Approval requested', 'A workflow approval is waiting for your review.'),
  (@org, 'job.failed', 'in_app', 'Background job failed', 'A background job needs attention.'),
  (@org, 'system.health.degraded', 'in_app', 'Service degraded', 'A monitored service is degraded.')
) AS source(organization_id, template_key, channel, subject, body)
ON target.organization_id = source.organization_id AND target.template_key = source.template_key AND target.channel = source.channel
WHEN MATCHED THEN UPDATE SET subject = source.subject, body = source.body, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, template_key, channel, subject, body)
VALUES (source.organization_id, source.template_key, source.channel, source.subject, source.body);

MERGE ai_providers AS target
USING (VALUES
  ('OpenAI', 'active', NULL),
  ('Azure OpenAI', 'active', NULL)
) AS source(provider_name, status, base_url)
ON target.provider_name = source.provider_name
WHEN MATCHED THEN UPDATE SET status = source.status, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (provider_name, status, base_url) VALUES (source.provider_name, source.status, source.base_url);
END;
