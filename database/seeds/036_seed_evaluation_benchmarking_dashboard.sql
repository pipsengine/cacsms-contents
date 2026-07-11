DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50036, 'No organization exists for Evaluation seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

DECLARE @perms TABLE(code NVARCHAR(120), description NVARCHAR(255));
INSERT INTO @perms VALUES
('evaluation.view','View evaluation and benchmarking'),('evaluation.run','Run governed evaluation jobs'),('evaluation.certify','Certify evaluated AI components'),('evaluation.export','Export evaluation reports');
MERGE permissions AS target USING (SELECT code,description FROM @perms) AS source ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL INSERT INTO role_permissions(role_id,permission_id)
SELECT @adminRole,p.id FROM permissions p JOIN @perms x ON x.code=p.code WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target USING (SELECT @org organization_id, 'evaluation-operations' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=98, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',98);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES
('AI_EVALUATION_RUN','AI Evaluation Run'),('AI_BENCHMARK_RUN','AI Benchmark Run'),('AI_REGRESSION_TEST','AI Regression Test'),('AI_SAFETY_TEST','AI Safety Test'),('AI_SECURITY_TEST','AI Security Test'),('AI_GOLDEN_DATASET_TEST','AI Golden Dataset Test'),('AI_CANARY_TEST','AI Canary Test'),('AI_CERTIFICATION_REVIEW','AI Certification Review'),('AI_QUALITY_RECOMMENDATION','AI Quality Recommendation');
MERGE workflow_definitions AS target USING (SELECT @org organization_id, code, name, 'evaluation_operations' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_final_output_scores WHERE organization_id=@org;
DELETE FROM ai_recommendations WHERE organization_id=@org;
DELETE FROM ai_leaderboards WHERE organization_id=@org;
DELETE FROM ai_certifications WHERE organization_id=@org;
DELETE FROM ai_canary_tests WHERE organization_id=@org;
DELETE FROM ai_ab_tests WHERE organization_id=@org;
DELETE FROM ai_golden_datasets WHERE organization_id=@org;
DELETE FROM ai_regression_tests WHERE organization_id=@org;
DELETE FROM ai_security_tests WHERE organization_id=@org;
DELETE FROM ai_safety_tests WHERE organization_id=@org;
DELETE FROM ai_quality_scores WHERE organization_id=@org;
DELETE FROM ai_benchmarks WHERE organization_id=@org;
DELETE FROM ai_evaluations WHERE organization_id=@org;
DELETE FROM ai_evaluation_components WHERE organization_id=@org;

DECLARE @types TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @types VALUES
('AI Agent',1),('Prompt Template',2),('Model',3),('Provider',4),('RAG Pipeline',5),('Knowledge Source',6),('Retriever',7),('Reranker',8),('Embedding',9),('Tool',10),('Tool Call',11),('Workflow',12),('Workflow Decision',13),('Task Planning',14),('Task Execution',15),('Task Recovery',16),('Team Collaboration',17),('Memory Retrieval',18),('Knowledge Retrieval',19),('Content Generation',20),('Image Generation',21),('Voice Generation',22),('Video Generation',23),('Publishing',24),('Analytics',25),('Learning',26),('Autonomous Decision',27),('Final Business Output',28);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<84),
t AS (SELECT name, rn, COUNT(*) OVER () cnt FROM @types)
INSERT INTO ai_evaluation_components(organization_id,component_code,component_name,component_type,version_label,owner,current_score,previous_score,accuracy,grounding,safety,latency_ms,average_cost,reliability,certification,status,production_readiness,human_attention_required)
SELECT @org,CONCAT('AIE-',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)),CONCAT(t.name,' Quality Component ',i),t.name,CONCAT('v',1+(i%5),'.',i%12),'Quality Intelligence Engine',
CASE WHEN i%31=0 THEN 82.5 WHEN i%17=0 THEN 88.4 ELSE 92.0+(i%8) END,
CASE WHEN i%31=0 THEN 84.0 WHEN i%17=0 THEN 87.2 ELSE 90.5+(i%7) END,
CASE WHEN i%19=0 THEN 87.5 ELSE 91.0+(i%8) END,
CASE WHEN i%23=0 THEN 86.5 ELSE 90.0+(i%9) END,
CASE WHEN i%29=0 THEN 84.5 ELSE 93.0+(i%6) END,
260+(i%18)*37,
CAST(0.006+(i%15)*0.004 AS DECIMAL(18,4)),
CASE WHEN i%31=0 THEN 86.0 ELSE 93.0+(i%6) END,
CASE WHEN i%31=0 THEN 'Failed' WHEN i%17=0 THEN 'Testing' WHEN i%11=0 THEN 'Draft' ELSE 'Certified' END,
CASE WHEN i%31=0 THEN 'Failed' WHEN i%17=0 THEN 'Watch' ELSE 'Production' END,
CASE WHEN i%31=0 THEN 78.0 WHEN i%17=0 THEN 86.0 ELSE 92.0+(i%7) END,
0
FROM n JOIN t ON t.rn=((n.i-1)%t.cnt)+1 OPTION (MAXRECURSION 0);

