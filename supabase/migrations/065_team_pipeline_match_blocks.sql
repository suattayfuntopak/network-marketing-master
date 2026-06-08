-- Lider "boru hattı bağlantısını kaldır" dediğinde isim/telefon otomatik eşleşmesini sustur.

CREATE TABLE IF NOT EXISTS nmm_team_pipeline_match_blocks (
  workspace_id uuid NOT NULL REFERENCES nmm_workspaces(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, member_user_id)
);

ALTER TABLE nmm_team_pipeline_match_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_pipeline_match_blocks_leader_all ON nmm_team_pipeline_match_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM nmm_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nmm_workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );
