import type { SupabaseClient } from '@supabase/supabase-js'

export interface TrialEmailRecipient {
  email: string
  name: string
  workspaceId: string
}

/** license_expires_at tam günü = bugün + offsetDays olan free workspace liderleri. */
export async function fetchFreeTrialRecipients(
  supabase: SupabaseClient,
  offsetDays: number
): Promise<TrialEmailRecipient[]> {
  const target = new Date()
  target.setDate(target.getDate() + offsetDays)
  target.setHours(0, 0, 0, 0)

  const targetEnd = new Date(target)
  targetEnd.setHours(23, 59, 59, 999)

  const { data: workspaces, error } = await supabase
    .from('nmm_workspaces')
    .select('id, license_expires_at')
    .eq('license_type', 'free')
    .gte('license_expires_at', target.toISOString())
    .lte('license_expires_at', targetEnd.toISOString())

  if (error) {
    console.error('[cronTrialRecipients] workspace query failed:', error)
    return []
  }

  const out: TrialEmailRecipient[] = []

  for (const ws of workspaces ?? []) {
    const { data: member } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name')
      .eq('workspace_id', ws.id)
      .eq('role', 'leader')
      .maybeSingle()

    if (!member) continue

    const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id)
    const user = authUser?.user
    const email = user?.email
    if (!email) continue

    out.push({
      workspaceId: ws.id,
      email,
      name:
        member.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        'Değerli Ortak',
    })
  }

  return out
}
