-- 056_team_rpc_downline_via_definer.sql
-- REGRESYON DÜZELTME (055 sonrası): nmm_fetch_team_with_downlines SECURITY INVOKER'dır ve
-- downline'ı İKİ yerde doğrudan nmm_workspaces'ten (caller RLS'i altında) okuyordu:
--   (a) v_downline_ws_ids = SELECT ... WHERE parent_id = ...
--   (b) member_union downline kolu: FROM nmm_workspaces dw JOIN ... WHERE dw.id = ANY(...)
-- 055, workspace SELECT politikasını own+member'a daraltınca bu INVOKER okumalar downline'ı
-- ARTIK GÖREMEDİ → Ekibim/İstatistikler'de downline üyeler (Elif) düştü. (Takvim etkilenmedi
-- çünkü o, 055'te eklenen DEFINER rpc'yi kullanıyor.)
--
-- ÇÖZÜM: downline KEŞFİNİ, RLS'e bağlı olmayan DEFINER fonksiyonlara taşı:
--   • nmm_leader_downline_workspace_ids()  → downline ws id'leri (052'de DEFINER)
--   • nmm_leader_downline_workspaces()      → downline (id, owner_id) (055'te eklendi, DEFINER)
-- Fonksiyon INVOKER kalır; ÜYE/ADAY/AKSİYON okumaları hâlâ RLS-korumalı (members/candidates
-- politikaları nmm_leader_downline_workspace_ids() ile downline'a zaten izin verir → Elif görünür).
-- Davet kodu/lisans aşırı-erişimi (055'in amacı) KAPALI kalır; bu rpc o kolonları okumaz.

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

  -- (a) Downline ws id'leri DEFINER fonksiyondan (RLS'e bağlı değil; 055 daralmasından etkilenmez).
  SELECT coalesce(array_agg(ws_id), ARRAY[]::uuid[])
  INTO v_downline_ws_ids
  FROM public.nmm_leader_downline_workspace_ids() AS ws_id;

  v_all_ws_ids := array_cat(ARRAY[p_workspace_id], v_downline_ws_ids);

  WITH member_union AS (
    SELECT m.user_id, m.full_name, m.role, m.joined_at, m.avatar_url, 1 AS prio
    FROM nmm_workspace_members m
    WHERE m.workspace_id = p_workspace_id
    UNION ALL
    -- (b) Downline owner'ları DEFINER fonksiyondan (id, owner_id); nmm_workspace_members
    --     okuması hâlâ RLS-korumalı ama members politikası downline'a izin verir → Elif gelir.
    SELECT m.user_id, m.full_name, m.role, m.joined_at, m.avatar_url, 2 AS prio
    FROM public.nmm_leader_downline_workspaces() dw
    JOIN nmm_workspace_members m ON m.user_id = dw.owner_id
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
      'role', CASE WHEN wl.user_id = v_owner_id THEN 'leader' ELSE 'member' END,
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
      'note_tr', c.note_tr,
      'note_en', c.note_en,
      'avatar_url', c.avatar_url,
      'warmth', c.warmth,
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

GRANT EXECUTE ON FUNCTION public.nmm_fetch_team_with_downlines(uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- UYGULAMA SONRASI TEST:
--   • İstatistikler/Ekibim → Elif (downline) yeniden görünür.
--   • Davet kodu/lisans aşırı-erişimi (055) KAPALI kalır (bu rpc o kolonları okumaz).
-- ROLLBACK: 025'teki gövdeye dön (downline'ı tekrar nmm_workspaces parent_id ile oku) —
--   ama o, 055 daralmasıyla tekrar Elif'i düşürür; gerçek geri alış 055 rollback'idir.
-- ─────────────────────────────────────────────────────────────────────────────
