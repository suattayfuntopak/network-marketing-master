'use server'

import { createClient } from '@/lib/supabase/server'

/** Oturumu sunucuda kapatır; yönlendirme istemci tarafında yapılır (ConfirmDialog + redirect uyumu). */
export async function logoutAction(): Promise<{ ok: true }> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { ok: true }
}
