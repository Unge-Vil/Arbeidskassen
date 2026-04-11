CREATE TABLE IF NOT EXISTS public.bookdet_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  dept_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'archived')),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_bookdet_resources_tenant_created_at
  ON public.bookdet_resources (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookdet_resources_tenant_org
  ON public.bookdet_resources (tenant_id, org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookdet_resources_tenant_dept
  ON public.bookdet_resources (tenant_id, dept_id, created_at DESC);

ALTER TABLE public.bookdet_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookdet_resources FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select" ON public.bookdet_resources;
CREATE POLICY "tenant_select" ON public.bookdet_resources
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.bookdet_resources;
CREATE POLICY "tenant_insert" ON public.bookdet_resources
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.bookdet_resources;
CREATE POLICY "tenant_update" ON public.bookdet_resources
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.bookdet_resources;
CREATE POLICY "tenant_delete" ON public.bookdet_resources
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP TRIGGER IF EXISTS set_bookdet_resources_updated_at ON public.bookdet_resources;
CREATE TRIGGER set_bookdet_resources_updated_at
BEFORE UPDATE ON public.bookdet_resources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS audit_bookdet_resources ON public.bookdet_resources;
CREATE TRIGGER audit_bookdet_resources
AFTER INSERT OR UPDATE OR DELETE ON public.bookdet_resources
FOR EACH ROW
EXECUTE FUNCTION public.audit_trigger_fn();
