'use server'

import { createClient } from '@/lib/supabase/server'
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) return { supabase, user }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user }

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
  const { supabase, user } = await assertWorkspaceMember(workspaceId)

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('license_type, owner_id')
    .eq('id', workspaceId)
    .single()

  const locked = !hasTeamPulseAccess(ws?.license_type, isSuperAdmin(user))

  if (locked || memberUserIds.length === 0) {
    return { locked, progressByUserId: {}, videoByUserId: {} }
  }

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  const { data: rows } = await supabase
    .from('nmm_user_progress')
    .select('user_id, read_trainings, fav_trainings, read_objections, fav_objections')
    .in('user_id', uniqueIds)

  const progressByUserId: TeamProgressMap = {}
  for (const row of rows ?? []) {
    progressByUserId[row.user_id] = parseLearningProgress(row)
  }

  const videoByUserId = await getTeamVideoSummaryMapAction(uniqueIds)

  return { locked: false, progressByUserId, videoByUserId }
}
