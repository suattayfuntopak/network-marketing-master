'use server'

import { createClient } from '@/lib/supabase/server'
import type { NmmCandidate } from '@/types/database.types'

/** Workspace aday listesi — sunucu tarafı; dashboard SSR prefetch ve useCandidates ile paylaşılır. */
export async function fetchCandidatesAction(workspaceId: string): Promise<NmmCandidate[]> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Oturum bulunamadı.')

  const { data, error } = await supabase
    .from('nmm_candidates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
