'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'

export type FullUserProgressSnapshot = {
  readTrainings: string[]
  favTrainings: string[]
  readObjections: number[]
  favObjections: number[]
}

export type AkademiCustomCounts = {
  training: number
  objection: number
}

async function fetchRemoteProgress(userId: string): Promise<FullUserProgressSnapshot> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('nmm_user_progress')
    .select('read_trainings, fav_trainings, read_objections, fav_objections')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) {
    return {
      readTrainings: (data.read_trainings as string[]) ?? [],
      favTrainings: (data.fav_trainings as string[]) ?? [],
      readObjections: (data.read_objections as number[]) ?? [],
      favObjections: (data.fav_objections as number[]) ?? [],
    }
  }

  const { data: legacy } = await supabase
    .from('nmm_daily_actions')
    .select('note')
    .eq('user_id', userId)
    .is('candidate_id', null)
    .eq('action_type', 'note')
    .like('note', 'nmm_progress_v1:%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (legacy?.note) {
    try {
      const parsed = JSON.parse(legacy.note.replace('nmm_progress_v1:', '')) as Partial<FullUserProgressSnapshot>
      return {
        readTrainings: parsed.readTrainings ?? [],
        favTrainings: parsed.favTrainings ?? [],
        readObjections: parsed.readObjections ?? [],
        favObjections: parsed.favObjections ?? [],
      }
    } catch {
      /* boş dön */
    }
  }

  return {
    readTrainings: [],
    favTrainings: [],
    readObjections: [],
    favObjections: [],
  }
}

/** Akademi ilerleme — okundu + favori (tek kaynak, TanStack + SSR prefetch). */
export async function getFullSelfUserProgressAction(): Promise<FullUserProgressSnapshot | null> {
  const { user } = await getAuthUser()
  if (!user) return null
  return fetchRemoteProgress(user.id)
}

export async function upsertSelfUserProgressAction(
  workspaceId: string,
  progress: FullUserProgressSnapshot,
): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return

  await supabase.from('nmm_user_progress').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      read_trainings: progress.readTrainings,
      fav_trainings: progress.favTrainings,
      read_objections: progress.readObjections,
      fav_objections: progress.favObjections,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
}

/** Onaylı + kullanıcının kendi özel içerikleri — toplam sayı için. */
export async function getAkademiCustomCountsAction(): Promise<AkademiCustomCounts> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { training: 0, objection: 0 }

  const ownerFilter = `is_approved.eq.true,user_id.eq.${user.id}`
  const [trainingRes, objectionRes] = await Promise.all([
    supabase
      .from('nmm_custom_trainings')
      .select('item_key', { count: 'exact', head: true })
      .or(ownerFilter),
    supabase
      .from('nmm_custom_objections')
      .select('item_key', { count: 'exact', head: true })
      .or(ownerFilter),
  ])

  return {
    training: trainingRes.count ?? 0,
    objection: objectionRes.count ?? 0,
  }
}
