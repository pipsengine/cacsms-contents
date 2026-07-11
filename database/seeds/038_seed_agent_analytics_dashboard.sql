DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50038, 'No organization exists for Agent Analytics seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

DECLARE @perms TABLE(code NVARCHAR(160), description NVARCHAR(255));
INSERT INTO @perms VALUES
('agent_analytics.view','View agent analytics'),('agent_analytics.view_agents','View agent analytics agents'),('agent_analytics.view_teams','View team analytics'),('agent_analytics.view_tasks','View task analytics'),('agent_analytics.view_quality','View quality analytics'),('agent_analytics.view_cost','View cost analytics'),('agent_analytics.view_reliability','View reliability analytics'),('agent_analytics.view_autonomy','View autonomy analytics'),('agent_analytics.view_business_impact','View business impact analytics'),('agent_analytics.view_sensitive_cost','View sensitive cost'),('agent_analytics.view_revenue','View revenue analytics'),('agent_analytics.create_views','Create analytics views'),('agent_analytics.share_views','Share analytics views'),('agent_analytics.run_anomaly_detection','Run anomaly detection'),('agent_analytics.run_forecasts','Run forecasts'),('agent_analytics.compare','Compare analytics'),('agent_analytics.generate_reports','Generate analytics reports'),('agent_analytics.schedule_reports','Schedule analytics reports'),('agent_analytics.manage_alerts','Manage analytics alerts'),('agent_analytics.apply_recommendations','Apply analytics recommendations'),('agent_analytics.export','Export analytics'),('agent_analytics.manage_settings','Manage analytics settings'),('agent_analytics.manage_governance','Manage analytics governance'),('agent_analytics.emergency_override','Use analytics emergency override');
MERGE permissions AS target USING (SELECT code,description FROM @perms) source ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL INSERT INTO role_permissions(role_id,permission_id)
SELECT @adminRole,p.id FROM permissions p JOIN @perms x ON x.code=p.code WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target USING (SELECT @org organization_id, 'agent-analytics' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);

