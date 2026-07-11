DECLARE @org UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM organizations WHERE slug='ai-media-group' ORDER BY created_at);
IF @org IS NULL SET @org = (SELECT TOP 1 id FROM organizations ORDER BY created_at);
IF @org IS NULL THROW 50033, 'No organization exists for memory management seed.', 1;
DECLARE @adminRole UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM roles WHERE organization_id=@org AND code='super_admin');

DECLARE @perms TABLE(code NVARCHAR(120), description NVARCHAR(255));
INSERT INTO @perms VALUES
('memory.view','View memory'),('memory.create','Create memory'),('memory.edit','Edit memory'),('memory.optimize','Optimize memory'),('memory.recover','Recover memory'),('memory.delete','Delete memory'),('memory.export','Export memory');
MERGE permissions AS target USING (SELECT code,description FROM @perms) AS source ON target.code=source.code
WHEN MATCHED THEN UPDATE SET description=source.description, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (code,description) VALUES (source.code,source.description);
IF @adminRole IS NOT NULL INSERT INTO role_permissions(role_id,permission_id)
SELECT @adminRole,p.id FROM permissions p JOIN @perms x ON x.code=p.code WHERE NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id=@adminRole AND rp.permission_id=p.id);

MERGE job_queues AS target USING (SELECT @org organization_id, 'ai-memory-operations' name) source
ON target.organization_id=source.organization_id AND target.name=source.name
WHEN MATCHED THEN UPDATE SET status='running', health_percent=97, updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,name,status,health_percent) VALUES (source.organization_id,source.name,'running',97);

DECLARE @wf TABLE(code NVARCHAR(120), name NVARCHAR(220));
INSERT INTO @wf VALUES ('AI_MEMORY_CREATE','AI Memory Create'),('AI_MEMORY_VALIDATE','AI Memory Validate'),('AI_MEMORY_EMBED','AI Memory Embed'),('AI_MEMORY_REINDEX','AI Memory Reindex'),('AI_MEMORY_OPTIMIZE','AI Memory Optimize'),('AI_MEMORY_RECOVER','AI Memory Recover'),('AI_MEMORY_SYNCHRONIZE','AI Memory Synchronize'),('AI_MEMORY_RETENTION','AI Memory Retention'),('AI_MEMORY_SECURITY_SCAN','AI Memory Security Scan');
MERGE workflow_definitions AS target USING (SELECT @org organization_id, code, name, 'ai_memory_operations' workflow_type FROM @wf) source
ON target.organization_id=source.organization_id AND target.code=source.code
WHEN MATCHED THEN UPDATE SET name=source.name, workflow_type=source.workflow_type, status='active', updated_at=SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (organization_id,code,name,workflow_type,status,is_system_workflow) VALUES (source.organization_id,source.code,source.name,source.workflow_type,'active',1);

