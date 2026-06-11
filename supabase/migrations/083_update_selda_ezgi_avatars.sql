-- Migration 083: Update avatar urls for Selda Kiratli and Ezgi Sagar in auth.users and nmm_workspace_members

UPDATE public.nmm_workspace_members
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg'
WHERE user_id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0';

UPDATE public.nmm_workspace_members
SET avatar_url = 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'
WHERE user_id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg')
WHERE id = 'a71184ee-5b32-455a-88aa-c6aba538cdc0';

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('avatar_url', 'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg')
WHERE id = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884';
