SET NOCOUNT ON;

DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE name IN ('Administrator','Admin') ORDER BY created_at);
DECLARE @queueId UNIQUEIDENTIFIER;

MERGE permissions AS target
USING (VALUES
('ai_agent_runs.view','View active agent runs'),('ai_agent_runs.view_details','View active agent run details'),('ai_agent_runs.view_trace','View active agent traces'),('ai_agent_runs.diagnose','Run active-run diagnostics'),('ai_agent_runs.recalculate_priority','Recalculate active-run priorities'),('ai_agent_runs.rebalance','Rebalance active agent workloads'),('ai_agent_runs.export','Export active agent runs'),('ai_agent_runs.emergency_control','Use emergency active-run controls')
) AS source(code, description)
ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description
WHEN NOT MATCHED THEN INSERT (code, description) VALUES (source.code, source.description);

INSERT INTO role_permissions(role_id, permission_id)
SELECT @adminRole, p.id FROM permissions p
WHERE @adminRole IS NOT NULL AND p.code LIKE 'ai_agent_runs.%'
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target
USING (SELECT @org AS organization_id, 'ai-agent-runs' AS name) AS source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=97, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',97);
SET @queueId = (SELECT TOP 1 id FROM job_queues WHERE organization_id=@org AND name='ai-agent-runs');

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('ACTIVE_AGENT_RUN_SCAN','Active Agent Run Scan'),('AGENT_RUN_PRIORITY_RECALCULATION','Agent Run Priority Recalculation'),('AGENT_RUN_WORKLOAD_REBALANCE','Agent Run Workload Rebalance'),('AGENT_RUN_AUTONOMOUS_RECOVERY','Agent Run Autonomous Recovery'),('AGENT_RUN_CONTEXT_REBUILD','Agent Run Context Rebuild'),('AGENT_RUN_OUTPUT_REVALIDATION','Agent Run Output Revalidation'),('AGENT_RUN_PROVIDER_FAILOVER','Agent Run Provider Failover'),('AGENT_RUN_MODEL_FAILOVER','Agent Run Model Failover'),('AGENT_RUN_FINAL_OUTPUT_VALIDATION','Agent Run Final Output Validation');
MERGE workflow_definitions AS target
USING (SELECT @org AS organization_id, code, name, 'active_agent_runs' AS workflow_type FROM @wf) AS source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DECLARE @recoveryDef UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM workflow_definitions WHERE organization_id=@org AND code='AGENT_RUN_AUTONOMOUS_RECOVERY');
IF OBJECT_ID('workflow_stages','U') IS NOT NULL AND @recoveryDef IS NOT NULL
BEGIN
  DELETE FROM workflow_stages WHERE workflow_definition_id=@recoveryDef;
  INSERT INTO workflow_stages(organization_id,workflow_definition_id,stage_code,name,display_order)
  VALUES
  (@org,@recoveryDef,'failure_detected','Run Failure Detected',1),(@org,@recoveryDef,'signal_validated','Failure Signal Validated',2),(@org,@recoveryDef,'context_preserved','Run Context Preserved',3),(@org,@recoveryDef,'failure_classified','Failure Classified',4),(@org,@recoveryDef,'dependencies_checked','Dependencies Checked',5),(@org,@recoveryDef,'policy_selected','Recovery Policy Selected',6),(@org,@recoveryDef,'guardrails_evaluated','Guardrails Evaluated',7),(@org,@recoveryDef,'checkpoint_restored','Checkpoint Restored',8),(@org,@recoveryDef,'fallback_selected','Provider, Model, Prompt, Tool, Worker, or Queue Fallback Selected',9),(@org,@recoveryDef,'recovery_executed','Recovery Executed',10),(@org,@recoveryDef,'output_revalidated','Output Revalidated',11),(@org,@recoveryDef,'workflow_stage_updated','Workflow Stage Updated',12),(@org,@recoveryDef,'final_output_verified','Final-Output Impact Verified',13),(@org,@recoveryDef,'metrics_recorded','Metrics Recorded',14),(@org,@recoveryDef,'learning_updated','Learning Updated',15),(@org,@recoveryDef,'run_resumed_or_escalated','Run Resumed or Escalated',16);
END;

