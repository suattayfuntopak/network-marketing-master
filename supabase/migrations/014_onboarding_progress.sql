-- Migration 014: Onboarding checklist database persistence with real-time in-app notification dispatch.

-- 1. Create onboarding progress table
CREATE TABLE IF NOT EXISTS public.nmm_onboarding_progress (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    step_id    text not null,
    created_at timestamptz not null default now(),
    UNIQUE (user_id, step_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.nmm_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy to allow users to manage their own onboarding progress
CREATE POLICY "nmm_onboarding_user_all" ON public.nmm_onboarding_progress
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. RLS policy to allow leaders/sponsors to manage their direct downlines' onboarding progress
CREATE POLICY "nmm_onboarding_leader_all" ON public.nmm_onboarding_progress
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT parent_id 
            FROM public.nmm_workspaces 
            WHERE owner_id = user_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT parent_id 
            FROM public.nmm_workspaces 
            WHERE owner_id = user_id
        )
    );

-- 5. Helper function to translate step IDs into Turkish labels
CREATE OR REPLACE FUNCTION nmm_get_onboarding_step_label_tr(p_step_id text)
RETURNS text AS $$
BEGIN
    RETURN CASE p_step_id
        WHEN 'step_why'         THEN 'Başlangıç Görüşmesi & "Neden?" Belirleme'
        WHEN 'step_list'        THEN '20-50 Kişilik Liste Oluşturma'
        WHEN 'step_first_5'     THEN 'İlk 5 Adayı Belirleme'
        WHEN 'step_3way'        THEN 'Sponsorla İlk 3''lü Görüşme (3-Way Call)'
        WHEN 'step_social'      THEN 'Sosyal Medyada İlk Ürün Paylaşımı'
        WHEN 'step_independent' THEN 'Sponsorsuz İlk Bağımsız Sunum'
        WHEN 'step_objections'  THEN 'İtirazlara Cevaplar Modülü Eğitimi'
        WHEN 'step_90day'       THEN '90 Günlük Saha Aksiyon Planı Yazımı'
        WHEN 'step_complete'    THEN '30. Gün Kapanış & Değerlendirme'
        ELSE p_step_id
    END;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function to translate step IDs into English labels
CREATE OR REPLACE FUNCTION nmm_get_onboarding_step_label_en(p_step_id text)
RETURNS text AS $$
BEGIN
    RETURN CASE p_step_id
        WHEN 'step_why'         THEN 'Kickoff Meeting & Define "Why"'
        WHEN 'step_list'        THEN 'Create a list of 20-50 Names'
        WHEN 'step_first_5'     THEN 'Identify first 5 and send messages'
        WHEN 'step_3way'        THEN 'First 3-Way Call with Sponsor'
        WHEN 'step_social'      THEN 'First Product Post on Social Media'
        WHEN 'step_independent' THEN 'First Independent Presentation'
        WHEN 'step_objections'  THEN 'Study Objection Handling Module'
        WHEN 'step_90day'       THEN 'Write 90-Day Field Action Plan'
        WHEN 'step_complete'    THEN 'Day 30 Review & Reflection'
        ELSE p_step_id
    END;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger function to dispatch real-time notifications to both member and leader on progress toggle
CREATE OR REPLACE FUNCTION nmm_onboarding_progress_trigger_func()
RETURNS trigger AS $$
DECLARE
    v_member_name   text;
    v_leader_id     uuid;
    v_step_label_tr text;
    v_step_label_en text;
BEGIN
    -- Get member full_name
    SELECT COALESCE(full_name, 'Bir Ekip Üyeniz') INTO v_member_name
    FROM public.nmm_workspace_members
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    LIMIT 1;

    -- Get sponsor leader ID
    SELECT parent_id INTO v_leader_id
    FROM public.nmm_workspaces
    WHERE owner_id = COALESCE(NEW.user_id, OLD.user_id)
    LIMIT 1;

    -- Get onboarding step translated labels
    v_step_label_tr := nmm_get_onboarding_step_label_tr(COALESCE(NEW.step_id, OLD.step_id));
    v_step_label_en := nmm_get_onboarding_step_label_en(COALESCE(NEW.step_id, OLD.step_id));

    IF TG_OP = 'INSERT' THEN
        -- A. Send notification to the member confirming completion
        INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
        VALUES (
            NEW.user_id,
            'Harika! Adım tamamlandı 🚀',
            'Great! Step completed 🚀',
            '"' || v_step_label_tr || '" adımını başarıyla tamamladınız.',
            'You have successfully completed the step: "' || v_step_label_en || '".',
            'bell'
        );

        -- B. Send notification to the sponsor leader/sponsor if parent_id exists
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
        -- A. Send notification to the member confirming rollback
        INSERT INTO public.nmm_notifications (user_id, title_tr, title_en, description_tr, description_en, type)
        VALUES (
            OLD.user_id,
            'Adım güncellendi 🔄',
            'Step updated 🔄',
            '"' || v_step_label_tr || '" adımı tamamlanmadı olarak işaretlendi.',
            'The step "' || v_step_label_en || '" was marked as incomplete.',
            'bell'
        );

        -- B. Send notification to the sponsor leader/sponsor if parent_id exists
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

-- 8. Bind trigger to nmm_onboarding_progress table
CREATE OR REPLACE TRIGGER nmm_onboarding_progress_trigger
AFTER INSERT OR DELETE ON public.nmm_onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION nmm_onboarding_progress_trigger_func();
