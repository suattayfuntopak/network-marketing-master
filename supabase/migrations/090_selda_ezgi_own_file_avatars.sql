-- 090: Selda/Ezgi — kendi aday dosyası URL'leri (089 çapraz atama geri alınır)
-- Selda → 00fa3484 dosyası, Ezgi → 001a2b65 dosyası

DO $$
DECLARE
  v_selda_url text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg';
  v_ezgi_url  text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg';
  v_selda_user uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_ezgi_user  uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
BEGIN
  UPDATE nmm_workspace_members SET avatar_url = v_selda_url WHERE user_id = v_selda_user;
  UPDATE nmm_workspace_members SET avatar_url = v_ezgi_url  WHERE user_id = v_ezgi_user;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_selda_url)
  WHERE id = v_selda_user;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_ezgi_url)
  WHERE id = v_ezgi_user;

  UPDATE nmm_candidates SET avatar_url = v_selda_url, updated_at = now()
  WHERE id = '00fa3484-97b1-4683-b987-638df261b6e2';

  UPDATE nmm_candidates SET avatar_url = v_ezgi_url, updated_at = now()
  WHERE id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';

  RAISE NOTICE '090 Selda/Ezgi own-file avatar URL''leri yazıldı.';
END;
$$;
