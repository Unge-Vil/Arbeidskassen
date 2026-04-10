CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_tenant_id TEXT;
  resolved_tenant_id UUID;
BEGIN
  jwt_tenant_id := NULLIF(auth.jwt() -> 'app_metadata' ->> 'current_tenant_id', '');

  IF jwt_tenant_id IS NOT NULL THEN
    RETURN jwt_tenant_id::uuid;
  END IF;

  SELECT tm.tenant_id
  INTO resolved_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = auth.uid()
    AND tm.is_active = true
  ORDER BY
    CASE tm.role
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'member' THEN 2
      ELSE 3
    END,
    tm.created_at ASC
  LIMIT 1;

  RETURN resolved_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.tenant_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_role public.tenant_role;
BEGIN
  SELECT tm.role
  INTO resolved_role
  FROM public.tenant_members tm
  WHERE tm.user_id = auth.uid()
    AND tm.tenant_id = public.get_current_tenant_id()
    AND tm.is_active = true
  ORDER BY tm.created_at ASC
  LIMIT 1;

  RETURN COALESCE(resolved_role, 'viewer'::public.tenant_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_tenant_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'tenants' THEN
    effective_tenant_id := COALESCE(
      NULLIF(to_jsonb(NEW) ->> 'id', '')::uuid,
      NULLIF(to_jsonb(OLD) ->> 'id', '')::uuid
    );
  ELSIF TG_OP = 'DELETE' THEN
    effective_tenant_id := NULLIF(to_jsonb(OLD) ->> 'tenant_id', '')::uuid;
  ELSE
    effective_tenant_id := NULLIF(to_jsonb(NEW) ->> 'tenant_id', '')::uuid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, new_data, changed_by)
    VALUES (effective_tenant_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (effective_tenant_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, old_data, changed_by)
    VALUES (effective_tenant_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_organizations_tenant_created_at
  ON public.organizations (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_org
  ON public.departments (tenant_id, org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_departments_tenant_dept
  ON public.sub_departments (tenant_id, dept_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_user
  ON public.tenant_members (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_credit_transactions_tenant_time
  ON public.ai_credit_transactions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_time
  ON public.audit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record
  ON public.audit_logs (table_name, record_id, created_at DESC);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sub_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select" ON public.tenants;
CREATE POLICY "tenant_select" ON public.tenants
  FOR SELECT USING (id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.tenants;
CREATE POLICY "tenant_insert" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tenant_update" ON public.tenants;
CREATE POLICY "tenant_update" ON public.tenants
  FOR UPDATE USING (
    id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.tenants;
CREATE POLICY "tenant_delete" ON public.tenants
  FOR DELETE USING (
    id = public.get_current_tenant_id()
    AND public.get_current_user_role() = 'owner'
  );

DROP POLICY IF EXISTS "tenant_select" ON public.organizations;
CREATE POLICY "tenant_select" ON public.organizations
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.organizations;
CREATE POLICY "tenant_insert" ON public.organizations
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.organizations;
CREATE POLICY "tenant_update" ON public.organizations
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.organizations;
CREATE POLICY "tenant_delete" ON public.organizations
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.departments;
CREATE POLICY "tenant_select" ON public.departments
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.departments;
CREATE POLICY "tenant_insert" ON public.departments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.departments;
CREATE POLICY "tenant_update" ON public.departments
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.departments;
CREATE POLICY "tenant_delete" ON public.departments
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.sub_departments;
CREATE POLICY "tenant_select" ON public.sub_departments
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.sub_departments;
CREATE POLICY "tenant_insert" ON public.sub_departments
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.sub_departments;
CREATE POLICY "tenant_update" ON public.sub_departments
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.sub_departments;
CREATE POLICY "tenant_delete" ON public.sub_departments
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.tenant_members;
CREATE POLICY "tenant_select" ON public.tenant_members
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.tenant_members;
CREATE POLICY "tenant_insert" ON public.tenant_members
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.tenant_members;
CREATE POLICY "tenant_update" ON public.tenant_members
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.tenant_members;
CREATE POLICY "tenant_delete" ON public.tenant_members
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.ai_credits;
CREATE POLICY "tenant_select" ON public.ai_credits
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.ai_credits;
CREATE POLICY "tenant_insert" ON public.ai_credits
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.ai_credits;
CREATE POLICY "tenant_update" ON public.ai_credits
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.ai_credits;
CREATE POLICY "tenant_delete" ON public.ai_credits
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.ai_credit_transactions;
CREATE POLICY "tenant_select" ON public.ai_credit_transactions
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.ai_credit_transactions;
CREATE POLICY "tenant_insert" ON public.ai_credit_transactions
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_update" ON public.ai_credit_transactions;
CREATE POLICY "tenant_update" ON public.ai_credit_transactions
  FOR UPDATE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_delete" ON public.ai_credit_transactions;
CREATE POLICY "tenant_delete" ON public.ai_credit_transactions
  FOR DELETE USING (
    tenant_id = public.get_current_tenant_id()
    AND public.get_current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "tenant_select" ON public.audit_logs;
CREATE POLICY "tenant_select" ON public.audit_logs
  FOR SELECT USING (tenant_id = public.get_current_tenant_id());

DROP POLICY IF EXISTS "tenant_insert" ON public.audit_logs;
CREATE POLICY "tenant_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    tenant_id = public.get_current_tenant_id()
    AND auth.uid() IS NOT NULL
  );

DROP TRIGGER IF EXISTS audit_tenants ON public.tenants;
CREATE TRIGGER audit_tenants
AFTER INSERT OR UPDATE OR DELETE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations
AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_departments ON public.departments;
CREATE TRIGGER audit_departments
AFTER INSERT OR UPDATE OR DELETE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_sub_departments ON public.sub_departments;
CREATE TRIGGER audit_sub_departments
AFTER INSERT OR UPDATE OR DELETE ON public.sub_departments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_tenant_members ON public.tenant_members;
CREATE TRIGGER audit_tenant_members
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_members
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_ai_credits ON public.ai_credits;
CREATE TRIGGER audit_ai_credits
AFTER INSERT OR UPDATE OR DELETE ON public.ai_credits
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

DROP TRIGGER IF EXISTS audit_ai_credit_transactions ON public.ai_credit_transactions;
CREATE TRIGGER audit_ai_credit_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.ai_credit_transactions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
