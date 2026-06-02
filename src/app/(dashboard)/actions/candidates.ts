'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { CANDIDATE_DETAIL_SELECT, CANDIDATE_LIST_SELECT } from '@/lib/domain/candidateSelect'
import type { NmmCandidate } from '@/types/database.types'

/** Workspace aday listesi — dashboard SSR prefetch ve useCandidates ile paylaşılır. */
export async function fetchCandidatesAction(workspaceId: string): Promise<NmmCandidate[]> {
  const supabase = await createClient()
  const { user, error: userError } = await getAuthUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  const { data, error } = await supabase
    .from('nmm_candidates')
    .select(CANDIDATE_LIST_SELECT)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as NmmCandidate[]
}

/** Pipeline detay — tek aday, tam satır. */
export async function fetchCandidateDetailAction(
  workspaceId: string,
  candidateId: string
): Promise<NmmCandidate | null> {
  const supabase = await createClient()
  const { user, error: userError } = await getAuthUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  const { data, error } = await supabase
    .from('nmm_candidates')
    .select(CANDIDATE_DETAIL_SELECT)
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
