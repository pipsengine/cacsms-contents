IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '004_ai_orchestrator_runtime')
BEGIN
DECLARE @org UNIQUEIDENTIFIER = COALESCE(
  (SELECT TOP 1 id FROM organizations WHERE slug = 'ai-media-group'),
  (SELECT TOP 1 id FROM organizations ORDER BY created_at)
);
DECLARE @admin UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM users WHERE organization_id = @org ORDER BY created_at);
DECLARE @content UNIQUEIDENTIFIER = (SELECT id FROM workflow_definitions WHERE organization_id = @org AND code = 'CONTENT_LIFECYCLE');

MERGE permissions AS target
USING (VALUES
  ('ai.agents.view', 'View AI agents'),
  ('ai.agents.execute', 'Run AI agents'),
  ('ai.runs.view', 'View AI runs'),
  ('ai.runs.manage', 'Manage AI runs'),
  ('ai.providers.view', 'View AI providers'),
  ('ai.costs.view', 'View AI costs'),
  ('ai.approve', 'Approve AI outputs')
) AS source(code, description)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET description = source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

MERGE job_queues AS target
USING (VALUES
  (@org, 'ai-orchestration'),
  (@org, 'ai-agent-execution'),
  (@org, 'ai-output-validation')
) AS source(organization_id, name)
ON target.organization_id = source.organization_id AND target.name = source.name
WHEN NOT MATCHED THEN INSERT (organization_id, name, status, health_percent, created_by)
VALUES (source.organization_id, source.name, 'running', 100, @admin);

MERGE ai_providers AS target
USING (VALUES
  (CAST(NULL AS UNIQUEIDENTIFIER), 'LOCAL_STRUCTURED', 'CACSMS Local Structured Provider', 'llm', 'enabled', NULL),
  (CAST(NULL AS UNIQUEIDENTIFIER), 'OPENAI', 'OpenAI', 'llm', 'disabled', 'https://api.openai.com'),
  (CAST(NULL AS UNIQUEIDENTIFIER), 'IMAGE_PROVIDER', 'Image Provider', 'image', 'disabled', NULL),
  (CAST(NULL AS UNIQUEIDENTIFIER), 'VOICE_PROVIDER', 'Voice Provider', 'voice', 'disabled', NULL),
  (CAST(NULL AS UNIQUEIDENTIFIER), 'VIDEO_PROVIDER', 'Video Provider', 'video', 'disabled', NULL),
  (CAST(NULL AS UNIQUEIDENTIFIER), 'SEARCH_PROVIDER', 'Search and Retrieval Provider', 'search', 'disabled', NULL)
) AS source(organization_id, code, name, provider_type, status, base_url)
ON ISNULL(target.organization_id, '00000000-0000-0000-0000-000000000000') = ISNULL(source.organization_id, '00000000-0000-0000-0000-000000000000') AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, provider_name = source.name, provider_type = source.provider_type, status = source.status, base_url = source.base_url, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, provider_name, provider_type, status, base_url, config_json)
VALUES (source.organization_id, source.code, source.name, source.name, source.provider_type, source.status, source.base_url, '{"source":"seed"}');

DECLARE @localProvider UNIQUEIDENTIFIER = (SELECT id FROM ai_providers WHERE code = 'LOCAL_STRUCTURED');

MERGE ai_models AS target
USING (VALUES
  (@localProvider, 'local-structured-v1', 'Local Structured Execution v1', 'llm', 32000, 'enabled', 'standard', 'fast')
) AS source(provider_id, code, name, model_type, context_window, status, quality_tier, latency_tier)
ON target.provider_id = source.provider_id AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, model_name = source.name, status = source.status, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (provider_id, code, name, model_name, model_type, context_window, status, quality_tier, latency_tier)
VALUES (source.provider_id, source.code, source.name, source.name, source.model_type, source.context_window, source.status, source.quality_tier, source.latency_tier);

DECLARE @localModel UNIQUEIDENTIFIER = (SELECT id FROM ai_models WHERE provider_id = @localProvider AND code = 'local-structured-v1');

