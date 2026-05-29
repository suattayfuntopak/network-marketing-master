-- 028: Workspace-scoped presentation materials for candidate WhatsApp sharing

CREATE TABLE IF NOT EXISTS public.nmm_presentation_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.nmm_workspaces (id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  whatsapp_template text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nmm_presentation_materials_title_len CHECK (char_length(title) BETWEEN 1 AND 120),
  CONSTRAINT nmm_presentation_materials_url_len CHECK (char_length(url) BETWEEN 8 AND 2048),
  CONSTRAINT nmm_presentation_materials_template_len CHECK (char_length(whatsapp_template) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_presentation_materials_workspace
  ON public.nmm_presentation_materials (workspace_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_presentation_materials_one_default
  ON public.nmm_presentation_materials (workspace_id)
  WHERE is_default = true;

ALTER TABLE public.nmm_presentation_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace members manage presentation materials" ON public.nmm_presentation_materials;
CREATE POLICY "workspace members manage presentation materials" ON public.nmm_presentation_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.nmm_workspace_members m
      WHERE m.workspace_id = nmm_presentation_materials.workspace_id
        AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.nmm_workspaces w
      WHERE w.id = nmm_presentation_materials.workspace_id
        AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.nmm_workspace_members m
      WHERE m.workspace_id = nmm_presentation_materials.workspace_id
        AND m.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.nmm_workspaces w
      WHERE w.id = nmm_presentation_materials.workspace_id
        AND w.owner_id = auth.uid()
    )
  );
