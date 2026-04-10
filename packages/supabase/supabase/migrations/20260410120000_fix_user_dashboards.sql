-- Fix user_dashboards: add tenant_id, updated_at trigger, audit trigger, and hotkey index

-- 1. Add tenant_id column for multi-tenant isolation
ALTER TABLE public.user_dashboards
  ADD COLUMN tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'
  REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Remove the default after backfill (new rows must always supply tenant_id)
ALTER TABLE public.user_dashboards ALTER COLUMN tenant_id DROP DEFAULT;

CREATE INDEX idx_user_dashboards_tenant_id ON public.user_dashboards(tenant_id);

-- 2. Add updated_at trigger (all other tables have this)
DROP TRIGGER IF EXISTS set_user_dashboards_updated_at ON public.user_dashboards;
CREATE TRIGGER set_user_dashboards_updated_at
  BEFORE UPDATE ON public.user_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 3. Add audit logging trigger (all other tables have this)
DROP TRIGGER IF EXISTS audit_user_dashboards ON public.user_dashboards;
CREATE TRIGGER audit_user_dashboards
  AFTER INSERT OR UPDATE OR DELETE ON public.user_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_fn();

-- 4. Fix hotkey unique index — exclude NULLs so multiple dashboards can have hotkey = NULL
DROP INDEX IF EXISTS idx_user_dashboards_user_id_hotkey;
CREATE UNIQUE INDEX idx_user_dashboards_user_id_hotkey
  ON public.user_dashboards(user_id, hotkey) WHERE hotkey IS NOT NULL;
