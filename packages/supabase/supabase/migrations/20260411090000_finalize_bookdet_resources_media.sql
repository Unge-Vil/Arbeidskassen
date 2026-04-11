ALTER TABLE public.bookdet_resources
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC,
  ADD COLUMN IF NOT EXISTS location_id UUID,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE public.bookdet_resources
SET images = '{}'::text[]
WHERE images IS NULL;

UPDATE public.bookdet_resources
SET properties = '{}'::jsonb
WHERE properties IS NULL;

ALTER TABLE public.bookdet_resources
  ALTER COLUMN images SET DEFAULT '{}'::text[],
  ALTER COLUMN images SET NOT NULL,
  ALTER COLUMN properties SET DEFAULT '{}'::jsonb,
  ALTER COLUMN properties SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookdet_resources_tenant_location
  ON public.bookdet_resources (tenant_id, location_id)
  WHERE location_id IS NOT NULL;

COMMENT ON COLUMN public.bookdet_resources.images IS
  'Supabase Storage public URLs for resource images stored in the bookdet_media bucket.';

COMMENT ON COLUMN public.bookdet_resources.location_id IS
  'Forward-compatible location reference. Foreign key will be added once the shared locations table exists.';

COMMENT ON COLUMN public.bookdet_resources.properties IS
  'Dynamic resource-specific fields stored as JSON.';

INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
VALUES (
  'bookdet_media',
  'bookdet_media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  "public" = EXCLUDED."public",
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "bookdet_media public read" ON storage.objects;
CREATE POLICY "bookdet_media public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bookdet_media');

DROP POLICY IF EXISTS "bookdet_media tenant insert" ON storage.objects;
CREATE POLICY "bookdet_media tenant insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bookdet_media'
  AND public.get_current_tenant_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  AND COALESCE((storage.foldername(name))[2], '') = 'resources'
  AND public.get_current_user_role() IN ('owner', 'admin', 'member')
);

DROP POLICY IF EXISTS "bookdet_media tenant update" ON storage.objects;
CREATE POLICY "bookdet_media tenant update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'bookdet_media'
  AND public.get_current_tenant_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  AND COALESCE((storage.foldername(name))[2], '') = 'resources'
  AND public.get_current_user_role() IN ('owner', 'admin', 'member')
)
WITH CHECK (
  bucket_id = 'bookdet_media'
  AND public.get_current_tenant_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  AND COALESCE((storage.foldername(name))[2], '') = 'resources'
  AND public.get_current_user_role() IN ('owner', 'admin', 'member')
);

DROP POLICY IF EXISTS "bookdet_media tenant delete" ON storage.objects;
CREATE POLICY "bookdet_media tenant delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'bookdet_media'
  AND public.get_current_tenant_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  AND COALESCE((storage.foldername(name))[2], '') = 'resources'
  AND public.get_current_user_role() IN ('owner', 'admin', 'member')
);
