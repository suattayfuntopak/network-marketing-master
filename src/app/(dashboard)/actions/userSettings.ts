'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  DEFAULT_USER_SETTINGS,
  mergeUserSettings,
  type UserSettings,
} from '@/lib/domain/userSettings'
import type { Json } from '@/types/database.types'

/** Kullanıcının kalıcı ayarları (onboarding, uyum checklist). Satır yoksa default. */
export async function fetchUserSettingsAction(): Promise<UserSettings> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return DEFAULT_USER_SETTINGS

  const { data } = await supabase
    .from('nmm_user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .maybeSingle()

  return mergeUserSettings(data?.settings)
}

/**
 * Ayarların bir kısmını günceller (read-modify-write; tek satır, küçük jsonb).
 * Verilmeyen alanlar korunur. Güncel tam ayarı döner.
 */
export async function patchUserSettingsAction(
  patch: Partial<UserSettings>,
): Promise<UserSettings> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data } = await supabase
    .from('nmm_user_settings')
    .select('settings')
    .eq('user_id', user.id)
    .maybeSingle()

  const current = mergeUserSettings(data?.settings)
  const next: UserSettings = {
    onboardingDone: patch.onboardingDone ?? current.onboardingDone,
    complianceChecklist: patch.complianceChecklist ?? current.complianceChecklist,
  }

  const { error } = await supabase.from('nmm_user_settings').upsert(
    {
      user_id: user.id,
      settings: next as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw new Error(error.message)

  return next
}
