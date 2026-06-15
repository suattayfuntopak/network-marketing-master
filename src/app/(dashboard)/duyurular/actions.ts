'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/authUser'
import { annotateAnnouncements, type AnnotatedAnnouncement } from '@/lib/domain/teamAnnouncements'

async function ownWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.workspace_id ?? null
}

/**
 * Kendi + üst hat (lider) duyuruları. Cross-workspace okuma admin client ile
 * (üst hat çözümlemesi); yalnız oturum sahibinin kendi ve doğrudan üst hattının
 * duyuruları döner — recursive RLS yok.
 */
export async function getTeamAnnouncementsAction(): Promise<AnnotatedAnnouncement[]> {
  const { user } = await getAuthUser()
  if (!user) return []

  const admin = createAdminClient()

  const { data: myWs } = await admin
    .from('nmm_workspaces')
    .select('id, parent_id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!myWs) return []

  let uplineWorkspaceId: string | null = null
  let uplineOwnerName: string | null = null

  if (myWs.parent_id) {
    // parent_id workspace-id veya user-id olabilir (iki format desteklenir).
    const { data: up } = await admin
      .from('nmm_workspaces')
      .select('id, owner_id')
      .or(`id.eq.${myWs.parent_id},owner_id.eq.${myWs.parent_id}`)
      .maybeSingle()
    if (up) {
      uplineWorkspaceId = up.id
      if (up.owner_id) {
        const { data: u } = await admin.auth.admin.getUserById(up.owner_id)
        const meta = (u?.user?.user_metadata ?? {}) as Record<string, unknown>
        uplineOwnerName = typeof meta.full_name === 'string' ? meta.full_name.trim() : null
      }
    }
  }

  const orFilter = uplineWorkspaceId
    ? `author_id.eq.${user.id},workspace_id.eq.${uplineWorkspaceId}`
    : `author_id.eq.${user.id}`

  const { data: rows } = await admin
    .from('nmm_team_announcements')
    .select('id, author_id, title, body, created_at')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(100)

  const records = (rows ?? []).map(r => ({
    id: r.id,
    author_id: r.author_id,
    author_name: r.author_id === user.id ? null : uplineOwnerName,
    title: r.title,
    body: r.body,
    created_at: r.created_at,
  }))

  return annotateAnnouncements(records, user.id)
}

export async function addTeamAnnouncementAction(input: {
  title: string
  body: string
}): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const title = input.title.trim()
  const body = input.body.trim()
  if (!title) throw new Error('Başlık zorunlu.')
  if (!body) throw new Error('Mesaj zorunlu.')

  const workspaceId = await ownWorkspaceId(supabase, user.id)
  if (!workspaceId) throw new Error('Çalışma alanı bulunamadı.')

  const { error } = await supabase.from('nmm_team_announcements').insert({
    workspace_id: workspaceId,
    author_id: user.id,
    title: title.slice(0, 120),
    body: body.slice(0, 1000),
  })
  if (error) throw new Error(error.message)
}

export async function deleteTeamAnnouncementAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')
  if (!id) return

  const { error } = await supabase
    .from('nmm_team_announcements')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id)
  if (error) throw new Error(error.message)
}
