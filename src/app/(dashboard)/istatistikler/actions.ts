'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { assertSuperAdmin } from '@/lib/auth'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'

function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface IndependentAIUsageRow {
  userId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  licenseType: string
  licenseExpiresAt: string | null
  registeredAt: string
  todayMessage: number
  todayRoleplay: number
  todayCompliance: number
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

/**
 * Super-admin only: independent signups (no upline / parent_id) and their today's AI usage.
 */
export async function getIndependentSignupAIUsageAction(): Promise<IndependentAIUsageRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  const { data: workspaces, error: wsError } = await admin
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at, created_at, parent_id')
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (wsError || !workspaces) {
    throw new Error('Bağımsız kayıtlar okunamadı.')
  }

  const seenOwners = new Set<string>()
  const independentOwners: Array<{
    userId: string
    licenseType: string
    licenseExpiresAt: string | null
    registeredAt: string
  }> = []

  for (const ws of workspaces) {
    if (!ws.owner_id || ws.owner_id === user.id) continue
    if (seenOwners.has(ws.owner_id)) continue
    seenOwners.add(ws.owner_id)
    independentOwners.push({
      userId: ws.owner_id,
      licenseType: ws.license_type ?? 'free',
      licenseExpiresAt: ws.license_expires_at ?? null,
      registeredAt: ws.created_at,
    })
  }

  if (independentOwners.length === 0) return []

  const ownerIds = independentOwners.map(o => o.userId)

  const { data: { users = [] } } = await admin.auth.admin.listUsers()
  const userMap = new Map(users.map(u => [u.id, u]))

  const { data: memberRows } = await admin
    .from('nmm_workspace_members')
    .select('user_id, full_name, avatar_url')
    .in('user_id', ownerIds)

  const memberByUser = new Map(
    (memberRows ?? []).map(m => [m.user_id, m])
  )

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayActions } = await admin
    .from('nmm_daily_actions')
    .select('user_id, note')
    .in('user_id', ownerIds)
    .eq('action_type', 'ai_generate')
    .gte('created_at', todayStart.toISOString())

  const usageByUser = new Map<string, { message: number; roleplay: number; compliance: number }>()
  for (const id of ownerIds) {
    usageByUser.set(id, { message: 0, roleplay: 0, compliance: 0 })
  }
  todayActions?.forEach(act => {
    const bucket = usageByUser.get(act.user_id)
    if (!bucket) return
    if (act.note === 'roleplay') bucket.roleplay++
    else if (act.note === 'compliance') bucket.compliance++
    else bucket.message++
  })

  return independentOwners
    .map(owner => {
      const authUser = userMap.get(owner.userId)
      const member = memberByUser.get(owner.userId)
      const usage = usageByUser.get(owner.userId) ?? { message: 0, roleplay: 0, compliance: 0 }
      const limits = getLimitsForLicense(owner.licenseType)

      const email = authUser?.email ?? '—'
      const fullName =
        member?.full_name ??
        (authUser?.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0] ??
        null
      const avatarUrl =
        member?.avatar_url ??
        (authUser?.user_metadata?.avatar_url as string | undefined) ??
        null

      return {
        userId: owner.userId,
        fullName,
        email,
        avatarUrl,
        licenseType: owner.licenseType,
        licenseExpiresAt: owner.licenseExpiresAt,
        registeredAt: owner.registeredAt,
        todayMessage: usage.message,
        todayRoleplay: usage.roleplay,
        todayCompliance: usage.compliance,
        messageLimit: limits.messageLimit,
        roleplayLimit: limits.roleplayLimit,
        complianceLimit: limits.complianceLimit,
      }
    })
    .sort((a, b) => {
      const totalA = a.todayMessage + a.todayRoleplay + a.todayCompliance
      const totalB = b.todayMessage + b.todayRoleplay + b.todayCompliance
      if (totalB !== totalA) return totalB - totalA
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    })
}