DELETE FROM ai_agent_run_audit_links WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_metrics WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_incident_links WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_final_output_links WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_autonomous_decisions WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_handoffs WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_collaborations WHERE parent_run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%') OR child_run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_priorities WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_risks WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_tokens WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_costs WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_checkpoints WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_recoveries WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_retries WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_failures WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_output_validations WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_outputs WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_tool_calls WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_model_decisions WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_provider_decisions WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_prompt_resolutions WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_memory WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_context_items WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_context WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_plan_steps WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_plans WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_run_steps WHERE run_id IN (SELECT id FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%');
DELETE FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';

;WITH n AS (
  SELECT 1 AS i UNION ALL SELECT i + 1 FROM n WHERE i < 246
), src AS (
  SELECT
    i,
    CASE WHEN i<=174 THEN 'Running' WHEN i<=192 THEN 'Planning' WHEN i<=208 THEN 'Waiting on Tool' WHEN i<=222 THEN 'Validating Output' WHEN i<=231 THEN 'Retrying' WHEN i<=242 THEN 'Recovering' ELSE 'Waiting on Dependency' END AS status,
    CASE WHEN i<=174 THEN 52 + (i % 43) WHEN i<=192 THEN 18 + (i % 28) WHEN i<=208 THEN 41 + (i % 24) WHEN i<=222 THEN 76 + (i % 17) WHEN i<=231 THEN 38 + (i % 20) WHEN i<=242 THEN 48 + (i % 22) ELSE 31 + (i % 10) END AS progress,
    ROW_NUMBER() OVER (ORDER BY i) AS rn
  FROM n
), agents AS (
  SELECT ag.*, ROW_NUMBER() OVER (ORDER BY ag.domain, ag.code) AS agent_row, COUNT(*) OVER () AS agent_count
  FROM ai_agents ag
  WHERE ag.organization_id=@org AND ag.code LIKE 'AG-%'
)
INSERT INTO ai_agent_runs(organization_id, agent_id, agent_version, workflow_instance_id, workflow_stage_id, task_id, status, progress_percent, provider_id, model_id, input_reference, output_reference, confidence_score, quality_score, risk_score, started_at, estimated_completion_at, latency_ms, input_tokens, output_tokens, estimated_cost, actual_cost, retry_count, correlation_id, effective_priority, current_step_code, queue_name, worker_id, recovery_state, output_state, final_output_impact, deadline_risk, organization_name, brand_name, objective, created_at, updated_at)
SELECT
  @org,
  a.id,
  a.current_version,
  NULL,
  NULL,
  NEWID(),
  s.status,
  s.progress,
  a.preferred_provider_id,
  a.preferred_model_id,
  CONCAT('context:', RIGHT('0000' + CAST(s.i AS NVARCHAR(4)),4)),
  CONCAT('output:', RIGHT('0000' + CAST(s.i AS NVARCHAR(4)),4)),
  CAST(CASE WHEN s.i % 17 = 0 THEN 86.4 ELSE 90.2 + (s.i % 8) * 0.45 END AS DECIMAL(8,4)),
  CAST(CASE WHEN s.i % 19 = 0 THEN 87.2 ELSE 91.1 + (s.i % 7) * 0.38 END AS DECIMAL(8,2)),
  CAST(CASE WHEN s.i > 242 THEN 64 ELSE 18 + (s.i % 24) END AS DECIMAL(8,2)),
  DATEADD(MINUTE, -1 * (8 + s.i), SYSUTCDATETIME()),
  DATEADD(MINUTE, 18 + (s.i % 28), SYSUTCDATETIME()),
  900 + (s.i % 18) * 140,
  2400 + (s.i * 37),
  680 + (s.i * 13),
  CAST(0.42 + (s.i % 12) * 0.18 AS DECIMAL(18,6)),
  CAST(0.28 + (s.i % 12) * 0.16 AS DECIMAL(18,6)),
  CASE WHEN s.status IN ('Retrying','Recovering') THEN 1 + (s.i % 3) ELSE 0 END,
  CONCAT('AAR-', RIGHT('0000' + CAST(s.i AS NVARCHAR(4)),4)),
  CASE WHEN s.i % 41 = 0 THEN 'Critical' WHEN s.i % 17 = 0 THEN 'Urgent' WHEN s.i % 5 = 0 THEN 'High' ELSE 'Normal' END,
  CASE s.status WHEN 'Planning' THEN 'planning' WHEN 'Waiting on Tool' THEN 'tool_call_wait' WHEN 'Validating Output' THEN 'output_validation' WHEN 'Retrying' THEN 'retry_step' WHEN 'Recovering' THEN 'autonomous_recovery' ELSE 'agent_execution' END,
  'ai-agent-runs',
  CONCAT('agent-worker-', 1 + (s.i % 18)),
  CASE WHEN s.status='Recovering' THEN 'Recovery active' WHEN s.status='Retrying' THEN 'Retrying inside guardrail' ELSE 'Not required' END,
  CASE WHEN s.status='Validating Output' THEN 'Validating' WHEN s.status IN ('Running','Planning') THEN 'In progress' ELSE 'Partial' END,
  CASE WHEN s.i > 242 THEN 'At risk' ELSE 'On track' END,
  CASE WHEN s.i > 242 THEN 1 ELSE 0 END,
  'AI Media Group',
  CASE WHEN s.i % 4 = 0 THEN 'CACSMS Contents' WHEN s.i % 4 = 1 THEN 'Executive Media' WHEN s.i % 4 = 2 THEN 'Creator Ops' ELSE 'Learning Studio' END,
  CONCAT('Autonomously complete ', a.domain, ' work package ', RIGHT('0000' + CAST(s.i AS NVARCHAR(4)),4), ' and contribute validated output to the content lifecycle.'),
  SYSUTCDATETIME(),
  SYSUTCDATETIME()
