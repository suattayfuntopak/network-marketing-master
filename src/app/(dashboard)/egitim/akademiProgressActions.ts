'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'

export type SelfUserProgressSnapshot = {
  readTrainings: string[]
  readObjections: number[]
}

export type AkademiCustomCounts = {
  training: number
  objection: number
}

/** Eğitim İlerlemem kutuları — SSR prefetch için hafif okuma sayacı. */
export async function getSelfUserProgressAction(): Promise<SelfUserProgressSnapshot | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return null

  const { data } = await supabase
    .from('nmm_user_progress')
    .select('read_trainings, read_objections')
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    readTrainings: (data?.read_trainings as string[]) ?? [],
    readObjections: (data?.read_objections as number[]) ?? [],
  }
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
