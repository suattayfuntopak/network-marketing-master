'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import { listAllAuthUsers } from '@/lib/supabase/listAllAuthUsers'
import { assertSuperAdmin, isSuperAdmin, superAdminLicenseOverride } from '@/lib/domain/auth'
import { getLimitsForLicense } from '@/lib/domain/aiUsage'
import { normalizeLicenseType } from '@/lib/domain/aiUsage'
import type { PulsePeriod } from '@/lib/domain/pulse'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import {
  fetchFunnelActualsForPeriod,
  funnelRangeForPulsePeriod,
} from '@/lib/domain/funnelActuals'
import {
  funnelTargetsForPulsePeriod,
  goalPayloadToFunnelContext,
} from '@/lib/domain/hubFunnelTargets'
import { getGoalFunnelContextAction } from '@/app/(dashboard)/hedef/actions'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { GEMINI_FLASH, GEMINI_PRO } from '@/lib/ai/models'

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

export type StatsFunnelBundle = {
  actuals: FunnelCounts
  targets: FunnelCounts
  hasGoal: boolean
}

/** Gerçekleşen + yol haritası hedefi — tek round-trip. */
export async function getStatsFunnelBundleAction(period: PulsePeriod): Promise<StatsFunnelBundle> {
  const [ctx, actuals] = await Promise.all([
    getGoalFunnelContextAction(),
    getStatsFunnelActualsAction(period),
  ])
  if (!ctx.hasGoal || !ctx.goal) {
    return { actuals, targets: EMPTY_FUNNEL, hasGoal: false }
  }
  const funnelCtx = goalPayloadToFunnelContext(ctx.goal, ctx.roadmap)
  return {
    actuals,
    targets: funnelTargetsForPulsePeriod(funnelCtx, period),
    hasGoal: true,
  }
}

/** Oturum açmış kullanıcının seçili dönem huni gerçekleşenleri — boru hattı tek kaynak. */
export async function getStatsFunnelActualsAction(period: PulsePeriod): Promise<FunnelCounts> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return EMPTY_FUNNEL

  const range = funnelRangeForPulsePeriod(period)
  return fetchFunnelActualsForPeriod(
    supabase,
    user.id,
    range.sinceIso,
    range.untilIso,
    range.startCalendarKey,
    range.endCalendarKey,
  )
}

export interface IndependentAIUsageRow {
  userId: string
  workspaceId: string
  fullName: string | null
  email: string
  avatarUrl: string | null
  licenseType: string
  licenseExpiresAt: string | null
  registeredAt: string
  dailyLimit: number
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

  // Platform Yönetim Masası ile aynı: TÜM workspace'leri çek, süper admin'in kendi workspace'i +
  // kendi doğrudan ekibi aşağıda elenir. Geri kalan herkes "dış kayıt" (Yusuf gibi parent_id dolu /
  // farklı lisanslı olsa bile listeye girer).
  const { data: workspaces, error: wsError } = await admin
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at, created_at, parent_id')
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
    // Süper admin'in KENDİ doğrudan alt ekibini ele (üstteki ekip tablosunda). İki parent_id
    // formatı desteklenir: user-id (eski) ve workspace-id (yeni).
    if (ws.parent_id === user!.id || ws.parent_id === excludeWorkspaceId) continue
    if (seenOwners.has(ws.owner_id)) continue
    seenOwners.add(ws.owner_id)
    independentOwners.push({
      userId: ws.owner_id,
      workspaceId: ws.id,
      licenseType: normalizeLicenseType(ws.license_type),
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

  return independentOwners
    .map(owner => {
      const authUser = userMap.get(owner.userId)
      const member = memberByUser.get(owner.userId)
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
        dailyLimit: limits.dailyLimit,
      }
    })
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
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
      licenseType: adminUser ? superAdminLicenseOverride().licenseType : normalizeLicenseType(ws.license_type),
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

export type AIUsageArchivePeriod = 'today' | '7d' | '30d' | 'ytd' | 'all'

/**
 * Dönem tarih aralığı — UTC tutarlı, BUGÜNÜ KAPSAR.
 * (Eski hata: yerel gece yarısı toISOString ile UTC+3'te düne kayıyor, bugünkü kullanım düşüyordu.)
 */
function archiveDateRange(period: AIUsageArchivePeriod): {
  fromDate: string | null
  toDate: string
} {
  const now = new Date()
  const toDate = now.toISOString().slice(0, 10)
  const dayMs = 24 * 60 * 60 * 1000
  let fromDate: string | null = null
  if (period === 'today') {
    fromDate = toDate
  } else if (period === '7d') {
    fromDate = new Date(now.getTime() - 6 * dayMs).toISOString().slice(0, 10)
  } else if (period === '30d') {
    fromDate = new Date(now.getTime() - 29 * dayMs).toISOString().slice(0, 10)
  } else if (period === 'ytd') {
    fromDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10)
  }
  return { fromDate, toDate }
}

type UsageAgg = {
  ai: number
}

async function aggregateAiUsageFromRollup(
  admin: AdminClient,
  byUser: Map<string, UsageAgg>,
  fromDate: string | null,
  toDate: string
): Promise<boolean> {
  let q = admin
    .from('nmm_ai_usage_daily')
    .select('user_id, usage_date, ai_count, message_count, roleplay_count, compliance_count')

  if (fromDate) {
    q = q.gte('usage_date', fromDate).lte('usage_date', toDate)
  }

  const { data: rows, error } = await q
  if (error) {
    console.error('[aggregateAiUsageFromRollup]', error)
    return false
  }
  if (!rows?.length) return false

  rows.forEach(row => {
    const legacy =
      (row.message_count ?? 0) + (row.roleplay_count ?? 0) + (row.compliance_count ?? 0)
    const count = row.ai_count > 0 ? row.ai_count : legacy
    const bucket = byUser.get(row.user_id) ?? { ai: 0 }
    bucket.ai += count
    byUser.set(row.user_id, bucket)
  })
  return true
}

async function aggregateAiUsageFromDailyActions(
  admin: AdminClient,
  byUser: Map<string, UsageAgg>,
  fromDate: string | null,
  toDate: string
): Promise<void> {
  let q = admin
    .from('nmm_daily_actions')
    .select('user_id, created_at')
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
    const bucket = byUser.get(act.user_id) ?? { ai: 0 }
    bucket.ai++
    byUser.set(act.user_id, bucket)
  })
}