FROM src s
JOIN agents a ON a.agent_row = ((s.i - 1) % a.agent_count) + 1
OPTION (MAXRECURSION 0);

INSERT INTO ai_agent_run_steps(run_id, step_code, step_name, status, started_at, completed_at, duration_ms)
SELECT r.id, v.code, v.name,
CASE WHEN v.seq * 7 <= r.progress_percent THEN 'Completed' WHEN r.current_step_code=v.code THEN r.status WHEN r.status='Recovering' AND v.seq > 8 THEN 'Recovering' ELSE 'Pending' END,
DATEADD(MINUTE, v.seq * -3, r.started_at),
CASE WHEN v.seq * 7 <= r.progress_percent THEN DATEADD(MINUTE, v.seq * -2, SYSUTCDATETIME()) ELSE NULL END,
18000 + v.seq * 1200
FROM ai_agent_runs r
CROSS APPLY (VALUES
(1,'task_received','Task Received'),(2,'context_building','Context Building'),(3,'planning','Planning'),(4,'agent_selection','Agent Selection'),(5,'provider_model_routing','Provider and Model Routing'),(6,'prompt_resolution','Prompt Resolution'),(7,'tool_preparation','Tool Preparation'),(8,'execution','Execution'),(9,'tool_calls','Tool Calls'),(10,'output_generation','Output Generation'),(11,'validation','Validation'),(12,'workflow_update','Workflow Update'),(13,'final_result_contribution','Final Result Contribution'),(14,'completed','Completed')
) v(seq, code, name)
WHERE r.correlation_id LIKE 'AAR-%';

INSERT INTO ai_agent_run_plans(run_id, planning_confidence, plan_revisions, dependencies)
SELECT id, confidence_score, CASE WHEN status='Planning' THEN 1 ELSE 0 END, 'workflow stage, provider health, tool availability' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_plan_steps(run_id, step_name, status, sequence_no, parallel_group)
SELECT r.id, CONCAT('Plan step ', v.seq), CASE WHEN v.seq <= 3 THEN 'Completed' WHEN r.status='Planning' AND v.seq=4 THEN 'Active' ELSE 'Pending' END, v.seq, CASE WHEN v.seq IN (2,3) THEN 'parallel-research' ELSE NULL END
FROM ai_agent_runs r CROSS APPLY (VALUES(1),(2),(3),(4),(5),(6)) v(seq) WHERE r.correlation_id LIKE 'AAR-%';

