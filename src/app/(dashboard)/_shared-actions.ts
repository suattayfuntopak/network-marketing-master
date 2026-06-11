'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Oturumu sunucuda kapatır; yönlendirme istemci tarafında yapılır
 * (ConfirmDialog + redirect uyumu). scope: 'global' → tüm cihazlardaki
 * refresh token'lar iptal edilir (eski istemci-taraflı signOut davranışı).
 */
export async function logoutAction(): Promise<{ ok: true }> {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
  return { ok: true }
}