DECLARE @wf TABLE(code NVARCHAR(140), name NVARCHAR(240));
INSERT INTO @wf VALUES
('AGENT_ANALYTICS_REFRESH','Agent Analytics Refresh'),('AGENT_ANALYTICS_METRIC_CALCULATION','Agent Analytics Metric Calculation'),('AGENT_ANALYTICS_KPI_CALCULATION','Agent Analytics KPI Calculation'),('AGENT_ANALYTICS_ANOMALY_DETECTION','Agent Analytics Anomaly Detection'),('AGENT_ANALYTICS_FORECAST','Agent Analytics Forecast'),('AGENT_ANALYTICS_RECOMMENDATION','Agent Analytics Recommendation'),('AGENT_ANALYTICS_REPORT_GENERATION','Agent Analytics Report Generation'),('AGENT_ANALYTICS_REPORT_DELIVERY','Agent Analytics Report Delivery'),('AGENT_ANALYTICS_ALERT_PROCESSING','Agent Analytics Alert Processing'),('AGENT_ANALYTICS_DATA_QUALITY_CHECK','Agent Analytics Data Quality Check'),('AGENT_ANALYTICS_METRIC_REBUILD','Agent Analytics Metric Rebuild'),('AGENT_ANALYTICS_GOVERNANCE_APPROVAL','Agent Analytics Governance Approval');
MERGE workflow_definitions AS target USING (SELECT @org organization_id, code, name, 'agent_analytics' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM agent_analytics_lineage WHERE organization_id=@org;
DELETE FROM agent_analytics_data_quality WHERE organization_id=@org;
DELETE FROM agent_analytics_alert_rules WHERE organization_id=@org;
DELETE FROM agent_analytics_reports WHERE organization_id=@org;
DELETE FROM agent_analytics_saved_views WHERE organization_id=@org;
DELETE FROM agent_analytics_recommendations WHERE organization_id=@org;
DELETE FROM agent_analytics_leaderboards WHERE organization_id=@org;
DELETE FROM agent_analytics_forecasts WHERE organization_id=@org;
DELETE FROM agent_analytics_anomalies WHERE organization_id=@org;
DELETE FROM agent_analytics_final_output_traceability WHERE organization_id=@org;
DELETE FROM agent_analytics_business_impact WHERE organization_id=@org;
DELETE FROM agent_analytics_panels WHERE organization_id=@org;
DELETE FROM agent_analytics_agents WHERE organization_id=@org;
DELETE FROM agent_analytics_dimensions WHERE organization_id=@org;
DELETE FROM agent_analytics_coverage WHERE organization_id=@org;

DECLARE @coverage TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @coverage VALUES ('Agents',1),('Tasks',2),('Runs',3),('Teams',4),('Workflows',5),('Prompts',6),('Models',7),('Tools',8),('RAG',9),('Memory',10),('Outputs',11),('Publishing',12),('Audience',13),('Revenue',14),('Learning',15),('Business Outcomes',16);
INSERT INTO agent_analytics_coverage(organization_id,stage_name,data_coverage,metrics_available,missing_metrics,data_freshness,data_quality_score,final_output_linkage,business_outcome_linkage,current_warnings,status)
SELECT @org,name,CASE WHEN rn IN (13,14) THEN 91.2 ELSE 96.5+(rn%4) END,24+(rn%12),CASE WHEN rn IN (13,14) THEN 2 ELSE 0 END,CASE WHEN rn IN (13,14) THEN 'Delayed' ELSE 'Real-time' END,CASE WHEN rn IN (13,14) THEN 92.1 ELSE 97.0+(rn%3) END,90+(rn%9),89+(rn%8),CASE WHEN rn IN (13,14) THEN 'connector delay watch' ELSE 'none' END,CASE WHEN rn IN (13,14) THEN 'Partial' ELSE 'Complete' END FROM @coverage;

DECLARE @dims TABLE(name NVARCHAR(160), rn INT);
INSERT INTO @dims VALUES
('Agent Performance',1),('Agent Quality',2),('Agent Reliability',3),('Agent Autonomy',4),('Agent Cost',5),('Agent Latency',6),('Agent Capacity',7),('Team Performance',8),('Collaboration Performance',9),('Task Performance',10),('Prompt Performance',11),('Model Performance',12),('Provider Performance',13),('Tool Performance',14),('Memory Performance',15),('Knowledge Performance',16),('RAG Performance',17),('Workflow Performance',18),('Recovery Performance',19),('Learning Performance',20),('Publishing Performance',21),('Audience Performance',22),('Campaign Performance',23),('Business Impact',24);
INSERT INTO agent_analytics_dimensions(organization_id,dimension_name,current_score,trend,target_score,variance,key_issue,key_opportunity,health_percent,open_analytics_action)
SELECT @org,name,CASE WHEN rn%11=0 THEN 89.4 ELSE 94+(rn%5) END,CASE WHEN rn%7=0 THEN 'watch' ELSE 'improving' END,95,CASE WHEN rn%11=0 THEN -3.2 ELSE 1.2+(rn%4) END,'minor variance under analysis','increase autonomous routing and reuse successful configurations',CASE WHEN rn%11=0 THEN 91 ELSE 96+(rn%4) END,'governed analytics recommendation available' FROM @dims;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<68)
INSERT INTO agent_analytics_agents(organization_id,agent_code,agent_name,domain,version_label,status,health_percent,runs,success_rate,failure_rate,recovery_rate,output_acceptance,average_confidence,quality_score,average_duration_ms,p95_duration_ms,average_cost,cost_per_accepted_output,tool_success,rag_success,memory_hit_rate,final_output_contribution,human_escalations,trend,rank_position,total_cost,revenue_contribution,human_hours_avoided)
SELECT @org,CONCAT('AGT-',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)),CONCAT('Autonomous Agent ',i),
CASE i%10 WHEN 0 THEN 'Research' WHEN 1 THEN 'Writing' WHEN 2 THEN 'SEO' WHEN 3 THEN 'Creative' WHEN 4 THEN 'Video' WHEN 5 THEN 'Publishing' WHEN 6 THEN 'Analytics' WHEN 7 THEN 'Learning' WHEN 8 THEN 'Compliance' ELSE 'Operations' END,
CONCAT('v',1+(i%5),'.',i%12),CASE WHEN i%31=0 THEN 'Degraded' WHEN i%19=0 THEN 'Recovering' WHEN i%17=0 THEN 'Busy' ELSE 'Active' END,
CASE WHEN i%31=0 THEN 88.4 ELSE 94+(i%6) END,220+(i*17)%900,CASE WHEN i%31=0 THEN 89.8 ELSE 95+(i%5) END,CASE WHEN i%31=0 THEN 10.2 ELSE 5-(i%3) END,CASE WHEN i%19=0 THEN 89.5 ELSE 91+(i%7) END,CASE WHEN i%17=0 THEN 90.4 ELSE 93+(i%6) END,89+(i%8),90+(i%8),420+(i%18)*55,820+(i%18)*90,CAST(0.18+(i%11)*0.08 AS DECIMAL(18,4)),CAST(1.30+(i%9)*0.12 AS DECIMAL(18,4)),92+(i%7),90+(i%8),88+(i%9),86+(i%12),0,CASE WHEN i%9=0 THEN 'declining' ELSE 'improving' END,i,CAST(120+(i*31.2) AS DECIMAL(18,2)),CAST(700+(i*82.5) AS DECIMAL(18,2)),CAST(8+(i%24) AS DECIMAL(18,2)) FROM n OPTION (MAXRECURSION 0);

