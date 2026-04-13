-- Performance indexes for the two most frequent hot-path queries:
--
--   getShellContext()  : SELECT ... FROM tenant_members WHERE user_id = $1 AND is_active = true
--   getTenantContext() : SELECT ... FROM tenant_members WHERE user_id = $1 AND is_active = true
--   Admin brukerliste  : SELECT ... FROM tenant_members WHERE tenant_id = $1 AND is_active = true
--
-- The existing idx_tenant_members_tenant_user (tenant_id, user_id) was designed for
-- tenant-first lookups. Both shell and full context queries filter by user_id first,
-- so a (user_id, is_active) composite index avoids a seq-scan per page load.

-- Covers getShellContext + getTenantContext (user_id first, then is_active filter)
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_active
  ON public.tenant_members (user_id, is_active);

-- Covers admin brukerliste views (filter active members of a given tenant)
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_active
  ON public.tenant_members (tenant_id, is_active);