MERGE ai_model_capabilities AS target
USING (VALUES
  (@localModel, 'structured_generation', 'text', 32000, 8000),
  (@localModel, 'planning', 'text', 32000, 8000),
  (@localModel, 'validation', 'text', 32000, 4000),
  (@localModel, 'metadata_generation', 'text', 32000, 4000)
) AS source(model_id, capability, media_type, max_input_tokens, max_output_tokens)
ON target.model_id = source.model_id AND target.capability = source.capability
WHEN NOT MATCHED THEN INSERT (model_id, capability, media_type, max_input_tokens, max_output_tokens)
VALUES (source.model_id, source.capability, source.media_type, source.max_input_tokens, source.max_output_tokens);

IF NOT EXISTS (SELECT 1 FROM ai_model_pricing WHERE model_id = @localModel)
  INSERT INTO ai_model_pricing(model_id, input_token_cost, output_token_cost, unit_cost)
  VALUES (@localModel, 0, 0, 0);

MERGE ai_model_health AS target
USING (SELECT @localModel AS model_id, 'healthy' AS status, CAST(1 AS DECIMAL(8,4)) AS success_rate, 75 AS avg_latency_ms) AS source
ON target.model_id = source.model_id
WHEN MATCHED THEN UPDATE SET status = source.status, success_rate = source.success_rate, avg_latency_ms = source.avg_latency_ms, checked_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (model_id, status, success_rate, avg_latency_ms) VALUES (source.model_id, source.status, source.success_rate, source.avg_latency_ms);

