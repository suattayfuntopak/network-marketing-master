'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'

/**
 * Kullanıcının seçtiği arayüz dilini user_metadata'ya kalıcılaştırır.
 * NEDEN: dil yalnız localStorage'da (`nmm_lang`) tutuluyordu → cron/e-posta gibi
 * sunucu işleri kullanıcının dilini bilemiyordu (trial e-postaları hep 'tr' gidiyordu).
 * Artık tek sunucu-tarafı doğruluk kaynağı user_metadata.lang. Oturum yoksa no-op
 * (giriş/açılış sayfalarında da çağrılabilir).
 */
export async function persistUserLangAction(lang: 'tr' | 'en'): Promise<void> {
  if (lang !== 'tr' && lang !== 'en') return
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return
  if (user.user_metadata?.lang === lang) return
  await supabase.auth.updateUser({ data: { lang } })
}
