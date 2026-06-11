-- Manuel doğrulama / acil düzeltme: Selda/Ezgi own-file URL'leri (090 ile aynı)
-- Selda → 00fa3484 dosyası, Ezgi → 001a2b65 dosyası

UPDATE nmm_workspace_members
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'
WHERE user_id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';

UPDATE nmm_workspace_members
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg'
WHERE user_id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0';

UPDATE nmm_candidates
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg',
    updated_at = now()
WHERE id = '00fa3484-97b1-4683-b987-638df261b6e2';

UPDATE nmm_candidates
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg',
    updated_at = now()
WHERE id = '001a2b65-8820-4b2c-9c4a-67d1344b17c2';

SELECT id, full_name, avatar_url
FROM nmm_candidates
WHERE id IN (
  '00fa3484-97b1-4683-b987-638df261b6e2',
  '001a2b65-8820-4b2c-9c4a-67d1344b17c2'
);
