DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50037, 'No organization exists for Autonomous Learning seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

DECLARE @perms TABLE(code NVARCHAR(160), description NVARCHAR(255));
INSERT INTO @perms VALUES
('autonomous_learning.view','View autonomous learning'),('autonomous_learning.view_signals','View learning signals'),('autonomous_learning.view_insights','View learning insights'),('autonomous_learning.view_recommendations','View learning recommendations'),('autonomous_learning.view_experiments','View learning experiments'),('autonomous_learning.view_improvements','View applied improvements'),('autonomous_learning.view_business_impact','View learning business impact'),('autonomous_learning.run_cycle','Run governed learning cycle'),('autonomous_learning.generate_recommendations','Generate learning recommendations'),('autonomous_learning.validate_insights','Validate insights'),('autonomous_learning.simulate_improvements','Simulate improvements'),('autonomous_learning.create_experiments','Create experiments'),('autonomous_learning.manage_experiments','Manage experiments'),('autonomous_learning.approve_recommendations','Approve recommendations'),('autonomous_learning.reject_recommendations','Reject recommendations'),('autonomous_learning.apply_recommendations','Apply recommendations'),('autonomous_learning.expand_rollouts','Expand rollouts'),('autonomous_learning.rollback_improvements','Rollback improvements'),('autonomous_learning.manage_models','Manage learning models'),('autonomous_learning.retrain_models','Retrain learning models'),('autonomous_learning.manage_drift','Manage drift'),('autonomous_learning.manage_memory','Manage learning memory'),('autonomous_learning.manage_settings','Manage learning settings'),('autonomous_learning.generate_documentation','Generate learning documentation'),('autonomous_learning.export','Export learning reports'),('autonomous_learning.manage_governance','Manage learning governance'),('autonomous_learning.emergency_override','Use learning emergency override');
MERGE permissions AS target USING (SELECT code,description FROM @perms) source ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL INSERT INTO role_permissions(role_id,permission_id)
SELECT @adminRole,p.id FROM permissions p JOIN @perms x ON x.code=p.code WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target USING (SELECT @org organization_id, 'autonomous-learning' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('AUTONOMOUS_LEARNING_CYCLE','Autonomous Learning Cycle'),('LEARNING_SIGNAL_PROCESSING','Learning Signal Processing'),('LEARNING_PATTERN_DISCOVERY','Learning Pattern Discovery'),('LEARNING_ROOT_CAUSE_ANALYSIS','Learning Root Cause Analysis'),('LEARNING_RECOMMENDATION_GENERATION','Learning Recommendation Generation'),('LEARNING_IMPROVEMENT_SIMULATION','Learning Improvement Simulation'),('LEARNING_EXPERIMENT_EXECUTION','Learning Experiment Execution'),('LEARNING_IMPROVEMENT_DEPLOYMENT','Learning Improvement Deployment'),('LEARNING_IMPROVEMENT_MONITORING','Learning Improvement Monitoring'),('LEARNING_AUTONOMOUS_ROLLBACK','Learning Autonomous Rollback'),('LEARNING_MODEL_RETRAINING','Learning Model Retraining'),('LEARNING_DRIFT_RESOLUTION','Learning Drift Resolution'),('LEARNING_GOVERNANCE_APPROVAL','Learning Governance Approval');
MERGE workflow_definitions AS target USING (SELECT @org organization_id, code, name, 'autonomous_learning' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM learning_final_output_traceability WHERE organization_id=@org;
DELETE FROM learning_business_impact WHERE organization_id=@org;
DELETE FROM learning_drift_events WHERE organization_id=@org;
DELETE FROM learning_models WHERE organization_id=@org;
DELETE FROM learning_memory WHERE organization_id=@org;
DELETE FROM learning_rollbacks WHERE organization_id=@org;
DELETE FROM learning_improvements WHERE organization_id=@org;
DELETE FROM learning_experiments WHERE organization_id=@org;
DELETE FROM learning_root_causes WHERE organization_id=@org;
DELETE FROM learning_patterns WHERE organization_id=@org;
DELETE FROM learning_source_matrix WHERE organization_id=@org;
DELETE FROM learning_recommendations WHERE organization_id=@org;
DELETE FROM learning_insights WHERE organization_id=@org;
DELETE FROM learning_signals WHERE organization_id=@org;
DELETE FROM learning_domains WHERE organization_id=@org;

DECLARE @domains TABLE(name NVARCHAR(160), rn INT);
INSERT INTO @domains VALUES
('Agent Learning',1),('Capability Learning',2),('Team and Role Learning',3),('Task Planning Learning',4),('Collaboration Learning',5),('Prompt Learning',6),('Model and Provider Learning',7),('Tool Learning',8),('Memory Learning',9),('Knowledge Learning',10),('RAG Learning',11),('Workflow Learning',12),('Recovery Learning',13),('Content Strategy Learning',14),('Creative Learning',15),('Voice and Audio Learning',16),('Video Learning',17),('Publishing Learning',18),('Audience Learning',19),('Analytics Learning',20),('Cost Learning',21),('Reliability Learning',22),('Business Outcome Learning',23);
INSERT INTO learning_domains(organization_id,domain_name,signals_processed,insights_found,recommendations,improvements_applied,success_rate,quality_impact,cost_impact,latency_impact,reliability_impact,final_output_impact,health_percent)
SELECT @org,name,150000+(rn*8600),4+(rn%13),1+(rn%5),2+(rn%9),CASE WHEN rn%11=0 THEN 88.4 ELSE 91.6+(rn%7) END,10.8+(rn%8),7.2+(rn%7),5.6+(rn%9),8.4+(rn%8),11.3+(rn%9),CASE WHEN rn%11=0 THEN 90 ELSE 95+(rn%5) END FROM @domains;

DECLARE @sources TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @sources VALUES ('Agents',1),('Prompts',2),('Models',3),('Providers',4),('Tools',5),('Memory',6),('Knowledge',7),('RAG',8),('Workflows',9),('Recovery',10),('Publishing',11),('Analytics',12),('Audience',13),('Campaigns',14),('Business KPIs',15);
INSERT INTO learning_source_matrix(organization_id,source_name,success_signals,failure_signals,quality_signals,cost_signals,latency_signals,reliability_signals,security_signals,engagement_signals,revenue_signals,final_output_signals,blind_spot)
SELECT @org,name,'Connected',CASE WHEN rn%8=0 THEN 'Delayed' ELSE 'Connected' END,'Connected',CASE WHEN rn%5=0 THEN 'Partial' ELSE 'Connected' END,'Connected','Connected',CASE WHEN rn%7=0 THEN 'Partial' ELSE 'Connected' END,CASE WHEN rn IN (13,14,15) THEN 'Connected' ELSE 'Partial' END,CASE WHEN rn IN (14,15) THEN 'Connected' ELSE 'Partial' END,'Connected',CASE WHEN rn%9=0 THEN 1 ELSE 0 END FROM @sources;

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<640),
d AS (SELECT name, rn, COUNT(*) OVER () cnt FROM @domains)
INSERT INTO learning_signals(organization_id,signal_code,signal_type,source_component,source_type,event_name,outcome,metric,previous_value,current_value,change_value,confidence,severity,business_impact,final_output_impact,correlation_id,organization_name,brand_name,workflow_name,agent_name,occurred_at,processing_status)
SELECT @org,CONCAT('LS-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),
CASE i%16 WHEN 0 THEN 'Success' WHEN 1 THEN 'Failure' WHEN 2 THEN 'Quality Change' WHEN 3 THEN 'Cost Change' WHEN 4 THEN 'Latency Change' WHEN 5 THEN 'Reliability Change' WHEN 6 THEN 'Recovery Event' WHEN 7 THEN 'Audience Response' WHEN 8 THEN 'Publishing Outcome' WHEN 9 THEN 'Business Outcome' WHEN 10 THEN 'Human Exception' WHEN 11 THEN 'Governance Decision' WHEN 12 THEN 'Security Event' WHEN 13 THEN 'Regression' WHEN 14 THEN 'Anomaly' ELSE 'Opportunity' END,
CONCAT(d.name,' Component ',1+(i%28)),d.name,CONCAT('learning.event.',i%37),CASE WHEN i%19=0 THEN 'degraded' WHEN i%7=0 THEN 'recovered' ELSE 'improved' END,
CASE i%5 WHEN 0 THEN 'quality' WHEN 1 THEN 'cost' WHEN 2 THEN 'latency' WHEN 3 THEN 'reliability' ELSE 'final output' END,
80+(i%15),84+(i%16),(4+(i%6)),88+(i%11),CASE WHEN i%37=0 THEN 'critical' WHEN i%19=0 THEN 'warning' ELSE 'info' END,'business KPI protected','final output learning signal captured',CONCAT('COR-',RIGHT('00000'+CAST(i%120 AS NVARCHAR(5)),5)),'AI Media Group','CACSMS Contents','Autonomous Content Lifecycle',CONCAT('Agent ',1+(i%18)),DATEADD(minute,-i,SYSUTCDATETIME()),CASE i%8 WHEN 0 THEN 'Received' WHEN 1 THEN 'Normalizing' WHEN 2 THEN 'Classified' WHEN 3 THEN 'Correlated' WHEN 4 THEN 'Analyzed' WHEN 5 THEN 'Used in Insight' WHEN 6 THEN 'Ignored' ELSE 'Archived' END
FROM n JOIN d ON d.rn=((n.i-1)%d.cnt)+1 OPTION (MAXRECURSION 0);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<186),
d AS (SELECT name, rn, COUNT(*) OVER () cnt FROM @domains)
INSERT INTO learning_insights(organization_id,insight_code,insight_title,description,domain,pattern_type,affected_component,evidence_count,confidence,severity,root_cause,expected_opportunity,quality_impact,cost_impact,latency_impact,reliability_impact,final_output_impact,recommendation_count,status,organization_scope,detected_at,updated_at)
SELECT @org,CONCAT('LI-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),CONCAT(d.name,' insight ',i),CONCAT('Autonomous learning detected a repeatable pattern in ',LOWER(d.name),' with measurable business and final-output effect.'),d.name,
CASE i%19 WHEN 0 THEN 'Repeated Success' WHEN 1 THEN 'Repeated Failure' WHEN 2 THEN 'Quality Drift' WHEN 3 THEN 'Cost Drift' WHEN 4 THEN 'Latency Drift' WHEN 5 THEN 'Reliability Drift' WHEN 6 THEN 'Model Degradation' WHEN 7 THEN 'Prompt Degradation' WHEN 8 THEN 'Tool Degradation' WHEN 9 THEN 'Retrieval Weakness' WHEN 10 THEN 'Audience Preference' WHEN 11 THEN 'Platform Preference' WHEN 12 THEN 'Timing Pattern' WHEN 13 THEN 'Content-Type Pattern' WHEN 14 THEN 'Topic Pattern' WHEN 15 THEN 'Brand Pattern' WHEN 16 THEN 'Recovery Pattern' WHEN 17 THEN 'Business Outcome Pattern' ELSE 'Segment Pattern' END,
CONCAT(d.name,' Component ',1+(i%28)),18+(i%180),86+(i%13),CASE WHEN i%31=0 THEN 'high' WHEN i%11=0 THEN 'medium' ELSE 'low' END,'configuration drift and outcome variance correlated across recent executions','autonomous improvement can raise quality, cost, latency, reliability, and final-output performance',8+(i%12),5+(i%9),4+(i%8),7+(i%9),9+(i%12),1+(i%4),
CASE i%9 WHEN 0 THEN 'New' WHEN 1 THEN 'Validating' WHEN 2 THEN 'Validated' WHEN 3 THEN 'Recommendation Generated' WHEN 4 THEN 'Experiment Running' WHEN 5 THEN 'Improvement Applied' WHEN 6 THEN 'Monitoring' WHEN 7 THEN 'Resolved' ELSE 'Archived' END,
'Organization',DATEADD(hour,-i,SYSUTCDATETIME()),DATEADD(minute,-i,SYSUTCDATETIME())
FROM n JOIN d ON d.rn=((n.i-1)%d.cnt)+1 OPTION (MAXRECURSION 0);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<42),
ins AS (SELECT id, domain, affected_component, ROW_NUMBER() OVER (ORDER BY insight_code) rn FROM learning_insights WHERE organization_id=@org)
INSERT INTO learning_recommendations(organization_id,insight_id,recommendation_code,recommendation_title,description,domain,target_component,current_configuration,proposed_configuration,evidence_count,confidence,risk,quality_impact,cost_impact,latency_impact,reliability_impact,final_output_impact,auto_apply_eligible,governance_required,experiment_required,status,owner,created_at)
SELECT @org,ins.id,CONCAT('LR-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),CONCAT('Improve ',ins.affected_component),CONCAT('Governed autonomous improvement for ',LOWER(ins.domain),' based on validated learning evidence.'),ins.domain,ins.affected_component,'current production configuration','proposed safer, faster, lower-cost configuration',24+(i%140),88+(i%11),CASE WHEN i%10=0 THEN 'high' WHEN i%4=0 THEN 'medium' ELSE 'low' END,9+(i%10),6+(i%8),5+(i%7),8+(i%9),10+(i%10),CASE WHEN i%5=0 THEN 0 ELSE 1 END,CASE WHEN i%5=0 THEN 1 ELSE 0 END,CASE WHEN i%4=0 THEN 1 ELSE 0 END,CASE i%8 WHEN 0 THEN 'Draft' WHEN 1 THEN 'Validating' WHEN 2 THEN 'Ready' WHEN 3 THEN 'Experiment Required' WHEN 4 THEN 'Governance Pending' WHEN 5 THEN 'Approved' WHEN 6 THEN 'Monitoring' ELSE 'Successful' END,'Learning Governance Engine',DATEADD(hour,-i,SYSUTCDATETIME())
FROM n JOIN ins ON ins.rn=i OPTION (MAXRECURSION 0);

INSERT INTO learning_patterns(organization_id,pattern_name,pattern_type,frequency_count,confidence,trend,affected_scope,opportunity,risk,recommendation)
SELECT TOP 64 @org,insight_title,pattern_type,evidence_count,confidence,CASE WHEN quality_impact>14 THEN 'accelerating' ELSE 'stable' END,domain,expected_opportunity,CASE WHEN severity='high' THEN 'quality regression risk' ELSE 'low' END,'generate governed learning recommendation' FROM learning_insights WHERE organization_id=@org ORDER BY confidence DESC;
INSERT INTO learning_root_causes(organization_id,insight_id,observed_outcome,contributing_events,dependencies,candidate_cause,evidence,correlation,causal_confidence,alternative_explanation,recommended_action)
SELECT TOP 80 @org,id,'measurable component outcome changed','workflow, agent, prompt, model, tool, RAG, audience and business signals','agent > workflow > output > publishing > analytics > learning',root_cause,'multi-signal evidence chain retained',0.82+(ABS(CHECKSUM(id))%14)*0.01,confidence,'seasonality or campaign mix may also contribute','simulate and validate the recommended improvement' FROM learning_insights WHERE organization_id=@org ORDER BY detected_at DESC;
INSERT INTO learning_experiments(organization_id,recommendation_id,experiment_code,experiment_name,variants,traffic_allocation,primary_metric,winner,confidence,rollback_ready,status)
SELECT TOP 38 @org,id,CONCAT('LEX-',RIGHT('000000'+CAST(ROW_NUMBER() OVER (ORDER BY recommendation_code) AS NVARCHAR(6)),6)),CONCAT('Experiment ',recommendation_title),'control, variant-a, variant-b','20/40/40','final-output quality','variant-a',90+(ABS(CHECKSUM(id))%8),1,CASE WHEN experiment_required=1 THEN 'Running' ELSE 'Scheduled' END FROM learning_recommendations WHERE organization_id=@org ORDER BY recommendation_code;
INSERT INTO learning_improvements(organization_id,recommendation_id,improvement_code,improvement_name,target_component,rollout_percent,monitoring_state,actual_quality_impact,actual_cost_impact,actual_latency_impact,actual_final_output_impact,retained_or_rolled_back)
SELECT TOP 124 @org,r.id,CONCAT('LIM-',RIGHT('000000'+CAST(ROW_NUMBER() OVER (ORDER BY r.recommendation_code, s.signal_code) AS NVARCHAR(6)),6)),CONCAT('Applied ',r.recommendation_title),r.target_component,CASE WHEN ROW_NUMBER() OVER (ORDER BY r.recommendation_code, s.signal_code)%9=0 THEN 25 ELSE 100 END,'Monitoring',r.quality_impact-1,r.cost_impact-1,r.latency_impact-1,r.final_output_impact-1,'Retained' FROM learning_recommendations r CROSS JOIN (SELECT TOP 3 signal_code FROM learning_signals WHERE organization_id=@org ORDER BY signal_code) s WHERE r.organization_id=@org ORDER BY r.recommendation_code, s.signal_code;
INSERT INTO learning_rollbacks(organization_id,improvement_id,rollback_code,reason,previous_version,restored_at,incident_recorded,status)
SELECT TOP 7 @org,id,CONCAT('LRB-',RIGHT('000000'+CAST(ROW_NUMBER() OVER (ORDER BY improvement_code) AS NVARCHAR(6)),6)),'regression detected during monitoring','previous-production-version',DATEADD(hour,-ROW_NUMBER() OVER (ORDER BY improvement_code),SYSUTCDATETIME()),1,'completed' FROM learning_improvements WHERE organization_id=@org ORDER BY improvement_code DESC;
INSERT INTO learning_memory(organization_id,memory_code,memory_type,domain,learned_pattern,confidence,usage_count,last_used_at)
SELECT TOP 96 @org,CONCAT('LM-',RIGHT('000000'+CAST(ROW_NUMBER() OVER (ORDER BY insight_code) AS NVARCHAR(6)),6)),'pattern memory',domain,CONCAT('Reusable pattern from ',insight_title),confidence,10+(ABS(CHECKSUM(id))%400),DATEADD(minute,-ABS(CHECKSUM(id))%900,SYSUTCDATETIME()) FROM learning_insights WHERE organization_id=@org ORDER BY confidence DESC;
INSERT INTO learning_models(organization_id,model_code,model_name,model_type,training_status,accuracy,drift_score,last_trained_at) VALUES
(@org,'LMD-001','Pattern Discovery Model','pattern','trained',94.8,1.4,DATEADD(day,-1,SYSUTCDATETIME())),(@org,'LMD-002','Impact Prediction Model','impact','trained',93.7,1.8,DATEADD(day,-1,SYSUTCDATETIME())),(@org,'LMD-003','Root Cause Ranking Model','causal','training',91.2,2.6,DATEADD(day,-2,SYSUTCDATETIME())),(@org,'LMD-004','Rollback Risk Model','risk','trained',95.1,1.2,DATEADD(day,-1,SYSUTCDATETIME()));
INSERT INTO learning_drift_events(organization_id,drift_code,model_name,drift_type,severity,detected_at,resolved_at,status) VALUES
(@org,'LDR-001','Root Cause Ranking Model','feature drift','warning',DATEADD(hour,-5,SYSUTCDATETIME()),NULL,'monitoring'),(@org,'LDR-002','Impact Prediction Model','label drift','info',DATEADD(hour,-11,SYSUTCDATETIME()),DATEADD(hour,-9,SYSUTCDATETIME()),'resolved'),(@org,'LDR-003','Pattern Discovery Model','concept drift','info',DATEADD(hour,-18,SYSUTCDATETIME()),DATEADD(hour,-17,SYSUTCDATETIME()),'resolved');
INSERT INTO learning_business_impact(organization_id,domain,kpi_name,baseline_value,current_value,impact_percent,attribution)
SELECT @org,domain_name,'business KPI contribution',100,100+final_output_impact,final_output_impact,'autonomous learning retained improvement' FROM learning_domains WHERE organization_id=@org;
INSERT INTO learning_final_output_traceability(organization_id,output_name,workflow_name,improvement_code,quality_delta,engagement_delta,revenue_delta,traceability_state,final_output_impact)
SELECT TOP 84 @org,CONCAT('Final Output ',ROW_NUMBER() OVER (ORDER BY improvement_code)),'Autonomous Content Lifecycle',improvement_code,actual_quality_impact,actual_final_output_impact/2,actual_final_output_impact/3,'traceable','learning improvement connected to final business output' FROM learning_improvements WHERE organization_id=@org ORDER BY improvement_code;