DECLARE @dims TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @dims VALUES
('Overall AI Quality',1),('Agent Quality',2),('Prompt Quality',3),('Model Quality',4),('Retrieval Quality',5),('Tool Quality',6),('Output Quality',7),('Business Quality',8),('Accuracy',9),('Precision',10),('Recall',11),('F1 Score',12),('BLEU',13),('ROUGE',14),('METEOR',15),('BERTScore',16),('Exact Match',17),('Semantic Similarity',18),('Citation Precision',19),('Citation Recall',20),('Grounding',21),('Faithfulness',22),('Hallucination',23),('Consistency',24),('Completeness',25),('Correctness',26),('Relevance',27),('Coverage',28),('Writing',29),('Grammar',30),('Readability',31),('SEO',32),('Tone',33),('Style',34),('Brand Compliance',35),('Fact Accuracy',36),('Evidence',37),('Citation Quality',38),('Image Quality',39),('Video Quality',40),('Voice Quality',41),('Retrieval Precision@K',42),('Retrieval Recall@K',43),('MRR',44),('NDCG',45),('Hit Rate',46),('Model Reliability',47),('Prompt Stability',48),('Agent Recovery',49),('Workflow Value',50);
INSERT INTO ai_quality_scores(organization_id,dimension,score,previous_score,threshold_score,trend,source_count)
SELECT @org,name,CASE WHEN rn IN (23,48) THEN 89.2 ELSE 91.5+(rn%8) END,CASE WHEN rn IN (23,48) THEN 88.1 ELSE 90.1+(rn%7) END,90,CASE WHEN rn%6=0 THEN 'watch' ELSE 'improved' END,24+(rn*3) FROM @dims;

