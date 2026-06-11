-- verify_rls_policies.sql
-- Standalone SQL script to verify that public.nmm_candidates RLS prevents data leaks between workspaces.

BEGIN;

DO $$
DECLARE
  v_user_a uuid := 'aaaaaaa-1111-2222-3333-444444444444';
  v_user_b uuid := 'bbbbbbb-1111-2222-3333-444444444444';
  v_ws_a uuid := 'a1a1a1a1-1111-2222-3333-444444444444';
  v_ws_b uuid := 'b2b2b2b2-1111-2222-3333-444444444444';
  v_cand_a uuid := 'ca1ca1ca-1111-2222-3333-444444444444';
  v_cand_b uuid := 'cb2cb2cb-1111-2222-3333-444444444444';
  v_count int;
BEGIN
  -- Insert dummy test auth users (if they don't exist)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
  VALUES 
    (v_user_a, 'user_a@test.com', 'dummy_hash', now(), now(), '{}', '{}', now(), now(), 'authenticated'),
    (v_user_b, 'user_b@test.com', 'dummy_hash', now(), now(), '{}', '{}', now(), now(), 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Insert workspaces
  INSERT INTO public.nmm_workspaces (id, name, owner_id)
  VALUES 
    (v_ws_a, 'Workspace A', v_user_a),
    (v_ws_b, 'Workspace B', v_user_b)
  ON CONFLICT (id) DO NOTHING;

  -- Insert memberships
  INSERT INTO public.nmm_workspace_members (workspace_id, user_id, role, full_name)
  VALUES 
    (v_ws_a, v_user_a, 'leader', 'User A'),
    (v_ws_b, v_user_b, 'leader', 'User B')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Insert candidates
  INSERT INTO public.nmm_candidates (id, workspace_id, owner_id, full_name, stage)
  VALUES 
    (v_cand_a, v_ws_a, v_user_a, 'Candidate A under WS A', 'yeni'),
    (v_cand_b, v_ws_b, v_user_b, 'Candidate B under WS B', 'yeni')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Simulate User A
  -- Set auth uid claim locally in the transaction context
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  
  -- Query candidates as User A
  SELECT count(*) INTO v_count FROM public.nmm_candidates;
  
  -- Assert that User A CANNOT see Candidate B
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'RLS FAIL: User A should see exactly 1 candidate, but sees %', v_count;
  END IF;
  
  -- Check specifically that Candidate B is not visible to User A
  IF EXISTS (SELECT 1 FROM public.nmm_candidates WHERE id = v_cand_b) THEN
    RAISE EXCEPTION 'RLS FAIL: User A can see Candidate B belonging to Workspace B!';
  END IF;

  -- 3. Simulate User B
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  
  -- Query candidates as User B
  SELECT count(*) INTO v_count FROM public.nmm_candidates;
  
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'RLS FAIL: User B should see exactly 1 candidate, but sees %', v_count;
  END IF;
  
  -- Check specifically that Candidate A is not visible to User B
  IF EXISTS (SELECT 1 FROM public.nmm_candidates WHERE id = v_cand_a) THEN
    RAISE EXCEPTION 'RLS FAIL: User B can see Candidate A belonging to Workspace A!';
  END IF;

  -- Cleanup test data
  -- Reset claims to avoid permission issues during delete
  PERFORM set_config('request.jwt.claim.sub', '', true);
  
  DELETE FROM public.nmm_candidates WHERE id IN (v_cand_a, v_cand_b);
  DELETE FROM public.nmm_workspace_members WHERE workspace_id IN (v_ws_a, v_ws_b);
  DELETE FROM public.nmm_workspaces WHERE id IN (v_ws_a, v_ws_b);
  DELETE FROM auth.users WHERE id IN (v_user_a, v_user_b);

  RAISE NOTICE 'RLS POLICY VERIFICATION SUCCESS: Workspace isolation is perfectly secure.';
END $$;

COMMIT;
