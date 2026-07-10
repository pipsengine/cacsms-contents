SET NOCOUNT ON;

IF OBJECT_ID('workflow_documentation', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_documentation (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    documentation_type NVARCHAR(80) NOT NULL DEFAULT 'summary',
    title NVARCHAR(220) NOT NULL,
    content_markdown NVARCHAR(MAX) NOT NULL,
    generated_by NVARCHAR(160) NULL,
    generated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_definition_dependencies', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_dependencies (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    dependency_type NVARCHAR(80) NOT NULL,
    dependency_name NVARCHAR(180) NOT NULL,
    dependency_reference NVARCHAR(240) NULL,
    status NVARCHAR(80) NOT NULL DEFAULT 'healthy',
    required BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_definition_health', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_health (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    health_percent DECIMAL(8,2) NOT NULL DEFAULT 100,
    health_status NVARCHAR(80) NOT NULL DEFAULT 'Healthy',
    recovery_enabled BIT NOT NULL DEFAULT 1,
    final_output_ready BIT NOT NULL DEFAULT 1,
    analytics_enabled BIT NOT NULL DEFAULT 1,
    learning_enabled BIT NOT NULL DEFAULT 1,
    permissions_complete BIT NOT NULL DEFAULT 1,
    outdated_agents_models BIT NOT NULL DEFAULT 0,
    last_checked_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_definition_recommendations', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_recommendations (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    recommendation_type NVARCHAR(100) NOT NULL,
    title NVARCHAR(220) NOT NULL,
    description NVARCHAR(MAX) NULL,
    impact NVARCHAR(80) NOT NULL DEFAULT 'Medium',
    confidence_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
    status NVARCHAR(80) NOT NULL DEFAULT 'open',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_definition_owners', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_owners (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    owner_name NVARCHAR(180) NOT NULL,
    owner_team NVARCHAR(180) NULL,
    ownership_role NVARCHAR(80) NOT NULL DEFAULT 'Owner',
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workflow_definition_tags', 'U') IS NULL
BEGIN
  CREATE TABLE workflow_definition_tags (
    id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
    tag NVARCHAR(80) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('vw_workflow_definitions_list', 'V') IS NOT NULL DROP VIEW vw_workflow_definitions_list;
EXEC('CREATE VIEW vw_workflow_definitions_list AS
SELECT
  wd.id,
  wd.organization_id,
  wd.code,
  wd.name,
  wd.description,
  COALESCE(wd.category, ''Workflow Automation'') AS category,
  COALESCE(wd.workflow_type, ''workflow'') AS workflow_type,
  wd.current_version,
  wd.current_draft_version,
  wd.current_published_version,
  wd.status,
  COALESCE(vr.status, ''not_validated'') AS validation_status,
  COALESCE(h.health_percent, 0) AS health_percent,
  COALESCE(h.health_status, ''Unknown'') AS health_status,
  (SELECT COUNT(*) FROM workflow_stages ws WHERE ws.workflow_definition_id = wd.id AND ws.is_deleted = 0) AS stages,
  (SELECT COUNT(*) FROM workflow_connections wc WHERE wc.workflow_definition_id = wd.id) AS transitions,
  (SELECT COUNT(*) FROM workflow_node_configurations n WHERE n.workflow_definition_id = wd.id AND n.category = ''Triggers'') AS triggers,
  (SELECT COUNT(DISTINCT m.agent_id) FROM workflow_stage_agent_mappings m WHERE m.workflow_definition_id = wd.id) AS ai_agents,
  (SELECT COUNT(*) FROM workflow_rules r WHERE r.workflow_definition_id = wd.id AND r.rule_type LIKE ''%approval%'') AS approval_rules,
  CASE WHEN COALESCE(h.recovery_enabled, 0) = 1 THEN ''Enabled'' ELSE ''Missing'' END AS recovery_policy,
  CASE WHEN COALESCE(h.final_output_ready, 0) = 1 THEN ''Ready'' ELSE ''Missing'' END AS final_output,
  CAST(CASE WHEN COUNT(wi.id) = 0 THEN 100 ELSE 100.0 * COUNT(CASE WHEN wi.status = ''completed'' THEN 1 END) / COUNT(wi.id) END AS DECIMAL(8,2)) AS success_rate,
  AVG(CASE WHEN wi.started_at IS NOT NULL AND wi.completed_at IS NOT NULL THEN DATEDIFF(second, wi.started_at, wi.completed_at) END) AS avg_duration_seconds,
  MAX(wi.created_at) AS last_execution,
  COALESCE(wd.updated_at, wd.created_at) AS last_updated,
  COALESCE(o.owner_name, wd.owner_id, ''workflow-engine'') AS owner,
  COALESCE(ev.environment, ''production'') AS environment
FROM workflow_definitions wd
LEFT JOIN workflow_definition_health h ON h.workflow_definition_id = wd.id
LEFT JOIN workflow_definition_owners o ON o.workflow_definition_id = wd.id AND o.ownership_role = ''Owner''
LEFT JOIN workflow_environment_versions ev ON ev.workflow_definition_id = wd.id
LEFT JOIN workflow_validation_runs vr ON vr.workflow_definition_id = wd.id AND vr.validated_at = (SELECT MAX(vr2.validated_at) FROM workflow_validation_runs vr2 WHERE vr2.workflow_definition_id = wd.id)
LEFT JOIN workflow_instances wi ON wi.workflow_definition_id = wd.id AND wi.is_deleted = 0
WHERE wd.is_deleted = 0
GROUP BY wd.id, wd.organization_id, wd.code, wd.name, wd.description, wd.category, wd.workflow_type, wd.current_version, wd.current_draft_version, wd.current_published_version, wd.status, vr.status, h.health_percent, h.health_status, h.recovery_enabled, h.final_output_ready, wd.updated_at, wd.created_at, o.owner_name, wd.owner_id, ev.environment');

IF OBJECT_ID('vw_workflow_definition_health', 'V') IS NOT NULL DROP VIEW vw_workflow_definition_health;
EXEC('CREATE VIEW vw_workflow_definition_health AS
SELECT
  wd.organization_id,
  COUNT(*) AS total_definitions,
  COUNT(CASE WHEN COALESCE(h.health_status, ''Unknown'') = ''Healthy'' THEN 1 END) AS valid_definitions,
  COUNT(CASE WHEN COALESCE(h.health_status, ''Unknown'') = ''Warning'' THEN 1 END) AS warning_definitions,
  COUNT(CASE WHEN COALESCE(h.health_status, ''Unknown'') = ''Invalid'' THEN 1 END) AS invalid_definitions,
  COUNT(CASE WHEN wd.status IN (''disabled'',''inactive'') THEN 1 END) AS disabled_definitions,
  COUNT(CASE WHEN COALESCE(h.recovery_enabled, 0) = 0 THEN 1 END) AS missing_recovery,
  COUNT(CASE WHEN COALESCE(h.final_output_ready, 0) = 0 THEN 1 END) AS missing_final_output,
  COUNT(CASE WHEN COALESCE(h.analytics_enabled, 0) = 0 THEN 1 END) AS missing_analytics,
  COUNT(CASE WHEN COALESCE(h.learning_enabled, 0) = 0 THEN 1 END) AS missing_learning,
  COUNT(CASE WHEN COALESCE(h.permissions_complete, 0) = 0 THEN 1 END) AS missing_permissions,
  COUNT(CASE WHEN COALESCE(h.outdated_agents_models, 0) = 1 THEN 1 END) AS outdated_agents_models,
  AVG(COALESCE(h.health_percent, 0)) AS average_health
FROM workflow_definitions wd
LEFT JOIN workflow_definition_health h ON h.workflow_definition_id = wd.id
WHERE wd.is_deleted = 0
GROUP BY wd.organization_id');

IF OBJECT_ID('vw_workflow_definition_versions', 'V') IS NOT NULL DROP VIEW vw_workflow_definition_versions;
EXEC('CREATE VIEW vw_workflow_definition_versions AS
SELECT v.*, wd.code, wd.name, COALESCE(ev.environment, ''production'') AS definition_environment,
  (SELECT COUNT(*) FROM workflow_instances wi WHERE wi.workflow_definition_id = wd.id AND wi.workflow_version = v.version_number) AS execution_count,
  CAST(CASE WHEN (SELECT COUNT(*) FROM workflow_instances wi WHERE wi.workflow_definition_id = wd.id AND wi.workflow_version = v.version_number) = 0 THEN 100 ELSE
    100.0 * (SELECT COUNT(*) FROM workflow_instances wi WHERE wi.workflow_definition_id = wd.id AND wi.workflow_version = v.version_number AND wi.status = ''completed'') /
    NULLIF((SELECT COUNT(*) FROM workflow_instances wi WHERE wi.workflow_definition_id = wd.id AND wi.workflow_version = v.version_number), 0) END AS DECIMAL(8,2)) AS definition_success_rate,
  CASE WHEN v.status IN (''published'',''superseded'') THEN 1 ELSE 0 END AS rollback_eligible
FROM workflow_definition_versions v
JOIN workflow_definitions wd ON wd.id = v.workflow_definition_id
LEFT JOIN workflow_environment_versions ev ON ev.workflow_definition_id = wd.id');

IF OBJECT_ID('vw_workflow_definition_dependencies', 'V') IS NOT NULL DROP VIEW vw_workflow_definition_dependencies;
EXEC('CREATE VIEW vw_workflow_definition_dependencies AS SELECT d.*, wd.organization_id, wd.code, wd.name FROM workflow_definition_dependencies d JOIN workflow_definitions wd ON wd.id = d.workflow_definition_id');

IF OBJECT_ID('vw_workflow_definition_readiness', 'V') IS NOT NULL DROP VIEW vw_workflow_definition_readiness;
EXEC('CREATE VIEW vw_workflow_definition_readiness AS
SELECT wd.organization_id, wd.id AS workflow_definition_id, wd.code, wd.name,
  COALESCE(h.final_output_ready, 0) AS final_output_ready,
  COALESCE(h.recovery_enabled, 0) AS recovery_enabled,
  COALESCE(h.analytics_enabled, 0) AS analytics_enabled,
  COALESCE(h.learning_enabled, 0) AS learning_enabled,
  COALESCE(h.permissions_complete, 0) AS permissions_complete,
  COALESCE(h.health_percent, 0) AS readiness_percent
FROM workflow_definitions wd LEFT JOIN workflow_definition_health h ON h.workflow_definition_id = wd.id');

IF OBJECT_ID('vw_workflow_definition_recommendations', 'V') IS NOT NULL DROP VIEW vw_workflow_definition_recommendations;
EXEC('CREATE VIEW vw_workflow_definition_recommendations AS SELECT r.*, wd.organization_id, wd.code, wd.name FROM workflow_definition_recommendations r JOIN workflow_definitions wd ON wd.id = r.workflow_definition_id');
