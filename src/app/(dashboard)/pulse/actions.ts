'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { isSuperAdmin } from '@/lib/domain/auth'
import {
  parseLearningProgress,
  type LearningProgressSummary,
} from '@/lib/domain/pulse'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'
import { getTeamVideoSummaryMapAction } from '@/app/(dashboard)/egitim/videoActions'

async function assertWorkspaceMember(workspaceId: string) {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum gerekli.')

  // license_type'ı üyelik sorgusuna JOIN et → çağıranlar ayrı bir license
  // round-trip'i atmadan ctx.licenseType kullanır.
  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, nmm_workspaces(license_type)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) {
    const licenseType =
      (membership.nmm_workspaces as { license_type: string | null } | null)?.license_type ?? null
    return { supabase, user, licenseType }
  }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id, license_type')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user, licenseType: ws.license_type }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export type TeamProgressMap = Record<string, LearningProgressSummary>

/**
 * Ekip Performans İzleme Tablosu'nun Eğitim/İtiraz/Video % sütunları — kişi bazlı.
 * Yüzdeler kümülatiftir (nmm_user_progress + nmm_video_progress).
 */
export async function getTeamProgressMapAction(
  workspaceId: string,
  memberUserIds: string[]
): Promise<{
  locked: boolean
  progressByUserId: TeamProgressMap
  videoByUserId: Record<string, VideoProgressSummary>
}> {
  // assertWorkspaceMember artık licenseType döndürüyor → ayrı license sorgusu
  // (eski `ws` select) kaldırıldı; owner_id zaten kullanılmıyordu.
  const { supabase, user, licenseType } = await assertWorkspaceMember(workspaceId)

  const locked = !hasTeamPulseAccess(licenseType, isSuperAdmin(user))

  if (locked || memberUserIds.length === 0) {
    return { locked, progressByUserId: {}, videoByUserId: {} }
  }

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  // user_progress ile video summary bağımsız — ardışık değil paralel.
  const [{ data: rows }, videoByUserId] = await Promise.all([
    supabase
      .from('nmm_user_progress')
      .select('user_id, read_trainings, fav_trainings, read_objections, fav_objections')
      .in('user_id', uniqueIds),
    getTeamVideoSummaryMapAction(uniqueIds),
  ])

  const progressByUserId: TeamProgressMap = {}
  for (const row of rows ?? []) {
    progressByUserId[row.user_id] = parseLearningProgress(row)
  }

  return { locked: false, progressByUserId, videoByUserId }
}
