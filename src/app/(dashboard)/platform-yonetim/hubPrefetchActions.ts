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

export type HubPrefetchDailyRow = {
  day: string
  event_count: number
  sum_hub_self_queries: number
  sum_total_tasks: number
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

/** Platform geneli günlük rollup (workspace satırları gün bazında toplanır). */
export async function listHubPrefetchDailyRollupsAction(
  limitDays = 7,
): Promise<HubPrefetchDailyRow[]> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('nmm_hub_prefetch_daily')
    .select('day, event_count, sum_hub_self_queries, sum_total_tasks')
    .order('day', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  const byDay = new Map<string, HubPrefetchDailyRow>()
  for (const row of data ?? []) {
    const existing = byDay.get(row.day) ?? {
      day: row.day,
      event_count: 0,
      sum_hub_self_queries: 0,
      sum_total_tasks: 0,
    }
    existing.event_count += row.event_count
    existing.sum_hub_self_queries += row.sum_hub_self_queries
    existing.sum_total_tasks += row.sum_total_tasks
    byDay.set(row.day, existing)
  }

  return [...byDay.values()]
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, limitDays)
}
