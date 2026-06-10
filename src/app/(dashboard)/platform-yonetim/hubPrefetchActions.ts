'use server'

import { getAuthUser } from '@/lib/supabase/authUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { assertSuperAdmin } from '@/lib/domain/auth'

export type HubPrefetchEventSource = 'ssr' | 'hover' | 'client'

export type HubPrefetchEventRow = {
  id: string
  workspace_id: string
  user_id: string
  active_tab: string
  hub_self_queries: number
  total_tasks: number
  source: HubPrefetchEventSource
  created_at: string
}

export async function recordHubPrefetchEventAction(input: {
  workspaceId: string
  activeTab: string
  hubSelfQueries: number
  totalTasks: number
  source: HubPrefetchEventSource
}): Promise<void> {
  const { user } = await getAuthUser()
  if (!user) return

  const supabase = await createClient()
  const { error } = await supabase.from('nmm_hub_prefetch_events').insert({
    workspace_id: input.workspaceId,
    user_id: user.id,
    active_tab: input.activeTab,
    hub_self_queries: input.hubSelfQueries,
    total_tasks: input.totalTasks,
    source: input.source,
  })
  if (error) {
    console.error('[recordHubPrefetchEvent]', error.message)
  }
}

export async function listHubPrefetchEventsAction(
  limit = 12,
): Promise<HubPrefetchEventRow[]> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nmm_hub_prefetch_events')
    .select('id, workspace_id, user_id, active_tab, hub_self_queries, total_tasks, source, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as HubPrefetchEventRow[]
}
