-- Migration 082: Update parent_id in nmm_workspaces to refer to nmm_workspaces(id) instead of auth.users(id).
-- Also updates downline functions and RLS policies.

-- 1. Drop old constraint referencing auth.users(id)
ALTER TABLE public.nmm_workspaces DROP CONSTRAINT IF EXISTS nmm_workspaces_parent_id_fkey;

-- 2. Backfill parent_id: map current user UUIDs to their workspace UUIDs
UPDATE public.nmm_workspaces w
SET parent_id = p.id
FROM public.nmm_workspaces p
WHERE p.owner_id = w.parent_id;

-- 3. Add new constraint referencing public.nmm_workspaces(id)
ALTER TABLE public.nmm_workspaces
  ADD CONSTRAINT nmm_workspaces_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES public.nmm_workspaces(id)
  ON DELETE SET NULL;

-- 4. Redefine functions to support workspace-to-workspace parent_id links

-- A. nmm_leader_downline_workspace_ids
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT w.id
  FROM nmm_workspaces w
  WHERE w.parent_id IN (
    SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
  );
$$;

-- B. nmm_leader_downline_workspaces
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspaces()
RETURNS TABLE(id uuid, owner_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT w.id, w.owner_id
  FROM nmm_workspaces w
  WHERE w.parent_id IN (
    SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
  );
$$;

-- C. nmm_leader_downline_workspace_tree (recursive tree)
CREATE OR REPLACE FUNCTION public.nmm_leader_downline_workspace_tree()
RETURNS TABLE(id uuid, owner_id uuid, parent_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH RECURSIVE tree AS (
    SELECT w.id, w.owner_id, w.parent_id
    FROM nmm_workspaces w
    WHERE w.parent_id IN (
         SELECT l.id FROM nmm_workspaces l WHERE l.owner_id = auth.uid()
       )
    UNION ALL
    SELECT w.id, w.owner_id, w.parent_id
    FROM nmm_workspaces w
    INNER JOIN tree t ON w.parent_id = t.id
  )
  SELECT id, owner_id, parent_id FROM tree;
$$;

-- D. nmm_fetch_team_with_downlines
CREATE OR REPLACE FUNCTION public.nmm_fetch_team_with_downlines(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_downline_ws_ids uuid[];
  v_all_ws_ids uuid[];
  v_today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC');
  v_members jsonb;
  v_candidates jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT w.owner_id INTO v_owner_id
  FROM nmm_workspaces w
  WHERE w.id = p_workspace_id;

  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('members', '[]'::jsonb, 'leader_candidates', '[]'::jsonb);
  END IF;

  SELECT coalesce(array_agg(w.id), ARRAY[]::uuid[])
  INTO v_downline_ws_ids
  FROM nmm_workspaces w
  WHERE w.parent_id = p_workspace_id;

  v_all_ws_ids := array_cat(ARRAY[p_workspace_id], v_downline_ws_ids);

  WITH member_union AS (
    SELECT m.user_id, m.full_name, m.role, m.joined_at, m.avatar_url, 1 AS prio
    FROM nmm_workspace_members m
    WHERE m.workspace_id = p_workspace_id
    UNION ALL
    SELECT m.user_id, m.full_name, m.role, m.joined_at, m.avatar_url, 2 AS prio
    FROM nmm_workspaces dw
    JOIN nmm_workspace_members m ON m.user_id = dw.owner_id
    WHERE dw.id = ANY (v_downline_ws_ids)
  ),
  deduped AS (
    SELECT DISTINCT ON (user_id)
      user_id, full_name, role, joined_at, avatar_url
    FROM member_union
    ORDER BY user_id, prio ASC, avatar_url NULLS LAST
  ),
  with_leader AS (
    SELECT user_id, full_name, role, joined_at, avatar_url FROM deduped
    UNION ALL
    SELECT
      v_owner_id,
      coalesce((SELECT full_name FROM deduped WHERE user_id = v_owner_id), 'Lider'),
      'leader',
      coalesce((SELECT joined_at FROM deduped WHERE user_id = v_owner_id), now()),
      (SELECT avatar_url FROM deduped WHERE user_id = v_owner_id)
    WHERE NOT EXISTS (SELECT 1 FROM deduped WHERE user_id = v_owner_id)
  ),
  avatar_best AS (
    SELECT user_id, max(avatar_url) FILTER (WHERE avatar_url IS NOT NULL) AS avatar_url
    FROM nmm_workspace_members
    WHERE user_id IN (SELECT user_id FROM with_leader)
    GROUP BY user_id
  ),
  cand_stats AS (
    SELECT
      c.owner_id AS user_id,
      count(*)::int AS candidate_count,
      count(*) FILTER (WHERE c.stage = 'yeni')::int AS yeni_count,
      count(*) FILTER (WHERE c.stage = 'iletisim')::int AS iletisim_count,
      count(*) FILTER (WHERE c.stage = 'davetli')::int AS davetli_count,
      count(*) FILTER (WHERE c.stage = 'sunum')::int AS sunum_count,
      count(*) FILTER (WHERE c.stage = 'takip')::int AS takip_count,
      count(*) FILTER (WHERE c.stage = 'katildi')::int AS katildi_count
    FROM nmm_candidates c
    WHERE c.workspace_id = ANY (v_all_ws_ids)
    GROUP BY c.owner_id
  ),
  last_actions AS (
    SELECT a.user_id, max(a.created_at) AS last_at
    FROM nmm_daily_actions a
    WHERE a.workspace_id = ANY (v_all_ws_ids)
      AND a.created_at >= (now() - interval '30 days')
    GROUP BY a.user_id
  ),
  onboarding_agg AS (
    SELECT o.user_id, jsonb_agg(o.step_id ORDER BY o.step_id) AS steps
    FROM nmm_onboarding_progress o
    WHERE o.user_id IN (SELECT user_id FROM with_leader)
    GROUP BY o.user_id
  ),
  today_ai AS (
    SELECT
      a.user_id,
      count(*) FILTER (WHERE a.note = 'roleplay')::int AS today_roleplay,
      count(*) FILTER (WHERE a.note = 'compliance')::int AS today_compliance,
      count(*) FILTER (WHERE a.note IS DISTINCT FROM 'roleplay' AND a.note IS DISTINCT FROM 'compliance')::int AS today_message
    FROM nmm_daily_actions a
    WHERE a.user_id IN (SELECT user_id FROM with_leader)
      AND a.action_type = 'ai_generate'
      AND a.created_at >= v_today_start
    GROUP BY a.user_id
  )
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', wl.user_id,
      'full_name', wl.full_name,
      'role', CASE WHEN wl.user_id = v_owner_id THEN 'leader' ELSE coalesce(wl.role, 'member') END,
      'joined_at', wl.joined_at,
      'avatar_url', coalesce(ab.avatar_url, wl.avatar_url),
      'candidate_count', coalesce(cs.candidate_count, 0),
      'yeni_count', coalesce(cs.yeni_count, 0),
      'iletisim_count', coalesce(cs.iletisim_count, 0),
      'davetli_count', coalesce(cs.davetli_count, 0),
      'sunum_count', coalesce(cs.sunum_count, 0),
      'takip_count', coalesce(cs.takip_count, 0),
      'katildi_count', coalesce(cs.katildi_count, 0),
      'last_activity_at', coalesce(la.last_at, wl.joined_at),
      'onboarding_steps', coalesce(oa.steps, '[]'::jsonb),
      'today_roleplay', coalesce(ta.today_roleplay, 0),
      'today_compliance', coalesce(ta.today_compliance, 0),
      'today_message', coalesce(ta.today_message, 0)
    )
    ORDER BY
      CASE WHEN wl.user_id = v_owner_id THEN 0 ELSE 1 END,
      coalesce(cs.candidate_count, 0) DESC
  ), '[]'::jsonb)
  INTO v_members
  FROM with_leader wl
  LEFT JOIN avatar_best ab ON ab.user_id = wl.user_id
  LEFT JOIN cand_stats cs ON cs.user_id = wl.user_id
  LEFT JOIN last_actions la ON la.user_id = wl.user_id
  LEFT JOIN onboarding_agg oa ON oa.user_id = wl.user_id
  LEFT JOIN today_ai ta ON ta.user_id = wl.user_id;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'owner_id', c.owner_id,
      'full_name', c.full_name,
      'phone', c.phone,
      'note', c.note,
      'stage', c.stage,
      'created_at', c.created_at
    )
    ORDER BY c.created_at DESC
  ), '[]'::jsonb)
  INTO v_candidates
  FROM nmm_candidates c
  WHERE c.workspace_id = ANY (v_all_ws_ids)
    AND c.owner_id = v_owner_id;

  RETURN jsonb_build_object(
    'members', v_members,
    'leader_candidates', v_candidates
  );
END;
$$;

-- E. nmm_onboarding_progress_trigger_func
CREATE OR REPLACE FUNCTION nmm_onboarding_progress_trigger_func()
RETURNS trigger AS $$
DECLARE
    v_member_name   text;
    v_leader_id     uuid;
    v_step_label_tr text;
    v_step_label_en text;
BEGIN
    SELECT COALESCE(full_name, 'Bir Ekip Üyeniz') INTO v_member_name
    FROM public.nmm_workspace_members
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    LIMIT 1;

    SELECT owner_id INTO v_leader_id
    FROM public.nmm_workspaces
    WHERE id = (
        SELECT parent_id
        FROM public.nmm_workspaces
        WHERE owner_id = COALESCE(NEW.user_id, OLD.user_id)
        LIMIT 1
    );

    v_step_label_tr := nmm_get_onboarding_step_label_tr(COALESCE(NEW.step_id, OLD.step_id));
    v_step_label_en := nmm_get_onboarding_step_label_en(COALESCE(NEW.step_id, OLD.step_id));

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
        VALUES (
            NEW.user_id,
            'Harika! Adım tamamlandı 🚀',
            'Great! Step completed 🚀',
            '"' || v_step_label_tr || '" adımını başarıyla tamamladınız.',
            'You have successfully completed the step: "' || v_step_label_en || '".',
            'bell'
        );

        IF v_leader_id IS NOT NULL AND v_leader_id <> NEW.user_id THEN
            INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
            VALUES (
                v_leader_id,
                'Ekip ortağınız bir adımı tamamladı! 🎉',
                'Your partner completed a step! 🎉',
                v_member_name || ' yeni bir adım tamamladı: "' || v_step_label_tr || '".',
                v_member_name || ' completed a new step: "' || v_step_label_en || '".',
                'user'
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
        VALUES (
            OLD.user_id,
            'Adım güncellendi 🔄',
            'Step updated 🔄',
            '"' || v_step_label_tr || '" adımı tamamlanmadı olarak işaretlendi.',
            'The step "' || v_step_label_en || '" was marked as incomplete.',
            'bell'
        );

        IF v_leader_id IS NOT NULL AND v_leader_id <> OLD.user_id THEN
            INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
            VALUES (
                v_leader_id,
                'Ekip ortağınız adımı güncelledi 🔄',
                'Your partner updated a step 🔄',
                v_member_name || ' bir adımı tamamlanmadı olarak işaretledi: "' || v_step_label_tr || '".',
                v_member_name || ' marked a step as incomplete: "' || v_step_label_en || '".',
                'user'
            );
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- F. nmm_candidate_change_trigger_fn
CREATE OR REPLACE FUNCTION nmm_candidate_change_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id       uuid;
  v_user_fullname   text;
BEGIN
  SELECT owner_id INTO v_parent_id
  FROM nmm_workspaces
  WHERE id = (
    SELECT parent_id
    FROM nmm_workspaces
    WHERE id = NEW.workspace_id
  );

  IF v_parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_user_fullname
  FROM nmm_workspace_members
  WHERE user_id = NEW.owner_id AND workspace_id = NEW.workspace_id
  LIMIT 1;

  IF v_user_fullname IS NULL THEN
    v_user_fullname := 'Ekip Arkadaşınız';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
    VALUES (
      v_parent_id,
      'Ekip üyeniz yeni aday ekledi!',
      'Team member added a new prospect!',
      v_user_fullname || ', listesine "' || NEW.full_name || '" isimli yeni bir aday ekledi.',
      v_user_fullname || ' added a new prospect named "' || NEW.full_name || '" to their list.',
      'user'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stage <> NEW.stage THEN
      INSERT INTO nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
      VALUES (
        v_parent_id,
        'Ekip üyeniz aşama güncelledi!',
        'Team member updated a stage!',
        v_user_fullname || ', "' || NEW.full_name || '" isimli adayı "' || nmm_get_stage_name_tr(NEW.stage) || '" aşamasına taşıdı.',
        v_user_fullname || ' moved "' || NEW.full_name || '" to "' || nmm_get_stage_name_en(NEW.stage) || '" stage.',
        'alert'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- G. Redefine nmm_onboarding_leader_all RLS policy on nmm_onboarding_progress
DROP POLICY IF EXISTS "nmm_onboarding_leader_all" ON public.nmm_onboarding_progress;
CREATE POLICY "nmm_onboarding_leader_all" ON public.nmm_onboarding_progress
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT owner_id 
            FROM public.nmm_workspaces 
            WHERE id = (
                SELECT parent_id 
                FROM public.nmm_workspaces 
                WHERE owner_id = user_id
            )
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT owner_id 
            FROM public.nmm_workspaces 
            WHERE id = (
                SELECT parent_id 
                FROM public.nmm_workspaces 
                WHERE owner_id = user_id
            )
        )
    );