DECLARE @panels TABLE(name NVARCHAR(160), rn INT);
INSERT INTO @panels VALUES ('Quality Analytics',1),('Autonomy Analytics',2),('Reliability Analytics',3),('Cost Analytics',4),('Latency Analytics',5),('Capacity Analytics',6),('Team Analytics',7),('Task Analytics',8),('Collaboration Analytics',9),('Prompt Analytics',10),('Model Provider Analytics',11),('Tool Analytics',12),('Memory Knowledge Analytics',13),('RAG Analytics',14),('Workflow Analytics',15),('Recovery Analytics',16),('Learning Analytics',17),('Content Publishing Analytics',18),('Audience Platform Analytics',19),('Business Impact Analytics',20);
INSERT INTO agent_analytics_panels(organization_id,panel_name,metric_name,metric_value,target_value,variance,trend,status,insight)
SELECT @org,name,metric,90+(rn%9),95,(rn%7)-2,CASE WHEN rn%6=0 THEN 'watch' ELSE 'improving' END,CASE WHEN rn%6=0 THEN 'warning' ELSE 'healthy' END,'database-backed analytics signal from production telemetry'
FROM @panels CROSS APPLY (VALUES ('success rate'),('quality score'),('cost efficiency'),('latency'),('final output contribution')) m(metric);

