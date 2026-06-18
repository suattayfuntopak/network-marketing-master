-- Migration 104: AI kota check-then-act yarışını kapat (Council O-1).
--
-- Sorun: checkAIQuota() ayrı bir SELECT count ile limiti kontrol eder; tüketim
-- (nmm_daily_actions INSERT) ayrı adımdadır. Eşzamanlı iki istek (çift-tık / iki
-- sekme) aynı `used < limit`'i geçip iki satır ekleyebilir → günlük sayım limiti aşar.
--
-- Çözüm: limit-farkında atomik insert. Per-kullanıcı transaction-advisory-lock ile
-- count+insert tek seri bölgede yapılır; sayım hiçbir zaman limiti aşmaz. Limit
-- doluysa hiç insert etmez, false döner (çağıran fail-open ile düz insert'e düşmez —
-- bilakis sayım korunur). Süper admin / limitsiz akış bu fonksiyonu hiç çağırmaz.
--
-- Idempotent: CREATE OR REPLACE; ikinci kez çalışınca güvenle aynı tanımı kurar.

CREATE OR REPLACE FUNCTION public.nmm_insert_ai_action_if_under_limit(
  p_user_id uuid,
  p_workspace_id uuid,
  p_candidate_id uuid,
  p_note text,
  p_note_tr text,
  p_ai_model text,
  p_day_start timestamptz,
  p_limit int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used int;
BEGIN
  IF p_user_id IS NULL OR p_limit IS NULL THEN
    RETURN false;
  END IF;

  -- Kimlik koruması: yalnız oturum sahibinin kendi kotasına yazılabilir.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  -- Per-kullanıcı seri kilit (transaction sonunda otomatik bırakılır):
  -- aynı kullanıcının eşzamanlı AI istekleri bu noktada sıraya girer → yarış kapanır.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || ':ai_generate'));

  SELECT count(*) INTO v_used
    FROM public.nmm_daily_actions
    WHERE user_id = p_user_id
      AND action_type = 'ai_generate'
      AND created_at >= p_day_start;

  IF v_used >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.nmm_daily_actions (
    workspace_id, user_id, candidate_id, action_type, note, note_tr, ai_model
  )
  VALUES (
    p_workspace_id, p_user_id, p_candidate_id, 'ai_generate', p_note, p_note_tr, p_ai_model
  );

  RETURN true;
END;
$$;