DECLARE @agents TABLE(code NVARCHAR(120), name NVARCHAR(180), domain NVARCHAR(80), output_type NVARCHAR(120), approval_required BIT);
INSERT INTO @agents(code, name, domain, output_type, approval_required) VALUES
('TREND_DISCOVERY','Trend Discovery Agent','research','research_bundle',0),
('KEYWORD_RESEARCH','Keyword Research Agent','research','research_bundle',0),
('COMPETITOR_INTELLIGENCE','Competitor Intelligence Agent','research','research_bundle',0),
('AUDIENCE_RESEARCH','Audience Research Agent','research','research_bundle',0),
('NEWS_RESEARCH','News Research Agent','research','research_bundle',0),
('SOURCE_VERIFICATION','Source Verification Agent','research','citation_report',0),
('OPPORTUNITY_SCORING','Opportunity Scoring Agent','research','opportunity_score',0),
('CONTENT_STRATEGY','Content Strategy Agent','strategy','content_strategy',0),
('TOPIC_PRIORITIZATION','Topic Prioritization Agent','strategy','content_strategy',0),
('CAMPAIGN_PLANNING','Campaign Planning Agent','strategy','content_strategy',0),
('CONTENT_CALENDAR','Content Calendar Agent','strategy','content_strategy',0),
('PLATFORM_STRATEGY','Platform Strategy Agent','strategy','content_strategy',0),
('OUTLINE','Outline Agent','writing','outline',0),
('SCRIPT_WRITER','Script Writer Agent','writing','script',0),
('BLOG_WRITER','Blog Writer Agent','writing','script',0),
('SOCIAL_COPY','Social Copy Agent','writing','publishing_package',0),
('NEWSLETTER_WRITER','Newsletter Writer Agent','writing','script',0),
('PODCAST_SCRIPT','Podcast Script Agent','writing','script',0),
('CTA','CTA Agent','writing','publishing_package',0),
('LOCALIZATION','Localization Agent','writing','publishing_package',0),
('TRANSLATION','Translation Agent','writing','publishing_package',0),
('FACT_CHECKER','Fact Checker Agent','verification','fact_check_report',0),
('CITATION_VERIFICATION','Citation Verification Agent','verification','citation_report',0),
('PLAGIARISM_REVIEW','Plagiarism Review Agent','verification','compliance_report',0),
('BRAND_COMPLIANCE','Brand Compliance Agent','verification','compliance_report',1),
('PLATFORM_POLICY','Platform Policy Agent','verification','compliance_report',1),
('COPYRIGHT_RISK','Copyright Risk Agent','verification','compliance_report',1),
('STORYBOARD','Storyboard Agent','creative','storyboard',0),
('SCENE_PLANNING','Scene Planning Agent','creative','storyboard',0),
('IMAGE_PROMPT','Image Prompt Agent','creative','image_prompt',0),
('IMAGE_GENERATION','Image Generation Agent','image','video_scene',0),
('THUMBNAIL','Thumbnail Agent','creative','thumbnail_concept',0),
('ILLUSTRATION','Illustration Agent','creative','video_scene',0),
('INFOGRAPHIC','Infographic Agent','creative','video_scene',0),
('BRAND_VISUAL','Brand Visual Agent','creative','thumbnail_concept',0),
('VOICE_SELECTION','Voice Selection Agent','audio','voice_asset',0),
('NARRATION','Narration Agent','audio','audio_asset',0),
('PRONUNCIATION','Pronunciation Agent','audio','audio_asset',0),
('DUBBING','Dubbing Agent','audio','audio_asset',0),
('AUDIO_CLEANUP','Audio Cleanup Agent','audio','audio_asset',0),
('AUDIO_MASTERING','Audio Mastering Agent','audio','audio_asset',0),
('MUSIC_SELECTION','Music Selection Agent','audio','audio_asset',0),
('SOUND_DESIGN','Sound Design Agent','audio','audio_asset',0),
('VIDEO_PLANNING','Video Planning Agent','video','video_scene',0),
('SCENE_GENERATION','Scene Generation Agent','video','video_scene',0),
('B_ROLL','B-Roll Agent','video','video_scene',0),
('MOTION_GRAPHICS','Motion Graphics Agent','video','video_scene',0),
('CAPTION','Caption Agent','video','seo_package',0),
('SUBTITLE','Subtitle Agent','video','seo_package',0),
('VIDEO_EDITING','Video Editing Agent','video','video_asset',0),
('RENDER','Render Agent','video','video_asset',0),
('VIDEO_QUALITY','Video Quality Agent','video','compliance_report',0),
('TITLE_OPTIMIZATION','Title Optimization Agent','seo','seo_package',0),
('DESCRIPTION','Description Agent','seo','seo_package',0),
('TAG','Tag Agent','seo','seo_package',0),
('HASHTAG','Hashtag Agent','seo','seo_package',0),
('METADATA','Metadata Agent','seo','seo_package',0),
('SEARCH_OPTIMIZATION','Search Optimization Agent','seo','seo_package',0),
('READABILITY','Readability Agent','seo','compliance_report',0),
('SCHEDULING','Scheduling Agent','publishing','publishing_package',1),
('PLATFORM_FORMATTING','Platform Formatting Agent','publishing','publishing_package',0),
('PUBLISHING','Publishing Agent','publishing','publishing_package',1),
('RETRY_RECOVERY','Retry and Recovery Agent','publishing','publishing_package',0),
('CROSS_PLATFORM_ADAPTATION','Cross-Platform Adaptation Agent','publishing','publishing_package',0),
('PERFORMANCE_COLLECTION','Performance Collection Agent','analytics','analytics_report',0),
('CTR_ANALYSIS','CTR Analysis Agent','analytics','analytics_report',0),
('RETENTION_ANALYSIS','Retention Analysis Agent','analytics','analytics_report',0),
('ENGAGEMENT_ANALYSIS','Engagement Analysis Agent','analytics','analytics_report',0),
('REVENUE_ATTRIBUTION','Revenue Attribution Agent','analytics','analytics_report',0),
('ANOMALY_DETECTION','Anomaly Detection Agent','analytics','analytics_report',0),
('FORECASTING','Forecasting Agent','analytics','analytics_report',0),
('FEEDBACK_EXTRACTION','Feedback Extraction Agent','learning','learning_recommendation',0),
('PROMPT_OPTIMIZATION','Prompt Optimization Agent','learning','learning_recommendation',0),
('THUMBNAIL_LEARNING','Thumbnail Learning Agent','learning','learning_recommendation',0),
('HOOK_LEARNING','Hook Learning Agent','learning','learning_recommendation',0),
('TIMING_LEARNING','Timing Learning Agent','learning','learning_recommendation',0),
('AUDIENCE_LEARNING','Audience Learning Agent','learning','learning_recommendation',0),
('STRATEGY_RECOMMENDATION','Strategy Recommendation Agent','learning','learning_recommendation',0),
('EXECUTIVE_RECOMMENDATION','Executive Recommendation Agent','executive','learning_recommendation',1),
('MONITORING','Monitoring Agent','monitoring','analytics_report',0),
('RECOVERY','Recovery Agent','recovery','compliance_report',0);

