-- Minimal local development seed for the Organisasjon core module.
-- Note: `tenant_members` is intentionally left empty until a real auth user exists locally.

INSERT INTO public.tenants (
  id,
  slug,
  name,
  legal_name,
  display_name,
  organization_number,
  billing_email,
  plan,
  plan_status
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo-tenant',
  'DEMO TENANT',
  'DEMO TENANT',
  'DEMO TENANT',
  '999888777',
  'jan.helge@ungevil.no',
  'professional',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  billing_email = EXCLUDED.billing_email,
  plan = EXCLUDED.plan,
  plan_status = EXCLUDED.plan_status;

INSERT INTO public.organizations (id, tenant_id, name, slug, cost_center)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'DEMO ORGANISASJON',
  'demo-organisasjon',
  'DEMO-001'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (id, tenant_id, org_id, name, description)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Ledelse',
  'Kjerneavdeling for DEMO TENANT'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.sub_departments (id, tenant_id, dept_id, name, description)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'Support',
  'Undergruppe for demo og testing'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_credits (id, tenant_id, balance, lifetime_purchased, lifetime_used)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  250,
  250,
  0
)
ON CONFLICT (tenant_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  lifetime_purchased = EXCLUDED.lifetime_purchased,
  lifetime_used = EXCLUDED.lifetime_used;
