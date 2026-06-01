import type { User } from '@supabase/supabase-js'
import type { AdminClient } from '@/lib/supabase/admin'

/** Tüm auth kullanıcılarını sayfalayarak döner (super-admin listeleri). */
export async function listAllAuthUsers(admin: AdminClient): Promise<User[]> {
  const users: User[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data.users ?? []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  return users
}