MERGE ai_agents AS target
USING @agents AS source
ON target.organization_id = @org AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, domain = source.domain, status = 'active', approval_required = source.approval_required, updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id, code, name, domain, description, current_version, status, approval_required, timeout_seconds, max_retries, concurrency_limit, cost_limit, owner, tags)
VALUES (@org, source.code, source.name, source.domain, CONCAT(source.name, ' for CACSMS production orchestration.'), 1, 'active', source.approval_required, 120, 2, 5, 0, 'AI Orchestrator', CONCAT('["', source.domain, '"]'));

MERGE ai_agent_versions AS target
USING (
  SELECT a.id AS agent_id, 1 AS version,
         CONCAT('{"id":"', a.id, '","code":"', a.code, '","name":"', a.name, '","domain":"', a.domain, '","version":1,"status":"active","preferredModels":["local-structured-v1"],"fallbackModels":[],"requiredTools":[],"requiredPermissions":["ai.agents.execute"],"timeoutSeconds":', a.timeout_seconds, ',"maxRetries":', a.max_retries, ',"approvalRequired":', CASE WHEN a.approval_required = 1 THEN 'true' ELSE 'false' END, '}') AS manifest_json,
         CONCAT('{"type":"object","required":["summary","items"],"outputType":"', ag.output_type, '"}') AS output_schema_json,
         '{"minimumConfidence":0.7,"requiredFields":["summary","items"]}' AS validation_rules_json
  FROM ai_agents a
  JOIN @agents ag ON ag.code = a.code
) AS source
ON target.agent_id = source.agent_id AND target.version = source.version
WHEN MATCHED THEN UPDATE SET manifest_json = source.manifest_json, output_schema_json = source.output_schema_json, validation_rules_json = source.validation_rules_json
WHEN NOT MATCHED THEN INSERT (agent_id, version, manifest_json, output_schema_json, validation_rules_json)
VALUES (source.agent_id, source.version, source.manifest_json, source.output_schema_json, source.validation_rules_json);

MERGE ai_agent_capabilities AS target
USING (
  SELECT a.id AS agent_id, CONCAT(a.domain, '_execution') AS capability, 'workflow_stage' AS input_type, ag.output_type AS output_type
  FROM ai_agents a JOIN @agents ag ON ag.code = a.code
) AS source
ON target.agent_id = source.agent_id AND target.capability = source.capability
WHEN NOT MATCHED THEN INSERT (agent_id, capability, input_type, output_type)
VALUES (source.agent_id, source.capability, source.input_type, source.output_type);

MERGE ai_agent_prompts AS target
USING (
  SELECT a.id AS agent_id, CONCAT(a.code, '_DEFAULT') AS code, CONCAT(a.name, ' Default Prompt') AS name
  FROM ai_agents a JOIN @agents ag ON ag.code = a.code
) AS source
ON target.agent_id = source.agent_id AND target.code = source.code
WHEN NOT MATCHED THEN INSERT (agent_id, code, name) VALUES (source.agent_id, source.code, source.name);

MERGE ai_agent_prompt_versions AS target
USING (
  SELECT p.id AS prompt_id, 1 AS version,
         'You are a CACSMS production agent. Return concise structured JSON only.' AS system_prompt,
         'Objective: {{objective}}. Context: {{context}}. Constraints: {{constraints}}.' AS user_prompt_template,
         '{"objective":"string","context":"object","constraints":"object"}' AS variables_json,
         v.output_schema_json
  FROM ai_agent_prompts p
  JOIN ai_agent_versions v ON v.agent_id = p.agent_id AND v.version = 1
) AS source
ON target.prompt_id = source.prompt_id AND target.version = source.version
WHEN NOT MATCHED THEN INSERT (prompt_id, version, system_prompt, user_prompt_template, variables_json, output_schema_json, approval_status, test_status, is_active)
VALUES (source.prompt_id, source.version, source.system_prompt, source.user_prompt_template, source.variables_json, source.output_schema_json, 'approved', 'seeded', 1);

