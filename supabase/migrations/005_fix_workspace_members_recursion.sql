-- 005: nmm_workspace_members RLS sonsuz döngü (infinite recursion) düzeltmesi

-- 1. Eski sorunlu politikaları temizleyelim
DROP POLICY IF EXISTS "nmm_member_read" ON nmm_workspace_members;
DROP POLICY IF EXISTS "nmm_leader_manage_members" ON nmm_workspace_members;
DROP POLICY IF EXISTS "nmm_owner_insert_first_membership" ON nmm_workspace_members;
DROP POLICY IF EXISTS "nmm_member_self_update" ON nmm_workspace_members;
DROP POLICY IF EXISTS "nmm_workspace_members_select_policy" ON nmm_workspace_members;

-- 2. Güvenli (Security Definer) bir üyelik kontrol fonksiyonu tanımlayalım.
-- Bu fonksiyon RLS tetiklemeden (sahip yetkileriyle) sorgulama yaptığı için sonsuz döngüyü engeller.
CREATE OR REPLACE FUNCTION nmm_is_member_of_workspace(w_id uuid, u_id uuid)
RETURNS boolean SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM nmm_workspace_members
    WHERE workspace_id = w_id AND user_id = u_id
  );
END;
$$;

-- 3. Üyelerin kendi workspace'lerindeki diğer üyeleri okuyabilmesi için SELECT politikası (sonsuz döngü barındırmaz)
CREATE POLICY "nmm_member_read" ON nmm_workspace_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE owner_id = auth.uid()
    )
    OR nmm_is_member_of_workspace(workspace_id, auth.uid())
  );

-- 4. Üye ekleme / katılım akışı için INSERT politikası
CREATE POLICY "nmm_owner_insert_first_membership" ON nmm_workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE owner_id = auth.uid()
    )
  );

-- 5. Kendi ad soyadını ve bilgilerini güncelleyebilmek için UPDATE politikası
CREATE POLICY "nmm_member_self_update" ON nmm_workspace_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Liderin kendi ekibindeki tüm üyelikleri yönetebilmesi için ALL politikası
CREATE POLICY "nmm_leader_manage_members" ON nmm_workspace_members
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id FROM nmm_workspaces WHERE owner_id = auth.uid()
    )
  );
