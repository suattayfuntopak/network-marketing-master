'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import { listAllAuthUsers } from '@/lib/supabase/listAllAuthUsers'
import { assertSuperAdmin, isSuperAdmin, superAdminLicenseOverride } from '@/lib/domain/auth'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'

export interface IndependentAIUsageRow {
  userId: string
  workspaceId: string
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

export type ActionWithWarning<T> = { data: T; warning: string | null }

export type MemberLicenseProfile = {
  licenseType: string
  licenseExpiresAt: string | null
  workspaceCreatedAt: string
  isSuperAdmin: boolean
}

/**
 * Super-admin only: bağımsız dış kayıt — Platform Masası ile aynı kriter: free lisans, parent_id boş.
 * (Ekibe üye olarak eklenmiş olsa bile kendi workspace'inde sponsor yoksa listelenir.)
 */
export async function getIndependentSignupAIUsageAction(): Promise<
  ActionWithWarning<IndependentAIUsageRow[]>
> {
  try {
    const data = await buildIndependentSignupAIUsage()
    return { data, warning: null }
  } catch (err) {
    console.error('[getIndependentSignupAIUsage]', err)
    return { data: [], warning: 'load_failed' }
  }
}

async function buildIndependentSignupAIUsage(): Promise<IndependentAIUsageRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()

  const { data: myMembership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user!.id)
    .eq('role', 'leader')
    .maybeSingle()

  const excludeWorkspaceId = myMembership?.workspace_id ?? null

  // Platform Masası ile aynı kriter: parent_id boş (lisans tipine bakılmaz)
  const { data: workspaces, error: wsError } = await admin
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at, created_at, parent_id')
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (wsError || !workspaces) {
    console.error('[getIndependentSignupAIUsage]', wsError)
    return []
  }

  const seenOwners = new Set<string>()
  const independentOwners: {
    userId: string
    workspaceId: string
    licenseType: string
    licenseExpiresAt: string | null
    registeredAt: string
  }[] = []

  for (const ws of workspaces) {
    if (ws.id === excludeWorkspaceId || !ws.owner_id || ws.owner_id === user!.id) continue
    if (ws.parent_id) continue
    if (seenOwners.has(ws.owner_id)) continue
    seenOwners.add(ws.owner_id)
    independentOwners.push({
      userId: ws.owner_id,
      workspaceId: ws.id,
      licenseType: ws.license_type ?? 'free',
      licenseExpiresAt: ws.license_expires_at ?? null,
      registeredAt: ws.created_at,
    })
  }

  if (independentOwners.length === 0) return []

  const filteredOwnerIds = independentOwners.map(o => o.userId)

  let users: Awaited<ReturnType<typeof listAllAuthUsers>> = []
  try {
    users = await listAllAuthUsers(admin)
  } catch (listErr) {
    console.error('[getIndependentSignupAIUsage] listUsers', listErr)
  }
  const userMap = new Map(users.map(u => [u.id, u]))

  const { data: memberRows } = await admin
    .from('nmm_workspace_members')
    .select('user_id, full_name, avatar_url')
    .in('user_id', filteredOwnerIds)

  const memberByUser = new Map((memberRows ?? []).map(m => [m.user_id, m]))

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayActions } = await admin
    .from('nmm_daily_actions')
    .select('user_id, note')
    .in('user_id', filteredOwnerIds)
    .eq('action_type', 'ai_generate')
    .gte('created_at', todayStart.toISOString())

  const usageByUser = new Map<string, { message: number; roleplay: number; compliance: number }>()
  for (const id of filteredOwnerIds) {
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
      const limits = getLimitsForLicense(
        owner.licenseType,
        false,
        owner.licenseExpiresAt,
        owner.registeredAt
      )

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
        workspaceId: owner.workspaceId,
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

/** Super-admin only: ekip tablosundaki her üyenin kendi workspace lisans profili. */
export async function getMemberLicenseProfilesAction(
  userIds: string[]
): Promise<Record<string, MemberLicenseProfile>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  if (userIds.length === 0) return {}

  const admin = createAdminClient()
  const uniqueIds = [...new Set(userIds)]

  const { data: workspaces } = await admin
    .from('nmm_workspaces')
    .select('owner_id, license_type, license_expires_at, created_at')
    .in('owner_id', uniqueIds)
    .order('created_at', { ascending: true })

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 200 })
  const users = listData?.users ?? []
  const emailById = new Map(users.map(u => [u.id, u.email ?? '']))

  const profileByOwner = new Map<string, MemberLicenseProfile>()
  workspaces?.forEach(ws => {
    if (!ws.owner_id || profileByOwner.has(ws.owner_id)) return
    const email = emailById.get(ws.owner_id) ?? ''
    const adminUser = isSuperAdmin({ email })
    profileByOwner.set(ws.owner_id, {
      licenseType: adminUser ? superAdminLicenseOverride().licenseType : (ws.license_type ?? 'free'),
      licenseExpiresAt: adminUser ? null : (ws.license_expires_at ?? null),
      workspaceCreatedAt: ws.created_at,
      isSuperAdmin: adminUser,
    })
  })

  const result: Record<string, MemberLicenseProfile> = {}
  for (const id of uniqueIds) {
    const profile = profileByOwner.get(id)
    result[id] = profile ?? {
      licenseType: 'free',
      licenseExpiresAt: null,
      workspaceCreatedAt: new Date().toISOString(),
      isSuperAdmin: false,
    }
  }
  return result
}