MERGE ai_agent_tools AS target
USING (VALUES
  ('WEB_RESEARCH','Web Research','web research','Search approved sources and return provenance.','ai.agents.execute'),
  ('INTERNAL_KNOWLEDGE','Internal Knowledge','internal knowledge','Retrieve tenant-isolated knowledge records.','ai.agents.execute'),
  ('DATABASE_QUERY','Database Query','database query','Read approved CACSMS database views.','ai.agents.execute'),
  ('OUTPUT_STORAGE','Output Storage','storage','Persist structured outputs and assets.','ai.agents.execute'),
  ('WORKFLOW_ACTION','Workflow Action','workflow actions','Report progress to the workflow engine.','workflow.execute'),
  ('NOTIFICATION','Notification','notification','Emit notifications for review and failures.','ai.agents.execute'),
  ('MODERATION','Moderation','moderation','Validate safety, compliance, and policy constraints.','ai.agents.execute')
) AS source(code, name, category, description, required_permission)
ON target.agent_id IS NULL AND target.code = source.code
WHEN MATCHED THEN UPDATE SET name = source.name, category = source.category, description = source.description, required_permission = source.required_permission, status = 'enabled', updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (agent_id, code, name, category, description, input_schema_json, output_schema_json, required_permission, allowed_agents_json, status)
VALUES (NULL, source.code, source.name, source.category, source.description, '{"type":"object"}', '{"type":"object"}', source.required_permission, '["*"]', 'enabled');

