-- 088: Selda ↔ Ezgi görüntüleme avatar swap (087 sonrası hâlâ ters görünüyorsa)
-- Storage dosya içerikleri aday id ile ters yüklendi; kullanıcı satırlarında URL karşılıklı değişim.

DO $$
DECLARE
  v_url_on_00fa3484 text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg';
  v_url_on_001a2b65 text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg';
  v_selda uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_ezgi uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
  v_selda_cur text;
  v_ezgi_cur text;
BEGIN
  SELECT avatar_url INTO v_selda_cur FROM nmm_workspace_members WHERE user_id = v_selda LIMIT 1;
  SELECT avatar_url INTO v_ezgi_cur FROM nmm_workspace_members WHERE user_id = v_ezgi LIMIT 1;

  -- Zaten swap edilmişse (Selda'da 001a2b65 dosyası) tekrar dokunma
  IF v_selda_cur IS NOT NULL AND v_selda_cur LIKE '%001a2b65%' THEN
    RAISE NOTICE 'Selda/Ezgi avatar swap zaten uygulanmış; atlandı.';
    RETURN;
  END IF;

  UPDATE nmm_workspace_members SET avatar_url = v_url_on_001a2b65 WHERE user_id = v_selda;
  UPDATE nmm_workspace_members SET avatar_url = v_url_on_00fa3484 WHERE user_id = v_ezgi;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_url_on_001a2b65)
  WHERE id = v_selda;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_url_on_00fa3484)
  WHERE id = v_ezgi;

  UPDATE nmm_candidates SET avatar_url = v_url_on_001a2b65, updated_at = now()
  WHERE id = '00fa3484-97b1-4683-b987-638df261b6e2';

  UPDATE nmm_candidates SET avatar_url = v_url_on_00fa3484, updated_at = now()
  WHERE id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';

  RAISE NOTICE '088 Selda/Ezgi avatar swap tamam.';
END;
$$;