export type AIUsageArchivePeriod = '7d' | '30d' | '365d' | 'all'

export interface AIUsageArchiveRow {
  userId: string
  fullName: string | null
  email: string
  licenseType: string
  isSuperAdmin: boolean
  isInvitedDownline: boolean
  messageTotal: number
  roleplayTotal: number
  complianceTotal: number
  activeDays: number
}

export interface AIUsageArchiveSummary {
  period: AIUsageArchivePeriod
  fromDate: string | null
  toDate: string
  rows: AIUsageArchiveRow[]
  totals: {
    message: number
    roleplay: number
    compliance: number
    users: number
  }
  unavailable?: boolean
}

const EMPTY_ARCHIVE_TOTALS = {
  message: 0,
  roleplay: 0,
  compliance: 0,
  users: 0,
} as const

function emptyArchiveSummary(
  period: AIUsageArchivePeriod,
  unavailable = false
): AIUsageArchiveSummary {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const toDate = today.toISOString().slice(0, 10)
  let fromDate: string | null = null
  if (period === '7d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 6)
    fromDate = d.toISOString().slice(0, 10)
  } else if (period === '30d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 29)
    fromDate = d.toISOString().slice(0, 10)
  } else if (period === '365d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 364)
    fromDate = d.toISOString().slice(0, 10)
  }
  return {
    period,
    fromDate,
    toDate,
    rows: [],
    totals: { ...EMPTY_ARCHIVE_TOTALS },
    unavailable,
  }
}

/** Super-admin: günlük roll-up tablosundan dönem bazlı YZ kullanım arşivi. */
export async function getAIUsageArchiveAction(
  period: AIUsageArchivePeriod = '30d'
): Promise<ActionWithWarning<AIUsageArchiveSummary>> {
  try {
    const data = await buildAIUsageArchive(period)
    return { data, warning: null }
  } catch (err) {
    console.error('[getAIUsageArchive]', err)
    return { data: emptyArchiveSummary(period), warning: 'load_failed' }
  }
}

async function buildAIUsageArchive(
  period: AIUsageArchivePeriod
): Promise<AIUsageArchiveSummary> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const toDate = today.toISOString().slice(0, 10)

  let fromDate: string | null = null
  if (period === '7d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 6)
    fromDate = d.toISOString().slice(0, 10)
  } else if (period === '30d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 29)
    fromDate = d.toISOString().slice(0, 10)
  } else if (period === '365d') {
    const d = new Date(today)
    d.setDate(d.getDate() - 364)
    fromDate = d.toISOString().slice(0, 10)
  }

  let query = admin.from('nmm_ai_usage_daily').select('*')
  if (fromDate) {
    query = query.gte('usage_date', fromDate).lte('usage_date', toDate)
  }

  const { data: dailyRows, error: dailyError } = await query

  const byUser = new Map<
    string,
    { message: number; roleplay: number; compliance: number; days: Set<string>; workspaceId: string | null }
  >()

  if (dailyError) {
    console.error('[getAIUsageArchive] daily rollup', dailyError)
    await aggregateAiUsageFromDailyActions(admin, byUser, fromDate, toDate)
  } else {
    dailyRows?.forEach(row => {
      const bucket = byUser.get(row.user_id) ?? {
        message: 0,
        roleplay: 0,
        compliance: 0,
        days: new Set<string>(),
        workspaceId: row.workspace_id,
      }
      bucket.message += row.message_count ?? 0
      bucket.roleplay += row.roleplay_count ?? 0
      bucket.compliance += row.compliance_count ?? 0
      bucket.days.add(row.usage_date)
      if (!bucket.workspaceId && row.workspace_id) bucket.workspaceId = row.workspace_id
      byUser.set(row.user_id, bucket)
    })
  }

  return assembleArchiveSummary(admin, period, fromDate, toDate, byUser)
}