IF @content IS NOT NULL
BEGIN
  MERGE workflow_stages AS target
  USING (VALUES
    (@org, @content, 'idea_created', 'Idea Created', 1, 4.55, 'manual'),
    (@org, @content, 'research', 'Research', 2, 4.55, 'parallel'),
    (@org, @content, 'research_synthesis', 'Research Synthesis', 3, 4.55, 'sequential'),
    (@org, @content, 'opportunity_scoring', 'Opportunity Scoring', 4, 4.55, 'sequential'),
    (@org, @content, 'strategy', 'Strategy', 5, 4.55, 'sequential'),
    (@org, @content, 'outline', 'Outline', 6, 4.55, 'sequential'),
    (@org, @content, 'script', 'Script', 7, 4.55, 'sequential'),
    (@org, @content, 'fact_checking', 'Fact Checking', 8, 4.55, 'parallel'),
    (@org, @content, 'creative', 'Creative', 9, 4.55, 'parallel'),
    (@org, @content, 'voice', 'Voice', 10, 4.55, 'sequential'),
    (@org, @content, 'video', 'Video', 11, 4.55, 'sequential'),
    (@org, @content, 'captions', 'Captions and Subtitles', 12, 4.55, 'parallel'),
    (@org, @content, 'seo', 'SEO Metadata', 13, 4.55, 'parallel'),
    (@org, @content, 'quality_compliance', 'Quality and Compliance', 14, 4.55, 'parallel'),
    (@org, @content, 'approval', 'Approval', 15, 4.55, 'human_in_the_loop'),
    (@org, @content, 'scheduling', 'Scheduling', 16, 4.55, 'sequential'),
    (@org, @content, 'publishing', 'Publishing', 17, 4.55, 'sequential'),
    (@org, @content, 'analytics_collection', 'Analytics Collection', 18, 4.55, 'parallel'),
    (@org, @content, 'learning_feedback', 'Learning Feedback', 19, 4.55, 'parallel'),
    (@org, @content, 'completed', 'Completed', 20, 13.55, 'system')
  ) AS source(organization_id, workflow_definition_id, stage_code, name, sequence_no, weight_percent, execution_mode)
  ON target.workflow_definition_id = source.workflow_definition_id AND target.stage_code = source.stage_code
  WHEN MATCHED THEN UPDATE SET name = source.name, display_order = source.sequence_no, sequence_no = source.sequence_no, execution_mode = source.execution_mode, weight_percent = source.weight_percent, status = 'active', updated_at = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (organization_id, workflow_definition_id, stage_code, name, display_order, sequence_no, stage_type, execution_mode, weight_percent, required_permission, status)
  VALUES (source.organization_id, source.workflow_definition_id, source.stage_code, source.name, source.sequence_no, source.sequence_no, 'ai_task', source.execution_mode, source.weight_percent, 'workflow.execute', 'active');

  DECLARE @map TABLE(stage_code NVARCHAR(120), agent_code NVARCHAR(120), execution_order INT, execution_mode NVARCHAR(40), required BIT);
  INSERT INTO @map(stage_code, agent_code, execution_order, execution_mode, required) VALUES
  ('research','TREND_DISCOVERY',1,'parallel',1),
  ('research','KEYWORD_RESEARCH',1,'parallel',1),
  ('research','COMPETITOR_INTELLIGENCE',1,'parallel',1),
  ('research','AUDIENCE_RESEARCH',1,'parallel',1),
  ('research_synthesis','SOURCE_VERIFICATION',1,'sequential',1),
  ('opportunity_scoring','OPPORTUNITY_SCORING',1,'sequential',1),
  ('strategy','CONTENT_STRATEGY',1,'sequential',1),
  ('outline','OUTLINE',1,'sequential',1),
  ('script','SCRIPT_WRITER',1,'sequential',1),
  ('fact_checking','FACT_CHECKER',1,'parallel',1),
  ('fact_checking','CITATION_VERIFICATION',1,'parallel',1),
  ('creative','STORYBOARD',1,'parallel',1),
  ('creative','IMAGE_PROMPT',1,'parallel',1),
  ('creative','THUMBNAIL',1,'parallel',1),
  ('voice','VOICE_SELECTION',1,'sequential',1),
  ('voice','NARRATION',2,'sequential',1),
  ('video','SCENE_GENERATION',1,'sequential',1),
  ('video','VIDEO_EDITING',2,'sequential',1),
  ('video','RENDER',3,'sequential',1),
  ('video','VIDEO_QUALITY',4,'sequential',1),
  ('captions','CAPTION',1,'parallel',1),
  ('captions','SUBTITLE',1,'parallel',1),
  ('seo','TITLE_OPTIMIZATION',1,'parallel',1),
  ('seo','DESCRIPTION',1,'parallel',1),
  ('seo','TAG',1,'parallel',1),
  ('seo','HASHTAG',1,'parallel',1),
  ('quality_compliance','BRAND_COMPLIANCE',1,'parallel',1),
  ('quality_compliance','PLATFORM_POLICY',1,'parallel',1),
  ('quality_compliance','COPYRIGHT_RISK',1,'parallel',1),
  ('scheduling','SCHEDULING',1,'sequential',1),
  ('publishing','PLATFORM_FORMATTING',1,'sequential',1),
  ('publishing','PUBLISHING',2,'sequential',1),
  ('analytics_collection','PERFORMANCE_COLLECTION',1,'parallel',1),
  ('analytics_collection','CTR_ANALYSIS',1,'parallel',1),
  ('analytics_collection','RETENTION_ANALYSIS',1,'parallel',1),
  ('learning_feedback','FEEDBACK_EXTRACTION',1,'parallel',1),
  ('learning_feedback','PROMPT_OPTIMIZATION',1,'parallel',1),
  ('learning_feedback','STRATEGY_RECOMMENDATION',1,'parallel',1);

  MERGE workflow_stage_agent_mappings AS target
  USING (
    SELECT @content AS workflow_definition_id, ws.id AS workflow_stage_id, a.id AS agent_id, m.execution_order, m.execution_mode, m.required, ws.timeout_seconds, a.max_retries
    FROM @map m
    JOIN workflow_stages ws ON ws.workflow_definition_id = @content AND ws.stage_code = m.stage_code
    JOIN ai_agents a ON a.code = m.agent_code
  ) AS source
  ON target.workflow_stage_id = source.workflow_stage_id AND target.agent_id = source.agent_id
  WHEN MATCHED THEN UPDATE SET execution_order = source.execution_order, execution_mode = source.execution_mode, required = source.required, updated_at = SYSUTCDATETIME()
  WHEN NOT MATCHED THEN INSERT (workflow_definition_id, workflow_stage_id, agent_id, execution_order, execution_mode, required, input_mapping, output_mapping, timeout_seconds, max_retries)
  VALUES (source.workflow_definition_id, source.workflow_stage_id, source.agent_id, source.execution_order, source.execution_mode, source.required, '{"from":"workflow.context"}', '{"to":"agent.outputs"}', COALESCE(source.timeout_seconds, 120), source.max_retries);
END;

IF NOT EXISTS (SELECT 1 FROM ai_cost_budgets WHERE organization_id = @org AND scope_type = 'organization')
  INSERT INTO ai_cost_budgets(organization_id, scope_type, budget_amount, warning_threshold_percent, hard_limit)
  VALUES (@org, 'organization', 0, 80, 1);
END;
