CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS public.member_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.tenant_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (member_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_tenant_archived
  ON public.custom_roles (tenant_id, is_archived, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_role_assignments_tenant_member
  ON public.member_role_assignments (tenant_id, member_id, is_active);
CREATE INDEX IF NOT EXISTS idx_member_role_assignments_tenant_role
  ON public.member_role_assignments (tenant_id, role_id, is_active);

DROP TRIGGER IF EXISTS set_custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER set_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS set_member_role_assignments_updated_at ON public.member_role_assignments;
CREATE TRIGGER set_member_role_assignments_updated_at
BEFORE UPDATE ON public.member_role_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.member_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_role_assignments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select" ON public.custom_roles;
CREATE POLICY "tenant_select" ON public.custom_roles
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.custom_roles;
CREATE POLICY "tenant_insert" ON public.custom_roles
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.custom_roles;
CREATE POLICY "tenant_update" ON public.custom_roles
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.custom_roles;
CREATE POLICY "tenant_delete" ON public.custom_roles
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.member_role_assignments;
CREATE POLICY "tenant_select" ON public.member_role_assignments
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.member_role_assignments;
CREATE POLICY "tenant_insert" ON public.member_role_assignments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.member_role_assignments;
CREATE POLICY "tenant_update" ON public.member_role_assignments
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.member_role_assignments;
CREATE POLICY "tenant_delete" ON public.member_role_assignments
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP TRIGGER IF EXISTS audit_custom_roles ON public.custom_roles;
CREATE TRIGGER audit_custom_roles
AFTER INSERT OR UPDATE OR DELETE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_member_role_assignments ON public.member_role_assignments;
CREATE TRIGGER audit_member_role_assignments
AFTER INSERT OR UPDATE OR DELETE ON public.member_role_assignments
FOR EACH ROW
EXECUTE FUNCTION public.audit_trigger_fn();
