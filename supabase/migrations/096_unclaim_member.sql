-- 096_unclaim_member.sql
-- "Ekipten Çıkar" — claimIndependentSignupToTeamAction'ın simetrik tersi.
-- Lider, downline app-user üyesini ekibinden çıkarır:
--   1) hedef workspace.parent_id = NULL → kişi yeniden bağımsız ("dış kayıt") olur
--      (Ekibim listesi, admin Dış Kayıtlar kutusu ve istatistik tabloları güncellenir).
--   2) liderin pipeline'ındaki bağlı "katıldı" adayı silinir (CASCADE ile link de düşer)
--      → huni/Hedefim metrikleri de buna göre güncellenir.
-- SECURITY DEFINER: çağıran YALNIZ kendi downline'ını (parent_id eşleşen) çıkarabilir.
-- Tam tersine çalışır: kişi tekrar "Ekibime Bağla" ile downline'a alınabilir.

CREATE OR REPLACE FUNCTION nmm_unclaim_member(p_member_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       uuid := auth.uid();
  v_my_ws        uuid;
  v_target_ws    uuid;
  v_candidate_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_my_ws FROM nmm_workspaces WHERE owner_id = v_caller LIMIT 1;
  IF v_my_ws IS NULL THEN
    RAISE EXCEPTION 'no_workspace';
  END IF;

  -- Hedef, çağıranın downline'ı olmalı (yetkisiz çıkarma / sponsor çalma engeli).
  SELECT id INTO v_target_ws
  FROM nmm_workspaces
  WHERE owner_id = p_member_user_id AND parent_id = v_my_ws
  LIMIT 1;
  IF v_target_ws IS NULL THEN
    RAISE EXCEPTION 'not_your_member';
  END IF;

  -- 1) Bağı kopar → kişi bağımsız (dış kayıt) olur.
  UPDATE nmm_workspaces SET parent_id = NULL WHERE id = v_target_ws;

  -- 2) Liderin pipeline'ındaki bağlı adayı sil (CASCADE linki de düşürür).
  SELECT candidate_id INTO v_candidate_id
  FROM nmm_team_pipeline_links
  WHERE workspace_id = v_my_ws AND member_user_id = p_member_user_id;

  IF v_candidate_id IS NOT NULL THEN
    DELETE FROM nmm_candidates
    WHERE id = v_candidate_id AND workspace_id = v_my_ws AND owner_id = v_caller;
  END IF;

  -- 3) Aday önceden silinmişse kalan link'i de temizle (idempotent).
  DELETE FROM nmm_team_pipeline_links
  WHERE workspace_id = v_my_ws AND member_user_id = p_member_user_id;

  RETURN json_build_object('ok', true, 'workspace_id', v_target_ws);
END;
$$;

GRANT EXECUTE ON FUNCTION nmm_unclaim_member(uuid) TO authenticated;
