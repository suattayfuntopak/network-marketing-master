-- Composite index: aday listesi workspace_id + owner_id + updated_at DESC sıralaması
CREATE INDEX IF NOT EXISTS idx_nmm_candidates_ws_owner_updated
  ON public.nmm_candidates (workspace_id, owner_id, updated_at DESC);
