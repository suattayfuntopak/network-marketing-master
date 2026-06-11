'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { isSuperAdmin } from '@/lib/domain/auth'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { fetchSahaRadarMemberRows } from '@/lib/team/fetchTeamBundle'
import { generateMessage } from '@/lib/ai/generateMessage'

// ─── Saha Radar Types & Action ────────────────────────────────────────────────

export type SahaRadarActivityLevel = 'active' | 'recent' | 'silent'

export type SahaRadarMember = {
  userId: string
  pipelineId: string | null
  fullName: string
  avatarUrl: string | null
  activityLevel: SahaRadarActivityLevel
  daysSinceActivity: number | null
  candidateCount: number
  phone: string | null
  lastCoachedAt: string | null
}

export type SahaRadarFollowUp = {
  id: string
  candidateName: string
  ownerUserId: string
  ownerName: string
  dueAt: string
  isOverdue: boolean
  isMine: boolean
  phone: string | null
  stage: string
}

export type CrownSahaRadarPayload = {
  members: SahaRadarMember[]
  followUps: SahaRadarFollowUp[]
  myUserId: string
  hasTeamAccess: boolean
}

export async function getCrownSahaRadarAction(workspaceId: string): Promise<CrownSahaRadarPayload> {
  const { user } = await getAuthUser()
  if (!user) return { members: [], followUps: [], myUserId: '', hasTeamAccess: false }

  const supabase = await createClient()
  const { data: wsData } = await supabase
    .from('nmm_workspaces')
    .select('license_type')
    .eq('id', workspaceId)
    .single()

  const teamAccess = hasTeamPageAccess(wsData?.license_type, isSuperAdmin(user))

  const ekipRows = teamAccess
    ? await fetchSahaRadarMemberRows(supabase, workspaceId)
    : []
  const now = Date.now()
  const nowIso = new Date(now).toISOString()

  const teamMemberUserIds = ekipRows
    .filter(m => m.user_id !== user.id)
    .map(m => m.user_id)

  const threeDaysAgoIso = new Date(now - 3 * 86_400_000).toISOString()
  const { data: coachingRows } = teamMemberUserIds.length > 0
    ? await supabase
        .from('nmm_daily_actions')
        .select('note_tr, created_at')
        .eq('user_id', user.id)
        .eq('action_type', 'ai_generate')
        .gte('created_at', threeDaysAgoIso)
        .like('note_tr', 'coaching:%')
    : { data: null }

  const lastCoachedMap: Record<string, string> = {}
  for (const row of coachingRows ?? []) {
    const targetId = (row.note_tr ?? '').split(':')[1]
    if (targetId && !lastCoachedMap[targetId]) {
      lastCoachedMap[targetId] = row.created_at
    }
  }

  const members: SahaRadarMember[] = ekipRows
    .filter(m => m.user_id !== user.id)
    .map(m => {
      const days = m.last_activity_at
        ? Math.floor((now - new Date(m.last_activity_at).getTime()) / 86_400_000)
        : null
      const level: SahaRadarActivityLevel =
        days === null ? 'silent' : days <= 3 ? 'active' : days <= 7 ? 'recent' : 'silent'
      return {
        userId: m.user_id,
        pipelineId: m.pipeline_id ?? null,
        fullName: m.full_name ?? '—',
        avatarUrl: m.avatar_url ?? null,
        activityLevel: level,
        daysSinceActivity: days,
        candidateCount: m.candidate_count,
        phone: m.phone ?? null,
        lastCoachedAt: lastCoachedMap[m.user_id] ?? null,
      }
    })
    .sort((a, b) => {
      const order: Record<SahaRadarActivityLevel, number> = { active: 0, recent: 1, silent: 2 }
      return order[a.activityLevel] - order[b.activityLevel]
    })

  const ownerIds = [user.id, ...(teamAccess ? teamMemberUserIds : [])]

  const memberNameMap: Record<string, string> = {}
  for (const m of ekipRows) {
    memberNameMap[m.user_id] = m.full_name ?? '—'
  }

  const { data: followUpRows, error: followUpErr } = await supabase.rpc('nmm_saha_radar_follow_ups', {
    p_workspace_id: workspaceId,
    p_owner_ids: ownerIds,
    p_horizon_days: 7,
    p_limit: 60,
  })
  if (followUpErr) throw new Error(followUpErr.message)

  const followUps: SahaRadarFollowUp[] = (followUpRows ?? []).map(c => ({
    id: c.id,
    candidateName: c.full_name,
    ownerUserId: c.owner_id,
    ownerName: memberNameMap[c.owner_id] ?? '—',
    dueAt: c.next_follow_up_at!,
    isOverdue: c.next_follow_up_at! < nowIso,
    isMine: c.owner_id === user.id,
    phone: c.phone ?? null,
    stage: c.stage,
  }))

  return { members, followUps, myUserId: user.id, hasTeamAccess: teamAccess }
}

// ─── Coaching AI Action ───────────────────────────────────────────────────────

import { checkAIQuota, logAIGeneration } from '@/lib/ai/checkQuota'
import { GEMINI_FLASH } from '@/lib/ai/models'
import { clampAIUserInput } from '@/lib/domain/aiInputLimit'

export async function generateCoachingMessageAction(input: {
  memberName: string
  activityLevel: 'active' | 'recent' | 'silent'
  daysSinceActivity: number | null
  targetUserId?: string
  customContext?: string
}): Promise<{ message?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: 'GEMINI_API_KEY eksik.' }
  }
  if (!input.memberName) return { error: 'Üye adı eksik.' }

  const quota = await checkAIQuota('message')
  if (!quota.ok) return { error: quota.message }

  const { activityLevel, daysSinceActivity } = input
  const tone = activityLevel === 'silent' ? 'empatik' : 'motive_edici'
  const messageType = activityLevel === 'silent' ? 'yeniden_bag' : 'yeni_uye_karsilama'
  const baseContext =
    activityLevel === 'active'
      ? 'Bu kişi ekip üyendir (aday değil). Bu hafta aktif sahada çalışıyor — kısa motivasyon ve destek mesajı yaz.'
      : activityLevel === 'recent'
        ? 'Bu kişi ekip üyendir (aday değil). Son günlerde sahada biraz yavaşladı — nazikçe enerji ver, nasıl gidiyor diye sor.'
        : daysSinceActivity === null
          ? 'Bu kişi ekip üyendir (aday değil). Henüz hiç giriş yapmamış — sıcak bir şekilde başlamalarını teşvik et.'
          : `Bu kişi ekip üyendir (aday değil). ${daysSinceActivity} gündür aktif değil — endişeyle değil sevgiyle yeniden bağlantı kur.`

  const custom = input.customContext?.trim()
    ? clampAIUserInput(input.customContext.trim())
    : ''
  const context = custom
    ? `${baseContext}\n\nLider'in kişisel mesaj stili / şablon notu: ${custom}`
    : baseContext

  try {
    const message = await generateMessage({
      name: input.memberName,
      stage: 'katildi',
      note: '',
      context,
      tone,
      messageType,
      warmth: 'sicak',
    })

    const preview = message.slice(0, 120).replace(/\n/g, ' ')
    await logAIGeneration({
      workspaceId: quota.workspaceId,
      userId: quota.user.id,
      note: 'message',
      noteTr: input.targetUserId ? `coaching:${input.targetUserId}:${preview}` : undefined,
      aiModel: GEMINI_FLASH,
    })

    return { message }
  } catch (err: unknown) {
    return { error: 'Mesaj oluşturulamadı: ' + (err instanceof Error ? err.message : String(err)) }
  }
}