DELETE FROM ai_memory_final_outputs WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_learning WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_recovery WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_metrics WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_security WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_retrieval WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_retention WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_sync WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_sources WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_relationships WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_graph WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_chunks WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_indexes WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_collections WHERE organization_id=@org;
DELETE FROM ai_memory_vectors WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_embeddings WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory_versions WHERE memory_id IN (SELECT id FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%');
DELETE FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';

DECLARE @categories TABLE(name NVARCHAR(120), rn INT);
INSERT INTO @categories VALUES
('Working Memory',1),('Workflow Memory',2),('Conversation Memory',3),('Organization Memory',4),('Brand Memory',5),('Audience Memory',6),('Campaign Memory',7),('Semantic Memory',8),('Procedural Memory',9),('Episodic Memory',10),('Knowledge Base',11),('Learning Memory',12),('Recovery Memory',13),('Analytics Memory',14),('Publishing Memory',15),('Decision Memory',16);

;WITH n AS (SELECT 1 i UNION ALL SELECT i+1 FROM n WHERE i<160),
src AS (SELECT n.i, c.name category FROM n JOIN @categories c ON c.rn=((n.i-1)%16)+1)
INSERT INTO ai_memory(organization_id,memory_code,memory_name,category,owner,agent_name,scope_type,status,classification,embedding_model,vector_store,memory_size_mb,object_count,freshness_percent,confidence_percent,retrieval_rate,retention_policy,encryption_state,last_access_at,final_output_linked,provenance_state,source_validation,health_percent,cost_today,human_attention_required)
SELECT @org,CONCAT('MEM-',RIGHT('0000'+CAST(i AS NVARCHAR(4)),4)),CONCAT(category,' Object ',RIGHT('000'+CAST(i AS NVARCHAR(3)),3)),category,'AI Memory Governance Engine',CONCAT('Autonomous Agent ',1+(i%18)),CASE WHEN i%5=0 THEN 'Organization' WHEN i%3=0 THEN 'Team' ELSE 'System' END,CASE WHEN i%43=0 THEN 'Reindexing' WHEN i%37=0 THEN 'Stale' WHEN i%29=0 THEN 'Optimizing' ELSE 'Active' END,CASE WHEN i%11=0 THEN 'Confidential' WHEN i%7=0 THEN 'Internal' ELSE 'Operational' END,CASE WHEN i%3=0 THEN 'text-embedding-3-large' WHEN i%3=1 THEN 'text-embedding-3-small' ELSE 'local-e5-large' END,CASE WHEN i%4=0 THEN 'Azure AI Search' WHEN i%4=1 THEN 'MSSQL Vector Store' WHEN i%4=2 THEN 'Redis Vector Index' ELSE 'pgvector-compatible adapter' END,CAST(64+(i%90)*7.4 AS DECIMAL(18,2)),800+(i*47)%8200,CASE WHEN i%37=0 THEN 82 ELSE 93+(i%7) END,CASE WHEN i%41=0 THEN 86 ELSE 91+(i%8) END,CASE WHEN i%43=0 THEN 88 ELSE 94+(i%5) END,CASE WHEN category='Working Memory' THEN 'Short Term' WHEN category IN ('Knowledge Base','Semantic Memory','Organization Memory','Brand Memory') THEN 'Long Term' WHEN category='Recovery Memory' THEN 'Archive' ELSE 'Medium' END,'Encrypted',DATEADD(minute,-i*3,SYSUTCDATETIME()),CASE WHEN i%13=0 THEN 0 ELSE 1 END,'validated','verified',CASE WHEN i%37=0 THEN 88 ELSE 94+(i%6) END,CAST(0.20+(i%21)*0.045 AS DECIMAL(18,4)),0 FROM src OPTION (MAXRECURSION 0);

INSERT INTO ai_memory_collections(organization_id,collection_name,memory_category,object_count,vector_count,health_percent)
SELECT @org,CONCAT(REPLACE(name,' ','_'),'_collection'),name,12000+(rn*913),18000+(rn*1401),CASE WHEN rn%5=0 THEN 94 ELSE 97 END FROM @categories;

INSERT INTO ai_memory_versions(memory_id,version_label,change_summary,confidence_percent,provenance_state) SELECT id,current_version,'Memory structure versioned from governed synchronization.',confidence_percent,provenance_state FROM (SELECT id,CONCAT('v',1+(ABS(CHECKSUM(id))%4),'.',ABS(CHECKSUM(memory_code))%10) current_version,confidence_percent,provenance_state FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%') s;
INSERT INTO ai_memory_embeddings(memory_id,embedding_model,dimensions,chunk_size,overlap_tokens,normalization,version_label,health_percent) SELECT id,embedding_model,CASE WHEN embedding_model LIKE '%small%' THEN 1536 ELSE 3072 END,CASE WHEN category='Conversation Memory' THEN 800 ELSE 1200 END,120,'l2-normalized','emb-v3',health_percent FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_vectors(memory_id,collection_name,vector_store,vector_count,index_state,replication_state,compression_state,performance_ms) SELECT id,CONCAT(REPLACE(category,' ','_'),'_collection'),vector_store,object_count*2,'indexed','replicated','compressed',90+(ABS(CHECKSUM(memory_code))%120) FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_indexes(memory_id,index_name,index_type,partition_count,rebuild_state,last_reindexed_at) SELECT id,CONCAT(memory_code,'_hnsw'),CASE WHEN vector_store LIKE '%Redis%' THEN 'FLAT' ELSE 'HNSW' END,1+(ABS(CHECKSUM(id))%8),CASE WHEN status='Reindexing' THEN 'running' ELSE 'current' END,DATEADD(hour,-ABS(CHECKSUM(memory_code))%72,SYSUTCDATETIME()) FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_chunks(memory_id,chunk_key,token_count,confidence_percent,freshness_percent,dedupe_state) SELECT id,CONCAT(memory_code,'-chunk-a'),900+(ABS(CHECKSUM(id))%900),confidence_percent,freshness_percent,CASE WHEN ABS(CHECKSUM(id))%17=0 THEN 'duplicate-watch' ELSE 'unique' END FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_graph(memory_id,entity_name,entity_type,topic,evidence_count,confidence_percent) SELECT id,CONCAT(category,' Entity'),CASE WHEN category LIKE '%Brand%' THEN 'Brand' WHEN category LIKE '%Audience%' THEN 'Audience' WHEN category LIKE '%Workflow%' THEN 'Workflow' ELSE 'Knowledge' END,category,3+(ABS(CHECKSUM(id))%19),confidence_percent FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_relationships(memory_id,source_entity,relationship_type,target_entity,evidence_state,confidence_percent) SELECT id,CONCAT(category,' Entity'),'contributes_to','Final Output Contract','verified',confidence_percent FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_sources(memory_id,source_name,source_type,validation_state,provenance_score) SELECT id,CONCAT(category,' Source'),'database, workflow, agent, tool, prompt','verified',confidence_percent FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_sync(memory_id,sync_path,sync_state,lag_seconds,last_sync_at) SELECT id,'Agent > Shared Memory > Organization > Knowledge Base > Learning',CASE WHEN status='Stale' THEN 'lagging' ELSE 'synchronized' END,CASE WHEN status='Stale' THEN 420 ELSE ABS(CHECKSUM(id))%45 END,DATEADD(minute,-ABS(CHECKSUM(id))%120,SYSUTCDATETIME()) FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_retention(memory_id,policy_name,retention_days,archive_after_days,delete_after_days,compliance_state) SELECT id,retention_policy,CASE retention_policy WHEN 'Short Term' THEN 14 WHEN 'Medium' THEN 180 WHEN 'Archive' THEN 1825 ELSE 3650 END,CASE retention_policy WHEN 'Short Term' THEN 30 WHEN 'Medium' THEN 365 ELSE 3650 END,CASE retention_policy WHEN 'Archive' THEN 3650 ELSE 7300 END,'compliant' FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_retrieval(memory_id,retrieval_mode,query_count_today,success_rate,average_time_ms,reranking_state,filter_state) SELECT id,CASE ABS(CHECKSUM(id))%4 WHEN 0 THEN 'Vector Search' WHEN 1 THEN 'Hybrid Search' WHEN 2 THEN 'Graph Search' ELSE 'Keyword Search' END,140+(ABS(CHECKSUM(memory_code))%3000),retrieval_rate,90+(ABS(CHECKSUM(id))%130),'enabled','policy-filtered' FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_security(memory_id,encryption_state,pii_state,secrets_state,tenant_isolation,audit_state,redaction_state,risk_score) SELECT id,encryption_state,CASE WHEN classification='Confidential' THEN 'pii-watch' ELSE 'clear' END,'no-secrets','strict','audit-enabled','automatic',CASE WHEN classification='Confidential' THEN 31 ELSE 8+(ABS(CHECKSUM(id))%14) END FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_metrics(memory_id,growth_rate,usage_count,retrieval_accuracy,confidence_percent,freshness_percent,coverage_percent,cost_today) SELECT id,CAST(1+(ABS(CHECKSUM(id))%18) AS DECIMAL(8,2)),object_count*3,retrieval_rate,confidence_percent,freshness_percent,90+(ABS(CHECKSUM(memory_code))%9),cost_today FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_recovery(memory_id,recovery_action,recovery_state,restore_point,verification_state,last_recovery_at) SELECT id,CASE WHEN status='Reindexing' THEN 'Reindex' WHEN status='Stale' THEN 'Synchronize' ELSE 'Verify' END,CASE WHEN status IN ('Reindexing','Stale') THEN 'running' ELSE 'ready' END,CONCAT(memory_code,'-restore-point'),'verified',DATEADD(day,-ABS(CHECKSUM(id))%14,SYSUTCDATETIME()) FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_learning(memory_id,learning_event,applied_to_memory,applied_to_prompts,applied_to_tools) SELECT id,'retrieval outcome synchronized into learning memory',1,CASE WHEN final_output_linked=1 THEN 1 ELSE 0 END,1 FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
INSERT INTO ai_memory_final_outputs(memory_id,output_name,workflow_name,publishing_channel,learning_state,business_result,readiness) SELECT id,CONCAT(category,' final-output contribution'),'Autonomous Content Lifecycle',CASE WHEN category LIKE '%Publishing%' THEN 'Publishing Queue' ELSE 'CACSMS Content Pipeline' END,'learning synchronized','quality, speed, recovery, personalization',CASE WHEN final_output_linked=1 THEN 96 ELSE 84 END FROM ai_memory WHERE organization_id=@org AND memory_code LIKE 'MEM-%';
