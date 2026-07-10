SET NOCOUNT ON;

IF OBJECT_ID('ai_agents', 'U') IS NOT NULL
BEGIN
  UPDATE ai_agents
  SET approval_required = 0,
      updated_at = SYSUTCDATETIME()
  WHERE approval_required = 1;
END;

IF OBJECT_ID('workflow_stages', 'U') IS NOT NULL
BEGIN
  UPDATE workflow_stages
  SET name = 'Autonomous Approval Check',
      stage_code = 'autonomous_approval_check',
      required_permission = NULL,
      updated_at = SYSUTCDATETIME()
  WHERE stage_code = 'approval'
    AND name = 'Approval';
END;

IF OBJECT_ID('workflow_definitions', 'U') IS NOT NULL
BEGIN
  UPDATE workflow_definitions
  SET status = 'inactive',
      updated_at = SYSUTCDATETIME()
  WHERE code = 'CONTENT_APPROVAL'
    AND status <> 'inactive';
END;
