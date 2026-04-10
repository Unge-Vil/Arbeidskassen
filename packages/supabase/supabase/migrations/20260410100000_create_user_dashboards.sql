CREATE TABLE public.user_dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    "order" integer NOT NULL DEFAULT 0,
    layout_config jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dashboards"
    ON public.user_dashboards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboards"
    ON public.user_dashboards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
    ON public.user_dashboards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards"
    ON public.user_dashboards FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_user_dashboards_user_id ON public.user_dashboards(user_id);