DECLARE @cats TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @cats VALUES
('Reasoning',1),('Writing',2),('Research',3),('Fact Extraction',4),('Fact Verification',5),('Citation Accuracy',6),('SEO',7),('Translation',8),('Summarization',9),('Image Generation',10),('Voice',11),('Audio',12),('Video',13),('Planning',14),('Decision Making',15),('Tool Usage',16),('Retrieval',17),('Grounding',18),('Workflow',19),('Publishing',20),('Analytics',21),('Learning',22);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<268),
c AS (SELECT id, component_code, component_name, component_type, ROW_NUMBER() OVER (ORDER BY component_code) rn, COUNT(*) OVER () cnt FROM ai_evaluation_components WHERE organization_id=@org)
INSERT INTO ai_evaluations(organization_id,component_id,evaluation_code,evaluation_type,dataset_name,status,quality_score,safety_score,accuracy,grounding_score,hallucination_rate,latency_ms,actual_cost,started_at,completed_at)
SELECT @org,c.id,CONCAT('EVAL-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),
CASE i%15 WHEN 0 THEN 'Unit Evaluation' WHEN 1 THEN 'Regression' WHEN 2 THEN 'Golden Dataset' WHEN 3 THEN 'Canary Evaluation' WHEN 4 THEN 'Shadow Evaluation' WHEN 5 THEN 'Online Evaluation' WHEN 6 THEN 'Offline Evaluation' WHEN 7 THEN 'Adversarial Evaluation' WHEN 8 THEN 'Stress Evaluation' WHEN 9 THEN 'Security Evaluation' WHEN 10 THEN 'Safety Evaluation' WHEN 11 THEN 'Performance Evaluation' WHEN 12 THEN 'Cost Evaluation' WHEN 13 THEN 'Latency Evaluation' ELSE 'Final Output Evaluation' END,
CASE i%8 WHEN 0 THEN 'Research' WHEN 1 THEN 'Writing' WHEN 2 THEN 'Video' WHEN 3 THEN 'SEO' WHEN 4 THEN 'Publishing' WHEN 5 THEN 'Analytics' WHEN 6 THEN 'Learning' ELSE 'Compliance' END,
CASE WHEN i%37=0 THEN 'failed' WHEN i%13=0 THEN 'running' ELSE 'completed' END,
CASE WHEN i%37=0 THEN 79 ELSE 90+(i%9) END,CASE WHEN i%29=0 THEN 85 ELSE 92+(i%7) END,CASE WHEN i%31=0 THEN 86 ELSE 91+(i%8) END,CASE WHEN i%23=0 THEN 87 ELSE 90+(i%9) END,CASE WHEN i%19=0 THEN 4.8 ELSE 1.2+(i%6)*0.2 END,240+(i%25)*31,CAST(0.005+(i%20)*0.004 AS DECIMAL(18,4)),DATEADD(minute,-i,SYSUTCDATETIME()),CASE WHEN i%13=0 THEN NULL ELSE DATEADD(second,45,DATEADD(minute,-i,SYSUTCDATETIME())) END
FROM n JOIN c ON c.rn=((n.i-1)%c.cnt)+1 OPTION (MAXRECURSION 0);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<196),
c AS (SELECT id, component_code, component_name, component_type, ROW_NUMBER() OVER (ORDER BY component_code) rn, COUNT(*) OVER () cnt FROM ai_evaluation_components WHERE organization_id=@org),
k AS (SELECT name, rn, COUNT(*) OVER () cnt FROM @cats)
INSERT INTO ai_benchmarks(organization_id,component_id,benchmark_code,benchmark_category,dataset_name,started_at,completed_at,duration_ms,accuracy,precision_score,recall_score,f1_score,grounding_score,latency_ms,actual_cost,winner,status)
SELECT @org,c.id,CONCAT('BM-',RIGHT('000000'+CAST(i AS NVARCHAR(6)),6)),k.name,CONCAT(k.name,' Golden Benchmark'),DATEADD(minute,-i*2,SYSUTCDATETIME()),DATEADD(second,60,DATEADD(minute,-i*2,SYSUTCDATETIME())),12000+(i%30)*900,CASE WHEN i%41=0 THEN 84 ELSE 91+(i%8) END,90+(i%8),89+(i%9),90+(i%8),CASE WHEN i%17=0 THEN 88 ELSE 91+(i%8) END,220+(i%20)*28,CAST(0.006+(i%16)*0.005 AS DECIMAL(18,4)),CASE WHEN i%3=0 THEN 'Version B' ELSE 'Version A' END,CASE WHEN i%41=0 THEN 'watch' ELSE 'completed' END
FROM n JOIN c ON c.rn=((n.i-1)%c.cnt)+1 JOIN k ON k.rn=((n.i-1)%k.cnt)+1 OPTION (MAXRECURSION 0);

INSERT INTO ai_golden_datasets(organization_id,dataset_code,dataset_name,domain,sample_count,freshness_score,coverage_score,status)
SELECT @org,CONCAT('GDS-',RIGHT('00'+CAST(rn AS NVARCHAR(2)),2)),name + ' Golden Dataset',name,1200+(rn*221),91+(rn%7),92+(rn%6),'active' FROM (VALUES (1,'Research'),(2,'Writing'),(3,'Video'),(4,'SEO'),(5,'Publishing'),(6,'Analytics'),(7,'Learning'),(8,'Compliance')) d(rn,name);

INSERT INTO ai_safety_tests(organization_id,component_id,test_name,risk_type,status,pass_rate,findings,last_run_at)
SELECT TOP 64 @org,id,CONCAT('Safety guardrail ',component_code),CASE ABS(CHECKSUM(id))%8 WHEN 0 THEN 'Prompt Injection' WHEN 1 THEN 'Jailbreak' WHEN 2 THEN 'Data Leakage' WHEN 3 THEN 'PII' WHEN 4 THEN 'Secrets' WHEN 5 THEN 'Hallucination' WHEN 6 THEN 'Bias' ELSE 'Copyright' END,CASE WHEN safety<88 THEN 'watch' ELSE 'passed' END,safety,CASE WHEN safety<88 THEN 2 ELSE 0 END,DATEADD(minute,-ABS(CHECKSUM(id))%900,SYSUTCDATETIME()) FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code;
INSERT INTO ai_security_tests(organization_id,component_id,test_name,control_area,status,pass_rate,findings,last_run_at)
SELECT TOP 48 @org,id,CONCAT('Security control ',component_code),CASE ABS(CHECKSUM(id))%6 WHEN 0 THEN 'Authentication' WHEN 1 THEN 'Authorization' WHEN 2 THEN 'Secrets' WHEN 3 THEN 'Encryption' WHEN 4 THEN 'Audit' ELSE 'Tenant Isolation' END,'passed',94+(ABS(CHECKSUM(id))%5),0,DATEADD(minute,-ABS(CHECKSUM(id))%900,SYSUTCDATETIME()) FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code;
INSERT INTO ai_regression_tests(organization_id,component_id,test_name,trigger_scope,status,regressions_found,baseline_score,current_score,last_run_at)
SELECT TOP 72 @org,id,CONCAT('Regression suite ',component_code),CASE ABS(CHECKSUM(id))%5 WHEN 0 THEN 'Every deployment' WHEN 1 THEN 'Every prompt' WHEN 2 THEN 'Every model' WHEN 3 THEN 'Every workflow' ELSE 'Every retrieval' END,CASE WHEN current_score<86 THEN 'failed' ELSE 'passed' END,CASE WHEN current_score<86 THEN 1 ELSE 0 END,previous_score,current_score,DATEADD(minute,-ABS(CHECKSUM(id))%900,SYSUTCDATETIME()) FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code;

