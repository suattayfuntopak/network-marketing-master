import { getAuthUser } from '@/lib/supabase/authUser'

/** Oturum yoksa throw — dashboard server action'ları için tek kaynak. */
export async function requireAuthUserId(): Promise<string> {
  const { user, error } = await getAuthUser()
  if (error || !user) throw new Error('Oturum bulunamadı.')
  return user.id
}

/** Oturum yoksa null — okuma action'ları için (boş liste dönmek üzere). */
export async function requireAuthUserIdOrNull(): Promise<string | null> {
  const { user, error } = await getAuthUser()
  if (error || !user) return null
  return user.id
}