export type AiUsageByPeriod = Record<string, { ai: number }>

/**
 * Süper admin: verilen kullanıcıların seçili dönemdeki YZ kullanım sayıları
 * Birleşik `ai_count` rollup (`nmm_ai_usage_daily`); yoksa `nmm_daily_actions` fallback.
 * "Ekip & Dış Kaynak YZ Kullanım & Limit Kontrol Tablosu" için tek kaynak.
 */
export async function getAiUsageByPeriodAction(
  userIds: string[],
  period: AIUsageArchivePeriod
): Promise<AiUsageByPeriod> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)
  if (userIds.length === 0) return {}

  const admin = createAdminClient()
  const { fromDate, toDate } = archiveDateRange(period)
  const byUser = new Map<string, UsageAgg>()
  const usedRollup = await aggregateAiUsageFromRollup(admin, byUser, fromDate, toDate)
  if (!usedRollup) {
    await aggregateAiUsageFromDailyActions(admin, byUser, fromDate, toDate)
  }

  const idSet = new Set(userIds)
  const result: AiUsageByPeriod = {}
  for (const [uid, agg] of byUser) {
    if (!idSet.has(uid)) continue
    result[uid] = { ai: agg.ai }
  }
  return result
}

export type AiModelMix = {
  flash: number
  pro: number
  unknown: number
}

/** Süper admin: seçili dönemde Flash vs Pro çağrı sayıları. */
export async function getAiModelMixAction(period: AIUsageArchivePeriod): Promise<AiModelMix> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const { fromDate, toDate } = archiveDateRange(period)

  let q = admin
    .from('nmm_daily_actions')
    .select('ai_model')
    .eq('action_type', 'ai_generate')

  if (fromDate) {
    q = q
      .gte('created_at', `${fromDate}T00:00:00.000Z`)
      .lte('created_at', `${toDate}T23:59:59.999Z`)
  }

  const { data, error } = await q
  if (error) {
    console.error('[getAiModelMixAction]', error)
    return { flash: 0, pro: 0, unknown: 0 }
  }

  const mix: AiModelMix = { flash: 0, pro: 0, unknown: 0 }
  for (const row of data ?? []) {
    if (row.ai_model === GEMINI_PRO) mix.pro++
    else if (row.ai_model === GEMINI_FLASH) mix.flash++
    else mix.unknown++
  }
  return mix
}

export type ProductFunnelCounts = {
  pricingSectionView: number
  upgradeGateCtaClick: number
  odemeBasicDeepLink: number
}

/** Süper admin: ürün hunisi olay sayıları (landing → upgrade CTA → ödeme deep link). */
export async function getProductFunnelStatsAction(
  period: AIUsageArchivePeriod,
): Promise<ProductFunnelCounts> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const { fromDate, toDate } = archiveDateRange(period)

  let q = admin.from('nmm_product_events').select('event_name')
  if (fromDate) {
    q = q
      .gte('created_at', `${fromDate}T00:00:00.000Z`)
      .lte('created_at', `${toDate}T23:59:59.999Z`)
  }

  const { data, error } = await q
  if (error) {
    console.error('[getProductFunnelStatsAction]', error)
    return {
      pricingSectionView: 0,
      upgradeGateCtaClick: 0,
      odemeBasicDeepLink: 0,
    }
  }

  const counts: ProductFunnelCounts = {
    pricingSectionView: 0,
    upgradeGateCtaClick: 0,
    odemeBasicDeepLink: 0,
  }
  for (const row of data ?? []) {
    if (row.event_name === PRODUCT_EVENTS.pricingSectionView) counts.pricingSectionView++
    else if (row.event_name === PRODUCT_EVENTS.upgradeGateCtaClick) counts.upgradeGateCtaClick++
    else if (row.event_name === PRODUCT_EVENTS.odemeBasicDeepLink) counts.odemeBasicDeepLink++
  }
  return counts
}
