import type { AdminClient } from '@/lib/supabase/admin'
import { ACTIVE_STAGES } from '@/lib/domain/stages'

/** Trial e-postalarını kişiselleştirmek için workspace'in canlı boru hattı verisi. */
export interface TrialUserStats {
  candidateCount: number
  activeCount: number
  upcomingFollowUps: number
}

/** Bir workspace'in aday/aktif/planlı-takip sayıları (kişiselleştirme için). */
export async function fetchTrialUserStats(
  supabase: AdminClient,
  workspaceId: string
): Promise<TrialUserStats> {
  const nowIso = new Date().toISOString()
  const [totalRes, activeRes, followRes] = await Promise.all([
    supabase.from('nmm_candidates').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('nmm_candidates').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).in('stage', ACTIVE_STAGES),
    supabase.from('nmm_candidates').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).gte('next_follow_up_at', nowIso),
  ])
  return {
    candidateCount: totalRes.count ?? 0,
    activeCount: activeRes.count ?? 0,
    upcomingFollowUps: followRes.count ?? 0,
  }
}

export interface TrialEmailRecipient {
  email: string
  name: string
  workspaceId: string
  /** Kullanıcının kalıcı arayüz dili (user_metadata.lang) — yoksa 'tr'. */
  lang: 'tr' | 'en'
}

/** license_expires_at tam günü = bugün + offsetDays olan free workspace liderleri. */
export async function fetchFreeTrialRecipients(
  supabase: AdminClient,
  offsetDays: number
): Promise<TrialEmailRecipient[]> {
  const target = new Date()
  target.setDate(target.getDate() + offsetDays)
  target.setHours(0, 0, 0, 0)

  const targetEnd = new Date(target)
  targetEnd.setHours(23, 59, 59, 999)

  const { data: workspaces, error } = await supabase
    .from('nmm_workspaces')
    .select('id, license_expires_at')
    .eq('license_type', 'free')
    .gte('license_expires_at', target.toISOString())
    .lte('license_expires_at', targetEnd.toISOString())

  if (error) {
    console.error('[cronTrialRecipients] workspace query failed:', error)
    return []
  }

  const out: TrialEmailRecipient[] = []

  for (const ws of workspaces ?? []) {
    const { data: member } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name')
      .eq('workspace_id', ws.id)
      .eq('role', 'leader')
      .maybeSingle()

    if (!member) continue

    const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id)
    const user = authUser?.user
    const email = user?.email
    if (!email) continue

    const metaLang = user.user_metadata?.lang
    out.push({
      workspaceId: ws.id,
      email,
      name:
        member.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        'Değerli Ortak',
      lang: metaLang === 'en' ? 'en' : 'tr',
    })
  }

  return out
}
