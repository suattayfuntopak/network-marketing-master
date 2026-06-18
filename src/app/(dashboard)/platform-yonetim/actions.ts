'use server'

import { getAuthUser } from '@/lib/supabase/authUser'
import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperAdmin } from '@/lib/domain/auth'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import type { User } from '@supabase/supabase-js'
import { normalizeLicenseType } from '@/lib/domain/aiUsage'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { aggregateViralKpi, type ViralKpi, type ViralEventRow } from '@/lib/domain/viralKpi'
import { todayCalendarKey, istanbulDayKey } from '@/lib/utils/calendarDates'
import { getProductFunnelStatsAction } from '@/app/(dashboard)/istatistikler/actions'

export interface PlatformWorkspaceItem {
  workspaceId: string
  workspaceName: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  avatarUrl: string | null
  createdAt: string
  licenseType: string
  licenseExpiresAt: string | null
  candidateCount: number
  downlineCount: number
  sponsorName: string | null
  sponsorEmail: string | null
  isIndependent: boolean
  /** Candidate id in the super admin's OWN pipeline, if this user is also their candidate. */
  pipelineCandidateId: string | null
  ownerPhone: string | null
}

async function listAllAuthUsers(admin: ReturnType<typeof createAdminClient>): Promise<User[]> {
  const users: User[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data.users ?? []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  return users
}

/**
 * Fetches all registered workspaces, users, candidate counts and sponsorship links.
 * Restricted strictly to the Super Admin suattayfuntopak@gmail.com.
 */
export async function getPlatformWorkspacesAction(): Promise<PlatformWorkspaceItem[]> {
  const { user } = await getAuthUser()

  assertSuperAdmin(user)

  const admin = createAdminClient()

  const [
    users,
    workspacesResult,
    countRpcResult,
    adminCandidatesResult,
    memberAvatarsResult,
  ] = await Promise.all([
    listAllAuthUsers(admin),
    admin
      .from('nmm_workspaces')
      .select('id, name, owner_id, parent_id, license_type, license_expires_at, created_at')
      .order('created_at', { ascending: true }),
    admin.rpc('nmm_count_candidates_per_workspace'),
    admin
      .from('nmm_candidates')
      .select('id, owner_id, full_name, phone, avatar_url, note, note_tr, note_en')
      .eq('owner_id', user.id),
    // Avatarlar eskiden workspaces sonucundan türeyen ownerIds'e bağlı AYRI bir
    // 2. dalgaydı; tüm üye avatarlarını burada paralelde çekip bağımlılığı kaldırıyoruz.
    admin
      .from('nmm_workspace_members')
      .select('user_id, avatar_url')
      .not('avatar_url', 'is', null),
  ])

  const { data: workspaces, error: wsError } = workspacesResult
  if (wsError || !workspaces) {
    console.error('[getPlatformWorkspacesAction] workspaces error:', wsError)
    throw new Error('Çalışma alanları çekilemedi.')
  }

  const userMap = new Map<string, User>()
  users.forEach(u => userMap.set(u.id, u))

  const candidateCountMap = new Map<string, number>()
  const { data: countJson, error: countRpcError } = countRpcResult
  if (!countRpcError && countJson && typeof countJson === 'object') {
    Object.entries(countJson as Record<string, number>).forEach(([wsId, cnt]) => {
      candidateCountMap.set(wsId, cnt)
    })
  } else {
    const { data: candidates, error: cError } = await admin
      .from('nmm_candidates')
      .select('workspace_id')
    if (!cError && candidates) {
      candidates.forEach(c => {
        candidateCountMap.set(c.workspace_id, (candidateCountMap.get(c.workspace_id) ?? 0) + 1)
      })
    }
  }

  const parentCountMap = new Map<string, number>()
  workspaces.forEach(w => {
    if (w.parent_id) {
      parentCountMap.set(w.parent_id, (parentCountMap.get(w.parent_id) ?? 0) + 1)
    }
  })

  const workspaceById = new Map<string, typeof workspaces[0]>()
  workspaces.forEach(w => workspaceById.set(w.id, w))

  const avatarByOwnerId = new Map<string, string>()
  memberAvatarsResult.data?.forEach(row => {
    if (row.avatar_url && !avatarByOwnerId.has(row.user_id)) {
      avatarByOwnerId.set(row.user_id, row.avatar_url)
    }
  })

  const { data: adminCandidates } = adminCandidatesResult
 
  const phoneByCandidateId = new Map<string, string>()
  const avatarByCandidateId = new Map<string, string>()
  adminCandidates?.forEach(c => {
    if (c.phone) phoneByCandidateId.set(c.id, c.phone)
    const noteAvatar = resolveCandidateFields(c).avatarUrl ?? c.avatar_url ?? null
    if (noteAvatar) avatarByCandidateId.set(c.id, noteAvatar)
  })

  const seenOwners = new Set<string>()
  const result: PlatformWorkspaceItem[] = []

  for (const w of workspaces) {
    if (w.owner_id === user.id) continue

    if (w.owner_id && seenOwners.has(w.owner_id)) continue
    if (w.owner_id) seenOwners.add(w.owner_id)

    const ownerUser = w.owner_id ? userMap.get(w.owner_id) : null
    const ownerEmail = ownerUser?.email ?? 'Bilinmiyor'
    const ownerName = (ownerUser?.user_metadata?.full_name as string | undefined) ?? ownerUser?.email?.split('@')[0] ?? 'İsimsiz Üye'
    const pipelineCandidateId = findLeaderCandidateForMember(adminCandidates ?? [], user.id, ownerName)
    const candidateAvatar = pipelineCandidateId ? avatarByCandidateId.get(pipelineCandidateId) ?? null : null

    const avatarUrl =
      (ownerUser?.user_metadata?.avatar_url as string | undefined) ??
      (w.owner_id ? avatarByOwnerId.get(w.owner_id) ?? null : null) ??
      candidateAvatar

    let sponsorName: string | null = null
    let sponsorEmail: string | null = null
    if (w.parent_id) {
      const parentWorkspace = workspaceById.get(w.parent_id)
      const sponsorUser = parentWorkspace?.owner_id
        ? userMap.get(parentWorkspace.owner_id)
        : userMap.get(w.parent_id)
      if (sponsorUser) {
        sponsorEmail = sponsorUser.email ?? null
        sponsorName = (sponsorUser.user_metadata?.full_name as string | undefined) ?? sponsorUser.email?.split('@')[0] ?? 'Lider'
      }
    }

    const candidateCount = candidateCountMap.get(w.id) ?? 0
    const downlineCount = parentCountMap.get(w.id) ?? 0

    const ownerPhone =
      (pipelineCandidateId ? phoneByCandidateId.get(pipelineCandidateId) : null) ??
      ownerUser?.phone ??
      ((ownerUser?.user_metadata?.phone as string | undefined) ?? null)

    result.push({
      workspaceId: w.id,
      workspaceName: w.name,
      ownerId: w.owner_id ?? '',
      ownerEmail,
      ownerName,
      avatarUrl,
      createdAt: w.created_at,
      licenseType: normalizeLicenseType(w.license_type),
      licenseExpiresAt: w.license_expires_at ?? null,
      candidateCount,
      downlineCount,
      sponsorName,
      sponsorEmail,
      isIndependent: !w.parent_id,
      pipelineCandidateId,
      ownerPhone,
    })
  }

  return result
}

const VIRAL_KPI_WINDOW_DAYS = 30

/**
 * Viralite KPI paneli (Süper Admin) — Dalga 0 ölçüm olaylarını okunur metriklere çevirir.
 * product_events RLS yalnız insert'e açık; agregasyon admin client (service role) ile.
 * Son 30 gün; hesaplama saf `aggregateViralKpi`'de (test edilebilir).
 */
export async function getViralKpiAction(): Promise<ViralKpi> {
  const { user } = await getAuthUser()
  assertSuperAdmin(user)

  const admin = createAdminClient()
  const windowStartIso = new Date(
    Date.now() - VIRAL_KPI_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  const { data } = await admin
    .from('nmm_product_events')
    .select('event_name, user_id, metadata, created_at')
    .gte('created_at', windowStartIso)
    .in('event_name', [
      PRODUCT_EVENTS.inviteSent,
      PRODUCT_EVENTS.inviteLandingView,
      PRODUCT_EVENTS.inviteAccepted,
      PRODUCT_EVENTS.dailyActive,
      PRODUCT_EVENTS.achievementShared,
      PRODUCT_EVENTS.socialContentShared,
      PRODUCT_EVENTS.announcementShared,
      PRODUCT_EVENTS.broadcastSent,
    ])
    .limit(20000)

  const rows: ViralEventRow[] = (data ?? []).map(r => {
    const meta = r.metadata as Record<string, unknown> | null
    const day = typeof meta?.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meta.day)
      ? meta.day
      : istanbulDayKey(r.created_at)
    return { eventName: r.event_name, userId: r.user_id, day }
  })

  return aggregateViralKpi(rows, todayCalendarKey(), VIRAL_KPI_WINDOW_DAYS)
}

/** Süper admin: son 30 gün satış hunisi (landing → plan CTA → ödeme). */
export async function getPlatformProductFunnelAction() {
  return getProductFunnelStatsAction('30d')
}
