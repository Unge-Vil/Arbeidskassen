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
  jwt_tenant_id := COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'current_tenant_id', ''),
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'current_tenant_id', '')
  );

  IF jwt_tenant_id IS NOT NULL THEN
    SELECT tm.tenant_id
    INTO resolved_tenant_id
    FROM public.tenant_members tm
    WHERE tm.user_id = auth.uid()
      AND tm.tenant_id = jwt_tenant_id::uuid
      AND tm.is_active = true
    LIMIT 1;

    IF resolved_tenant_id IS NOT NULL THEN
      RETURN resolved_tenant_id;
    END IF;
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

DROP POLICY IF EXISTS "tenant_select" ON public.tenants;
CREATE POLICY "tenant_select" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_members tm
      WHERE tm.tenant_id = tenants.id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

DROP POLICY IF EXISTS "tenant_select" ON public.tenant_members;
CREATE POLICY "tenant_select" ON public.tenant_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR tenant_id = public.get_current_tenant_id()
  );