type UsageAgg = {
  message: number
  roleplay: number
  compliance: number
  days: Set<string>
  workspaceId: string | null
}

async function aggregateAiUsageFromDailyActions(
  admin: AdminClient,
  byUser: Map<string, UsageAgg>,
  fromDate: string | null,
  toDate: string
): Promise<void> {
  let q = admin
    .from('nmm_daily_actions')
    .select('user_id, workspace_id, note, created_at')
    .eq('action_type', 'ai_generate')

  if (fromDate) {
    q = q
      .gte('created_at', `${fromDate}T00:00:00.000Z`)
      .lte('created_at', `${toDate}T23:59:59.999Z`)
  }

  const { data: actions, error } = await q
  if (error) {
    console.error('[aggregateAiUsageFromDailyActions]', error)
    return
  }

  actions?.forEach(act => {
    const day = act.created_at.slice(0, 10)
    const bucket = byUser.get(act.user_id) ?? {
      message: 0,
      roleplay: 0,
      compliance: 0,
      days: new Set<string>(),
      workspaceId: act.workspace_id,
    }
    if (act.note === 'roleplay') bucket.roleplay++
    else if (act.note === 'compliance') bucket.compliance++
    else bucket.message++
    bucket.days.add(day)
    if (!bucket.workspaceId && act.workspace_id) bucket.workspaceId = act.workspace_id
    byUser.set(act.user_id, bucket)
  })
}

async function assembleArchiveSummary(
  admin: AdminClient,
  period: AIUsageArchivePeriod,
  fromDate: string | null,
  toDate: string,
  byUser: Map<string, UsageAgg>
): Promise<AIUsageArchiveSummary> {
  const userIds = [...byUser.keys()]
  if (userIds.length === 0) {
    return emptyArchiveSummary(period)
  }

  const users = await listAllAuthUsers(admin)
  const emailById = new Map(users.map(u => [u.id, u.email ?? '']))
  const nameById = new Map(
    users.map(u => [
      u.id,
      (u.user_metadata?.full_name as string | undefined) ?? u.email?.split('@')[0] ?? null,
    ])
  )

  const { data: memberRows } = await admin
    .from('nmm_workspace_members')
    .select('user_id, full_name')
    .in('user_id', userIds)

  memberRows?.forEach(m => {
    if (m.full_name) nameById.set(m.user_id, m.full_name)
  })

  const { data: workspaces } = await admin
    .from('nmm_workspaces')
    .select('owner_id, license_type, parent_id')
    .in('owner_id', userIds)

  const licenseByOwner = new Map(
    (workspaces ?? []).map(w => [w.owner_id!, w.license_type ?? 'free'])
  )
  const invitedOwners = new Set(
    (workspaces ?? []).filter(w => w.parent_id).map(w => w.owner_id!)
  )

  const rows: AIUsageArchiveRow[] = userIds
    .map(userId => {
      const agg = byUser.get(userId)!
      const email = emailById.get(userId) ?? '—'
      const superAdmin = isSuperAdmin({ email })
      return {
        userId,
        fullName: nameById.get(userId) ?? null,
        email,
        licenseType: superAdmin
          ? superAdminLicenseOverride().licenseType
          : (licenseByOwner.get(userId) ?? 'free'),
        isSuperAdmin: superAdmin,
        isInvitedDownline: invitedOwners.has(userId),
        messageTotal: agg.message,
        roleplayTotal: agg.roleplay,
        complianceTotal: agg.compliance,
        activeDays: agg.days.size,
      }
    })
    .sort((a, b) => {
      if (a.isSuperAdmin && !b.isSuperAdmin) return -1
      if (!a.isSuperAdmin && b.isSuperAdmin) return 1
      const totalA = a.messageTotal + a.roleplayTotal + a.complianceTotal
      const totalB = b.messageTotal + b.roleplayTotal + b.complianceTotal
      return totalB - totalA
    })

  const totals = rows.reduce(
    (acc, r) => ({
      message: acc.message + r.messageTotal,
      roleplay: acc.roleplay + r.roleplayTotal,
      compliance: acc.compliance + r.complianceTotal,
      users: acc.users + 1,
    }),
    { message: 0, roleplay: 0, compliance: 0, users: 0 }
  )

  return { period, fromDate, toDate, rows, totals }
}
