DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50042, 'No organization exists for Simulation Studio seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

DECLARE @perms TABLE(code NVARCHAR(120), description NVARCHAR(255));
INSERT INTO @perms VALUES ('simulation.view','View Agent Simulation Studio'),('simulation.create','Create simulations'),('simulation.run','Run simulations'),('simulation.export','Export simulation results');
MERGE permissions AS target USING (SELECT code,description FROM @perms) source ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL INSERT INTO role_permissions(role_id,permission_id)
SELECT @adminRole,p.id FROM permissions p JOIN @perms x ON x.code=p.code WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target USING (SELECT @org organization_id, 'simulation' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=99, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',99);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES ('SIMULATION_CREATE_SCENARIO','Simulation Create Scenario'),('SIMULATION_DIGITAL_TWIN_CLONE','Simulation Digital Twin Clone'),('SIMULATION_RUN_SCENARIO','Simulation Run Scenario'),('SIMULATION_HISTORICAL_REPLAY','Simulation Historical Replay'),('SIMULATION_FORECAST','Simulation Forecast'),('SIMULATION_CHAOS_TEST','Simulation Chaos Test'),('SIMULATION_COMPARE_RESULTS','Simulation Compare Results');
MERGE workflow_definitions AS target USING (SELECT @org organization_id, code, name, 'simulation' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_business_forecasts WHERE organization_id=@org; DELETE FROM ai_stress_tests WHERE organization_id=@org; DELETE FROM ai_load_tests WHERE organization_id=@org; DELETE FROM ai_chaos_tests WHERE organization_id=@org; DELETE FROM ai_failure_injection WHERE organization_id=@org; DELETE FROM ai_simulation_results WHERE organization_id=@org; DELETE FROM ai_predictions WHERE organization_id=@org; DELETE FROM ai_scenarios WHERE organization_id=@org; DELETE FROM ai_digital_twins WHERE organization_id=@org; DELETE FROM ai_simulation_lifecycle WHERE organization_id=@org; DELETE FROM ai_simulation_types WHERE organization_id=@org; DELETE FROM ai_simulations WHERE organization_id=@org;

DECLARE @types TABLE(i INT IDENTITY(1,1), name NVARCHAR(120));
INSERT INTO @types(name) VALUES ('Workflow Simulation'),('Agent Simulation'),('Prompt Simulation'),('Model Simulation'),('Provider Simulation'),('Tool Simulation'),('Memory Simulation'),('Knowledge Simulation'),('RAG Simulation'),('Publishing Simulation'),('Audience Simulation'),('Recovery Simulation'),('Security Simulation'),('Governance Simulation'),('Cost Simulation'),('Latency Simulation'),('Business Simulation');
INSERT INTO ai_simulation_types(organization_id,type_name,active_runs,success_rate,confidence,last_run_at)
SELECT @org,name,CASE WHEN i%5=0 THEN 1 ELSE 0 END,94.5+(i%5)*0.7,93.8+(i%4),DATEADD(hour,-i,SYSUTCDATETIME()) FROM @types;

INSERT INTO ai_simulation_lifecycle(organization_id,sequence_no,stage_name,run_count,success_count,average_duration_ms,health_percent) VALUES
(@org,1,'Create Scenario',128,126,120,98),(@org,2,'Clone Production',128,127,250,98),(@org,3,'Build Digital Twin',128,126,420,97),(@org,4,'Inject Inputs',128,126,180,98),(@org,5,'Execute',128,123,1150,96),(@org,6,'Observe',128,126,230,98),(@org,7,'Collect Metrics',128,126,210,98),(@org,8,'Compare',128,125,260,97),(@org,9,'Predict',128,124,340,97),(@org,10,'Recommend',128,124,190,97);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<128)
INSERT INTO ai_simulations(organization_id,simulation_code,scenario_name,simulation_type,environment_name,status,confidence,predicted_cost,predicted_latency_ms,predicted_quality,predicted_revenue,deployment_ready,business_outcome,created_at)
SELECT @org,CONCAT('SIM-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),CONCAT('Autonomous what-if scenario ',i),(SELECT name FROM @types WHERE i=1+((n.i-1)%17)),'Sandbox',CASE WHEN i<=12 THEN 'Running' ELSE 'Completed' END,90+(i%9),1200+(i*13),400+(i%90),88+(i%11),4200+(i*37),CASE WHEN i%13=0 THEN 0 ELSE 1 END,'deployment forecast generated without production impact',DATEADD(minute,-i,SYSUTCDATETIME()) FROM n OPTION (MAXRECURSION 0);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<24)
INSERT INTO ai_digital_twins(organization_id,twin_code,twin_name,cloned_agents,cloned_memory_sources,cloned_knowledge_sources,cloned_workflows,cloned_queues,cloned_publishing_channels,sync_state,fidelity_percent,created_at)
SELECT @org,CONCAT('TWIN-',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)),CONCAT('Production digital twin ',i),24+(i%18),8+(i%8),12+(i%10),6+(i%6),3+(i%4),4+(i%5),'Synced',96+(i%4),DATEADD(day,-i,SYSUTCDATETIME()) FROM n OPTION (MAXRECURSION 0);

INSERT INTO ai_scenarios(organization_id,scenario_code,scenario_name,input_profile,traffic_multiplier,budget_multiplier,publishing_mode,scenario_state)
SELECT TOP 48 @org,CONCAT('SCN-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),scenario_name,'agents, prompts, models, tools, knowledge, memory, users, traffic, publishing and budget',1+(ROW_NUMBER() OVER (ORDER BY simulation_code)%100),1+(ROW_NUMBER() OVER (ORDER BY simulation_code)%5)*0.25,'sandbox publishing','Ready' FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
INSERT INTO ai_predictions(organization_id,simulation_id,prediction_name,prediction_value,accuracy_percent,forecast_window) SELECT @org,id,'quality',predicted_quality,95,'7 days' FROM ai_simulations WHERE organization_id=@org UNION ALL SELECT @org,id,'revenue',predicted_revenue,94,'30 days' FROM ai_simulations WHERE organization_id=@org;
INSERT INTO ai_simulation_results(organization_id,simulation_id,result_name,baseline_value,simulated_value,variance_percent,result_state) SELECT @org,id,'cost',1000,predicted_cost,(predicted_cost-1000)/10,'Measured' FROM ai_simulations WHERE organization_id=@org UNION ALL SELECT @org,id,'latency',500,predicted_latency_ms,(predicted_latency_ms-500)/5,'Measured' FROM ai_simulations WHERE organization_id=@org;
INSERT INTO ai_failure_injection(organization_id,failure_code,failure_type,target_component,recovery_path,recovered,recovery_seconds) SELECT TOP 32 @org,CONCAT('FAIL-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),CASE ROW_NUMBER() OVER (ORDER BY simulation_code)%10 WHEN 0 THEN 'Provider Failure' WHEN 1 THEN 'Tool Failure' WHEN 2 THEN 'Queue Failure' WHEN 3 THEN 'Worker Failure' WHEN 4 THEN 'Memory Failure' WHEN 5 THEN 'Knowledge Failure' WHEN 6 THEN 'RAG Failure' WHEN 7 THEN 'Publishing Failure' WHEN 8 THEN 'Database Failure' ELSE 'Redis Failure' END,simulation_type,'fallback, retry, rollback and recovery simulation',1,20+(ROW_NUMBER() OVER (ORDER BY simulation_code)%80) FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
INSERT INTO ai_chaos_tests(organization_id,chaos_code,chaos_type,blast_radius,resilience_score,test_state) SELECT TOP 28 @org,CONCAT('CHS-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),CASE ROW_NUMBER() OVER (ORDER BY simulation_code)%7 WHEN 0 THEN 'Random Failures' WHEN 1 THEN 'Network Delay' WHEN 2 THEN 'Slow Responses' WHEN 3 THEN 'Timeouts' WHEN 4 THEN 'Credential Expiry' WHEN 5 THEN 'Quota Exhaustion' ELSE 'Rate Limits' END,'sandbox only',92+(ROW_NUMBER() OVER (ORDER BY simulation_code)%7),'Completed' FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
INSERT INTO ai_load_tests(organization_id,load_code,load_type,concurrent_units,throughput_per_minute,p95_latency_ms,pass_state) SELECT TOP 24 @org,CONCAT('LOAD-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),simulation_type,100+(ROW_NUMBER() OVER (ORDER BY simulation_code)*10),500+(ROW_NUMBER() OVER (ORDER BY simulation_code)*18),450+(ROW_NUMBER() OVER (ORDER BY simulation_code)%120),'Passed' FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
INSERT INTO ai_stress_tests(organization_id,stress_code,stress_type,max_units,saturation_percent,breaking_point,pass_state) SELECT TOP 24 @org,CONCAT('STR-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),simulation_type,1000+(ROW_NUMBER() OVER (ORDER BY simulation_code)*40),72+(ROW_NUMBER() OVER (ORDER BY simulation_code)%18),'controlled sandbox saturation','Passed' FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
INSERT INTO ai_business_forecasts(organization_id,forecast_code,forecast_name,predicted_views,predicted_revenue,confidence,deployment_confidence) SELECT TOP 40 @org,CONCAT('FCST-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY simulation_code) AS NVARCHAR(3)),3)),scenario_name,100000+(ROW_NUMBER() OVER (ORDER BY simulation_code)*2500),predicted_revenue,94+(ROW_NUMBER() OVER (ORDER BY simulation_code)%5),92+(ROW_NUMBER() OVER (ORDER BY simulation_code)%6) FROM ai_simulations WHERE organization_id=@org ORDER BY simulation_code;