INSERT INTO agent_analytics_business_impact(organization_id,impact_code,business_metric,baseline_value,current_value,impact_value,attribution)
SELECT TOP 24 @org,CONCAT('ABI-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY dimension_name) AS NVARCHAR(3)),3)),dimension_name,100,current_score,current_score-100,'AI workforce analytics attribution' FROM agent_analytics_dimensions WHERE organization_id=@org;
INSERT INTO agent_analytics_final_output_traceability(organization_id,output_name,agent_code,workflow_name,acceptance_score,business_value,traceability_state,final_output_status)
SELECT TOP 80 @org,CONCAT('Accepted Output ',ROW_NUMBER() OVER (ORDER BY agent_code)),agent_code,'Autonomous Content Lifecycle',output_acceptance,revenue_contribution,'traceable','accepted' FROM agent_analytics_agents WHERE organization_id=@org ORDER BY agent_code;
INSERT INTO agent_analytics_anomalies(organization_id,anomaly_code,anomaly_type,affected_scope,severity,confidence,detected_at,status,recommendation)
SELECT TOP 18 @org,CONCAT('ANA-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY agent_code) AS NVARCHAR(3)),3)),CASE WHEN trend='declining' THEN 'quality degradation' ELSE 'cost variance' END,agent_name,CASE WHEN health_percent<90 THEN 'high' ELSE 'warning' END,88+(ABS(CHECKSUM(id))%10),DATEADD(minute,-ABS(CHECKSUM(id))%900,SYSUTCDATETIME()),'open','prioritize governed analytics recommendation' FROM agent_analytics_agents WHERE organization_id=@org AND (trend='declining' OR health_percent<94) ORDER BY health_percent;
INSERT INTO agent_analytics_forecasts(organization_id,forecast_code,forecast_metric,horizon,forecast_value,confidence,trend,generated_at)
SELECT @org,CONCAT('FOR-',RIGHT('000'+CAST(rn AS NVARCHAR(3)),3)),name,'30 days',92+(rn%12),89+(rn%9),CASE WHEN rn%5=0 THEN 'risk' ELSE 'improving' END,SYSUTCDATETIME() FROM @dims;
INSERT INTO agent_analytics_leaderboards(organization_id,leaderboard_name,rank_position,entity_name,score,reason)
SELECT @org,'Top Agents',rank_position,agent_name,health_percent,'best balance of quality, autonomy, cost, latency, and final-output impact' FROM agent_analytics_agents WHERE organization_id=@org AND rank_position<=10;
INSERT INTO agent_analytics_recommendations(organization_id,recommendation_code,title,domain,target_component,confidence,risk,expected_impact,final_output_impact,status,created_at)
SELECT TOP 32 @org,CONCAT('AAR-',RIGHT('000'+CAST(ROW_NUMBER() OVER (ORDER BY health_percent) AS NVARCHAR(3)),3)),CONCAT('Optimize analytics action for ',agent_name),domain,agent_name,90+(ABS(CHECKSUM(id))%8),CASE WHEN health_percent<90 THEN 'high' ELSE 'low' END,'improve quality, reliability, autonomy, cost, latency, and business impact',final_output_contribution,'ready',DATEADD(hour,-rank_position,SYSUTCDATETIME()) FROM agent_analytics_agents WHERE organization_id=@org ORDER BY health_percent;
INSERT INTO agent_analytics_saved_views(organization_id,view_name,owner_name,filters_summary,is_pinned,updated_at) VALUES (@org,'All Agents','Analytics Engine','default workforce analytics',1,SYSUTCDATETIME()),(@org,'Top Performing','Analytics Engine','rank <= 10',1,SYSUTCDATETIME()),(@org,'Human Attention Required','Analytics Engine','human escalation > 0',0,SYSUTCDATETIME());
INSERT INTO agent_analytics_reports(organization_id,report_name,report_type,schedule_state,last_generated_at,delivery_status) VALUES (@org,'AI Workforce Executive Report','executive','scheduled',DATEADD(hour,-2,SYSUTCDATETIME()),'delivered'),(@org,'Cost and Autonomy Report','finance','scheduled',DATEADD(hour,-5,SYSUTCDATETIME()),'delivered');
INSERT INTO agent_analytics_alert_rules(organization_id,rule_name,metric_name,threshold_value,severity,status) VALUES (@org,'Quality degradation watch','quality score',90,'warning','active'),(@org,'Cost runaway protection','daily cost',500,'critical','active'),(@org,'Human attention guardrail','human attention required',0,'critical','active');
INSERT INTO agent_analytics_data_quality(organization_id,source_name,quality_score,freshness_minutes,missing_rows,warning_count,status)
SELECT @org,stage_name,data_quality_score,CASE WHEN status='Partial' THEN 18 ELSE 2 END,missing_metrics,CASE WHEN status='Partial' THEN 1 ELSE 0 END,CASE WHEN status='Partial' THEN 'warning' ELSE 'healthy' END FROM agent_analytics_coverage WHERE organization_id=@org;
INSERT INTO agent_analytics_lineage(organization_id,lineage_code,source_name,metric_name,transformation,downstream_dashboard,lineage_state)
SELECT @org,CONCAT('LIN-',RIGHT('000'+CAST(rn AS NVARCHAR(3)),3)),name,CONCAT(name,' KPI'),'event stream > warehouse view > analytics KPI','Agent Analytics','traceable' FROM @coverage;