INSERT INTO ai_agent_run_context(run_id, context_size, context_limit, relevance_score, provenance_score, memory_sources, retrieval_sources, duplicate_context, stale_context, sensitive_data_status, isolation_status, overflow_risk)
SELECT id, 18000 + (input_tokens % 9000), 64000, 92 + (input_tokens % 5), 95 + (output_tokens % 4), 'workflow, brand, audience, memory', 'brand memory, topic library, validated outputs', 0, CASE WHEN retry_count>1 THEN 1 ELSE 0 END, 'clear', 'tenant isolated', CASE WHEN input_tokens > 10000 THEN 'watch' ELSE 'low' END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_context_items(run_id,item_type,source_name,relevance_score,provenance) SELECT id,'workflow','Content Lifecycle Workflow',94,'database' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_memory(run_id,memory_type,source_name,status) SELECT id,'brand','CACSMS brand memory','healthy' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_prompt_resolutions(run_id,prompt_code,prompt_version,output_schema,approval_state,fallback_prompt) SELECT r.id, CONCAT('PROMPT-',a.code), r.agent_version, 'validated JSON output', 'Approved', 'standard fallback prompt' FROM ai_agent_runs r JOIN ai_agents a ON a.id=r.agent_id WHERE r.correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_provider_decisions(run_id,primary_provider,selected_provider,routing_reason,quality_estimate,latency_estimate_ms,cost_estimate,health_status,rate_limit_status,fallback_readiness) SELECT id,'OpenAI',CASE WHEN retry_count>0 THEN 'OpenAI fallback region' ELSE 'OpenAI' END,'quality, latency, cost, context, tool support, provider health, policy',confidence_score,latency_ms,estimated_cost,'healthy',CASE WHEN status='Waiting on Dependency' THEN 'watch' ELSE 'clear' END,'ready' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_model_decisions(run_id,primary_model,selected_model,context_compatibility,routing_policy,model_health) SELECT id,'gpt-5',CASE WHEN retry_count>1 THEN 'gpt-5-mini fallback' ELSE 'gpt-5' END,'compatible','quality first within cost guardrail','healthy' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_tool_calls(run_id,tool_call_code,tool_name,category,status,started_at,duration_ms,retry_count,input_size,output_size,cost,rate_limit_status,permission_result,output_validation) SELECT id,CONCAT('TC-',RIGHT(correlation_id,4)),'workflow.database.read','database',CASE WHEN status='Waiting on Tool' THEN 'Running' ELSE 'Completed' END,started_at,latency_ms,retry_count,1200,4200,0.08,'clear','allowed','passed' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_outputs(run_id,output_type,current_output,output_version,storage_status) SELECT id,'workflow-stage contribution','validated partial output',1,'stored' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_output_validations(run_id,validation_state,quality_score,confidence_score,fact_check_score,citation_coverage,brand_score,copyright_risk,platform_policy_status,schema_validation,approval_readiness,final_output_readiness) SELECT id,CASE WHEN status='Validating Output' THEN 'Validating' WHEN output_state='Partial' THEN 'Passed with Warning' ELSE 'Passed' END,quality_score,confidence_score,93,92,96,3,'passed','passed','ready',CASE WHEN deadline_risk=1 THEN 82 ELSE 97 END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_failures(run_id,failure_detected,failure_category,diagnosis) SELECT id,CASE WHEN status IN ('Retrying','Recovering') THEN 1 ELSE 0 END,CASE WHEN status='Recovering' THEN 'provider latency' WHEN status='Retrying' THEN 'tool retry' ELSE NULL END,CASE WHEN status IN ('Retrying','Recovering') THEN 'Autonomous recovery selected inside approved guardrails.' ELSE NULL END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_retries(run_id,retry_no,reason,outcome) SELECT id,retry_count,'transient provider or tool latency','retry progressing' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' AND retry_count>0;
INSERT INTO ai_agent_run_recoveries(run_id,failure,diagnosis,strategy,policy,confidence,attempt,progress_percent,estimated_recovery_seconds,cost_impact,final_output_impact,outcome) SELECT id,'provider/tool latency','Recovery policy selected after checkpoint validation','Switch Provider','standard agent recovery',91,retry_count,progress_percent,180,0.18,final_output_impact,recovery_state FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' AND status IN ('Recovering','Retrying');
INSERT INTO ai_agent_run_checkpoints(run_id,checkpoint_code,status) SELECT id,CONCAT('CHK-',RIGHT(correlation_id,4)),'current' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_costs(run_id,input_token_cost,output_token_cost,tool_cost,worker_cost,storage_cost,recovery_cost,cost_ceiling,budget_variance) SELECT id,estimated_cost*0.32,estimated_cost*0.28,0.08,0.05,0.02,CASE WHEN retry_count>0 THEN 0.18 ELSE 0 END,5.00,actual_cost-estimated_cost FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_tokens(run_id,context_tokens,cached_tokens,wasted_tokens) SELECT id,input_tokens+output_tokens,1200 + (input_tokens % 500),CASE WHEN retry_count>1 THEN 180 ELSE 32 END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_risks(run_id,risk_type,score,evidence,policy,guardrail,autonomous_action,outcome) SELECT id,CASE WHEN deadline_risk=1 THEN 'Deadline risk' WHEN confidence_score<89 THEN 'Low confidence' ELSE 'Provider latency' END,risk_score,'live metrics and workflow deadline forecast','agent run guardrails','quality and final-output minimums','route, retry, or recover autonomously','contained' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' AND (deadline_risk=1 OR retry_count>0 OR confidence_score<89);
INSERT INTO ai_agent_run_priorities(run_id,base_priority,adjustments,final_priority,policy,confidence,expected_effect) SELECT id,'Normal','workflow priority, SLA, final-output impact, wait time, provider health',effective_priority,'active run priority policy',94,'protect publishing and final output deadlines' FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_autonomous_decisions(run_id,detection,decision,policy,confidence,risk,cost_impact,deadline_impact,final_output_impact,outcome,human_input_required) SELECT id,CASE WHEN status='Recovering' THEN 'provider latency detected' WHEN status='Waiting on Tool' THEN 'tool wait detected' ELSE 'run health evaluated' END,CASE WHEN status='Recovering' THEN 'Switched provider after rate limit and resumed from checkpoint' WHEN status='Waiting on Tool' THEN 'Retried tool with alternate route' ELSE 'Maintained current route under guardrail' END,'autonomous active-run supervision',confidence_score,CASE WHEN deadline_risk=1 THEN 'medium' ELSE 'low' END,0.12,CASE WHEN deadline_risk=1 THEN 'mitigating' ELSE 'protected' END,final_output_impact,'active',0 FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' AND (status IN ('Recovering','Waiting on Tool','Retrying') OR deadline_risk=1);
INSERT INTO ai_agent_run_final_output_links(run_id,generated_output,workflow_stage,validation_state,approval_state,publishing_link,analytics_link,learning_link,final_business_result,contribution_rate,current_risk) SELECT r.id,'workflow-stage output',a.domain,CASE WHEN r.status='Validating Output' THEN 'validating' ELSE 'validated' END,'not required','linked','linked','linked','CACSMS content outcome',CASE WHEN r.deadline_risk=1 THEN 82 ELSE 97 END,CASE WHEN r.deadline_risk=1 THEN 'deadline watch' ELSE 'protected' END FROM ai_agent_runs r JOIN ai_agents a ON a.id=r.agent_id WHERE r.correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_metrics(run_id,metric_name,metric_value) SELECT id,'final_output_contribution',CASE WHEN deadline_risk=1 THEN 82 ELSE 97 END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';
INSERT INTO ai_agent_run_audit_links(run_id,audit_reference) SELECT id,CONCAT('audit:',correlation_id) FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%';

;WITH parents AS (SELECT TOP 8 id, ROW_NUMBER() OVER (ORDER BY correlation_id) rn FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' ORDER BY correlation_id),
children AS (SELECT TOP 32 id, ROW_NUMBER() OVER (ORDER BY correlation_id DESC) rn FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' ORDER BY correlation_id DESC)
INSERT INTO ai_agent_run_collaborations(parent_run_id,child_run_id,current_agent,shared_context,shared_outputs,dependency_status,handoff_state,bottleneck,recovery_state)
SELECT p.id,c.id,'Research Synthesis Agent','topic, audience, keyword, competitor context','research brief, outline, validation notes','ready',CASE WHEN c.rn % 5 = 0 THEN 'Validating' ELSE 'Ready' END,'none','not required'
FROM parents p JOIN children c ON ((c.rn - 1) % 8) + 1 = p.rn;

INSERT INTO ai_agent_run_handoffs(run_id,from_agent,to_agent,status)
SELECT TOP 40 id,'Research Agent','Strategy Agent',CASE WHEN retry_count>0 THEN 'Retrying' ELSE 'Ready' END FROM ai_agent_runs WHERE correlation_id LIKE 'AAR-%' ORDER BY correlation_id;