INSERT INTO ai_certifications(organization_id,component_id,certification_level,certification_state,certified_at,expires_at,evidence_count)
SELECT @org,id,'Production Quality Gate',certification,CASE WHEN certification='Certified' THEN DATEADD(day,-ABS(CHECKSUM(id))%30,SYSUTCDATETIME()) ELSE NULL END,CASE WHEN certification='Certified' THEN DATEADD(day,90,SYSUTCDATETIME()) ELSE NULL END,8+(ABS(CHECKSUM(id))%20) FROM ai_evaluation_components WHERE organization_id=@org;
INSERT INTO ai_ab_tests(organization_id,component_id,version_a,version_b,traffic_percent,winner,confidence,acceptance)
SELECT TOP 32 @org,id,'vA','vB',25+(ABS(CHECKSUM(id))%50),CASE WHEN current_score>=previous_score THEN 'vB' ELSE 'vA' END,91+(ABS(CHECKSUM(id))%8),90+(ABS(CHECKSUM(component_code))%8) FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code;
INSERT INTO ai_canary_tests(organization_id,component_id,canary_name,rollout_percent,status,rollback_ready,confidence)
SELECT TOP 32 @org,id,CONCAT('Canary ',component_code),5+(ABS(CHECKSUM(id))%35),CASE WHEN status='Production' THEN 'progressive' ELSE 'shadow' END,1,90+(ABS(CHECKSUM(id))%8) FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code DESC;
INSERT INTO ai_leaderboards(organization_id,category,component_id,rank_position,score,reason)
SELECT @org,category,id,rank_position,current_score,'highest quality, safety, reliability, cost, and latency balance'
FROM (SELECT c.*, x.category, ROW_NUMBER() OVER (PARTITION BY x.category ORDER BY c.current_score DESC, c.reliability DESC) rank_position FROM ai_evaluation_components c CROSS APPLY (VALUES ('Best Agents'),('Best Prompts'),('Best Models'),('Best Tools'),('Best Pipelines'),('Best Workflows'),('Best Teams')) x(category) WHERE c.organization_id=@org) ranked WHERE rank_position<=5;
INSERT INTO ai_recommendations(organization_id,component_id,recommendation_type,title,impact,confidence_percent,status)
SELECT TOP 36 @org,id,CASE WHEN current_score<90 THEN 'Better Model' WHEN latency_ms>700 THEN 'Better Latency' WHEN average_cost>0.045 THEN 'Better Cost' ELSE 'Better Prompt' END,CONCAT('Improve ',component_name),'quality, safety, latency, cost, grounding, and production readiness',90+(ABS(CHECKSUM(id))%8),'queued' FROM ai_evaluation_components WHERE organization_id=@org ORDER BY current_score ASC, latency_ms DESC;
INSERT INTO ai_final_output_scores(organization_id,component_id,business_objective,workflow_name,output_name,publishing_channel,analytics_signal,learning_signal,business_result,final_score,validation_state)
SELECT TOP 84 @org,id,'Produce trustworthy media output','Autonomous Content Lifecycle',CONCAT(component_name,' final output'),'YouTube, Web, Social','engagement and retention protected','quality feedback captured','business objective validated',production_readiness,CASE WHEN production_readiness<86 THEN 'watch' ELSE 'validated' END FROM ai_evaluation_components WHERE organization_id=@org ORDER BY component_code;
