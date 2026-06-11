-- 089: Selda/Ezgi — sabit doğru görüntüleme URL'leri (088 idempotent skip + kod çift swap sorununu giderir)
-- Selda yüzü → 001a2b65 dosyası, Ezgi yüzü → 00fa3484 dosyası (storage içeriği ters adlandırılmış)

DO $$
DECLARE
  v_selda_display text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg';
  v_ezgi_display  text := 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg';
  v_selda_user    uuid := 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
  v_ezgi_user     uuid := 'a71184ee-5b32-455a-88aa-c6aba538cdc0';
BEGIN
  UPDATE nmm_workspace_members SET avatar_url = v_selda_display WHERE user_id = v_selda_user;
  UPDATE nmm_workspace_members SET avatar_url = v_ezgi_display  WHERE user_id = v_ezgi_user;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_selda_display)
  WHERE id = v_selda_user;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', v_ezgi_display)
  WHERE id = v_ezgi_user;

  UPDATE nmm_candidates SET avatar_url = v_selda_display, updated_at = now()
  WHERE id = '00fa3484-97b1-4683-b987-638df261b6e2';

  UPDATE nmm_candidates SET avatar_url = v_ezgi_display, updated_at = now()
  WHERE id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';

  RAISE NOTICE '089 Selda/Ezgi canonical avatar URL''leri yazıldı.';
END;
$$;
