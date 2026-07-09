IF OBJECT_ID('schema_migrations', 'U') IS NULL
BEGIN
  CREATE TABLE schema_migrations (
    version NVARCHAR(100) NOT NULL PRIMARY KEY,
    applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema')
BEGIN
CREATE TABLE organizations (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  slug NVARCHAR(120) NOT NULL UNIQUE,
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE users (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  full_name NVARCHAR(160) NOT NULL,
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'active',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE roles (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(120) NOT NULL,
  code NVARCHAR(80) NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_roles_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT uq_roles_org_code UNIQUE (organization_id, code)
);

CREATE TABLE permissions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  code NVARCHAR(120) NOT NULL UNIQUE,
  description NVARCHAR(255) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE user_roles (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  user_id UNIQUEIDENTIFIER NOT NULL,
  role_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE role_permissions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  role_id UNIQUEIDENTIFIER NOT NULL,
  permission_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id),
  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE modules (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  slug NVARCHAR(120) NOT NULL,
  description NVARCHAR(500) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_modules_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT uq_modules_org_slug UNIQUE (organization_id, slug)
);

CREATE TABLE sub_modules (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  module_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  slug NVARCHAR(120) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_sub_modules_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_sub_modules_module FOREIGN KEY (module_id) REFERENCES modules(id)
);

CREATE TABLE pages (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  module_id UNIQUEIDENTIFIER NOT NULL,
  sub_module_id UNIQUEIDENTIFIER NULL,
  name NVARCHAR(160) NOT NULL,
  slug NVARCHAR(120) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'in_progress',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pages_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_pages_module FOREIGN KEY (module_id) REFERENCES modules(id),
  CONSTRAINT fk_pages_sub_module FOREIGN KEY (sub_module_id) REFERENCES sub_modules(id)
);

CREATE TABLE routes (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  page_id UNIQUEIDENTIFIER NOT NULL,
  path NVARCHAR(300) NOT NULL,
  http_method NVARCHAR(10) NOT NULL DEFAULT 'GET',
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_routes_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_routes_page FOREIGN KEY (page_id) REFERENCES pages(id),
  CONSTRAINT uq_routes_org_path_method UNIQUE (organization_id, path, http_method)
);

CREATE TABLE sidebar_sections (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(120) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_sidebar_sections_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE sidebar_items (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  sidebar_section_id UNIQUEIDENTIFIER NOT NULL,
  module_id UNIQUEIDENTIFIER NULL,
  page_id UNIQUEIDENTIFIER NULL,
  title NVARCHAR(160) NOT NULL,
  href NVARCHAR(300) NOT NULL,
  icon NVARCHAR(80) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_sidebar_items_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_sidebar_items_section FOREIGN KEY (sidebar_section_id) REFERENCES sidebar_sections(id),
  CONSTRAINT fk_sidebar_items_module FOREIGN KEY (module_id) REFERENCES modules(id),
  CONSTRAINT fk_sidebar_items_page FOREIGN KEY (page_id) REFERENCES pages(id)
);

CREATE TABLE implementation_linkage_matrix (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  module_id UNIQUEIDENTIFIER NOT NULL,
  page_id UNIQUEIDENTIFIER NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'in_progress',
  health_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  route_linked BIT NOT NULL DEFAULT 0,
  component_ready BIT NOT NULL DEFAULT 0,
  api_linked BIT NOT NULL DEFAULT 0,
  storage_validated BIT NOT NULL DEFAULT 0,
  final_output_ready BIT NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_impl_matrix_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_impl_matrix_module FOREIGN KEY (module_id) REFERENCES modules(id),
  CONSTRAINT fk_impl_matrix_page FOREIGN KEY (page_id) REFERENCES pages(id)
);

CREATE TABLE workflow_definitions (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'draft',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_definitions_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE workflow_stages (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  workflow_definition_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  status NVARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_workflow_stages_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_workflow_stages_definition FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id)
);

CREATE TABLE system_services (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  health_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  latency_ms INT NULL,
  last_checked_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_system_services_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE api_endpoints (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  api_group NVARCHAR(120) NOT NULL,
  endpoint NVARCHAR(300) NOT NULL,
  http_method NVARCHAR(10) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  health_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  avg_latency_ms INT NULL,
  error_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_api_endpoints_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT uq_api_endpoints_org_endpoint_method UNIQUE (organization_id, endpoint, http_method)
);

CREATE TABLE job_queues (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'running',
  health_percent DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_job_queues_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE background_jobs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  job_queue_id UNIQUEIDENTIFIER NULL,
  name NVARCHAR(200) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'queued',
  priority NVARCHAR(40) NOT NULL DEFAULT 'medium',
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  started_at DATETIME2 NULL,
  completed_at DATETIME2 NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_background_jobs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_background_jobs_queue FOREIGN KEY (job_queue_id) REFERENCES job_queues(id)
);

CREATE TABLE ai_agents (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_ai_agents_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE content_items (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  title NVARCHAR(255) NOT NULL,
  content_type NVARCHAR(80) NOT NULL DEFAULT 'article',
  status NVARCHAR(40) NOT NULL DEFAULT 'draft',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_content_items_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE publishing_channels (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(160) NOT NULL,
  provider NVARCHAR(120) NOT NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'operational',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_publishing_channels_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE content_analytics (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  content_item_id UNIQUEIDENTIFIER NULL,
  metric_name NVARCHAR(120) NOT NULL,
  metric_value DECIMAL(18,4) NOT NULL,
  measured_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_content_analytics_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_content_analytics_content FOREIGN KEY (content_item_id) REFERENCES content_items(id)
);

CREATE TABLE notifications (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NOT NULL,
  user_id UNIQUEIDENTIFIER NULL,
  title NVARCHAR(200) NOT NULL,
  body NVARCHAR(MAX) NULL,
  status NVARCHAR(40) NOT NULL DEFAULT 'pending',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_notifications_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  actor_user_id UNIQUEIDENTIFIER NULL,
  action NVARCHAR(120) NOT NULL,
  entity_name NVARCHAR(120) NOT NULL,
  entity_id UNIQUEIDENTIFIER NULL,
  metadata NVARCHAR(MAX) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_audit_logs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE system_settings (
  id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  organization_id UNIQUEIDENTIFIER NULL,
  setting_key NVARCHAR(160) NOT NULL,
  setting_value NVARCHAR(MAX) NULL,
  value_type NVARCHAR(40) NOT NULL DEFAULT 'string',
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NULL,
  created_by UNIQUEIDENTIFIER NULL,
  updated_by UNIQUEIDENTIFIER NULL,
  is_active BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT fk_system_settings_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX ix_modules_org ON modules(organization_id, display_order);
CREATE INDEX ix_pages_org_module ON pages(organization_id, module_id);
CREATE INDEX ix_routes_org ON routes(organization_id, path);
CREATE INDEX ix_services_org_status ON system_services(organization_id, status);
CREATE INDEX ix_api_endpoints_org_status ON api_endpoints(organization_id, status);
CREATE INDEX ix_background_jobs_org_status ON background_jobs(organization_id, status);
CREATE INDEX ix_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);

INSERT INTO schema_migrations(version) VALUES ('001_initial_schema');
END;
