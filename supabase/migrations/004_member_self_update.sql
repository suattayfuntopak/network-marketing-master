-- 004: Üye self-update RLS + joined_at kolonu

-- Üyelerin kendi membership satırlarını güncelleyebilmesi (ekibe katılma akışı için gerekli)
CREATE POLICY "nmm_member_self_update" ON nmm_workspace_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- joined_at kolonu: bir üyenin ekibe ne zaman katıldığını kaydeder
ALTER TABLE nmm_workspace_members
  ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();

-- Mevcut satırlar için created_at'i kullan
UPDATE nmm_workspace_members
  SET joined_at = created_at
  WHERE joined_at IS NULL;
