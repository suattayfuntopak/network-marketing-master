'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchTeamBundle } from '@/lib/team/fetchTeamBundle'
import type { TeamBundle } from '@/lib/team/fetchTeamBundle'

export async function fetchTeamBundleAction(workspaceId: string): Promise<TeamBundle> {
  const supabase = await createClient()
  return fetchTeamBundle(supabase, workspaceId)
}
