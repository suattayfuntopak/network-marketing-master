import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const AVATAR_BUCKET = 'nmm-avatars'

/** Public URL → storage object path (`avatars/...`). */
export function storagePathFromPublicUrl(publicUrl: string | null | undefined): string | null {
  if (!publicUrl?.trim()) return null
  try {
    const url = new URL(publicUrl.trim())
    const marker = `/${AVATAR_BUCKET}/`
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    const path = url.pathname.slice(idx + marker.length)
    return path.startsWith('avatars/') ? path : null
  } catch {
    return null
  }
}

export async function removeAvatarObjectByPublicUrl(
  supabase: SupabaseClient<Database>,
  publicUrl: string | null | undefined,
): Promise<void> {
  const path = storagePathFromPublicUrl(publicUrl)
  if (!path) return
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path])
  if (error) {
    console.warn('[avatarStorage] remove failed:', path, error.message)
  }
}
