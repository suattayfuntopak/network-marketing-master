// Centralized AI quota + auth gate for server actions. Replaces the
// `getUser → membership → workspace → license expiry → count → compare`
// block previously duplicated across 7+ action files.

import { createClient } from '@/lib/supabase/server'
import { getEffectiveLicenseType, getLimitsForLicense } from '@/lib/domain/aiUsage'
import { isSuperAdmin } from '@/lib/domain/auth'
import { istanbulDayStartIso, todayCalendarKey } from '@/lib/utils/calendarDates'

export type AIActionType = 'message' | 'roleplay' | 'compliance'

export interface QuotaCheckOk {
  ok: true
  user: { id: string; email: string | null }
  isSuperAdmin: boolean
  workspaceId: string | null
  licenseType: string
  limit: number
  used: number
  /** Remaining after the current action is logged; `Infinity` for super admin. */
  remaining: number
}

export interface QuotaCheckErr {
  ok: false
  reason: 'no_auth' | 'feature_unavailable' | 'limit_reached'
  message: string
  limit: number
}

export type QuotaCheckResult = QuotaCheckOk | QuotaCheckErr

interface CheckOpts {
  lang?: 'tr' | 'en'
}

export async function checkAIQuota(
  actionType: AIActionType,
  opts: CheckOpts = {}
): Promise<QuotaCheckResult> {
  const lang = opts.lang ?? 'tr'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      reason: 'no_auth',
      message: lang === 'en' ? 'Session required.' : 'Oturum gerekli.',
      limit: 0,
    }
  }

  const superAdmin = isSuperAdmin(user)

  // Single JOIN: workspace_members → workspaces eliminates a serial round-trip.
  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, nmm_workspaces!nmm_workspace_members_workspace_id_fkey(license_type, license_expires_at, created_at)')
    .eq('user_id', user.id)
    .maybeSingle()

  let licenseType = 'free'
  let licenseExpiresAt: string | null = null
  let workspaceCreatedAt: string | null = null
  if (membership) {
    const ws = Array.isArray(membership.nmm_workspaces)
      ? membership.nmm_workspaces[0]
      : membership.nmm_workspaces
    if (ws) {
      licenseType = ws.license_type ?? 'free'
      licenseExpiresAt = ws.license_expires_at ?? null
      workspaceCreatedAt = ws.created_at ?? null
      if (licenseType !== 'free' && licenseExpiresAt && new Date(licenseExpiresAt) < new Date()) {
        licenseType = 'free'
      }
    }
  }

  const effectiveLicense = getEffectiveLicenseType(
    licenseType,
    licenseExpiresAt,
    workspaceCreatedAt
  )
  const limits = getLimitsForLicense(
    licenseType,
    superAdmin,
    licenseExpiresAt,
    workspaceCreatedAt
  )
  const limit = limits.dailyLimit

  // Deneme süresi bittiğinde veya ücretsiz planda YZ tamamen kilitli; sayfalar açık kalır.
  if (!superAdmin && (effectiveLicense === 'free' || limit === 0)) {
    return {
      ok: false,
      reason: 'feature_unavailable',
      message: lang === 'en'
        ? 'Choose a Basic, Plus, or Pro plan to unlock AI features again.'
        : 'Yapay zeka özelliklerini yeniden açmak için Basic, Plus veya Pro plan seçin.',
      limit: 0,
    }
  }

  let used = 0
  if (!superAdmin) {
    const dayStartIso = istanbulDayStartIso(todayCalendarKey())

    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .gte('created_at', dayStartIso)

    used = count ?? 0

    if (used >= limit) {
      return {
        ok: false,
        reason: 'limit_reached',
        message: lang === 'en'
          ? `You have reached your daily limit of ${limit} AI messages. Try again tomorrow.`
          : `Günlük ${limit} yapay zeka mesajı limitinize ulaştınız. Yarın tekrar deneyin.`,
        limit,
      }
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    isSuperAdmin: superAdmin,
    workspaceId: membership?.workspace_id ?? null,
    licenseType: effectiveLicense,
    limit,
    used,
    remaining: superAdmin ? Infinity : limit - used - 1,
  }
}

/**
 * `checkAIQuota` sonucundan doğrudan kullanım kaydı atar — tekrarlayan
 * `workspaceId/userId/dailyLimit` türetmesini tek yerde toplar. Kota kapısı
 * (`checkAIQuota`) + kullanım kaydı ikilisini eşleştirmenin ergonomik yolu:
 * `dailyLimit = isSuperAdmin ? null : limit` (atomik limit-farkında insert) buradan
 * gelir, böylece çağıran sahalar bu kritik satırı yanlış yazamaz.
 */
export async function logAIGenerationFromQuota(
  quota: QuotaCheckOk,
  opts: {
    note: AIActionType
    candidateId?: string | null
    noteTr?: string | null
    aiModel?: string | null
  },
): Promise<void> {
  await logAIGeneration({
    workspaceId: quota.workspaceId,
    userId: quota.user.id,
    note: opts.note,
    candidateId: opts.candidateId ?? null,
    noteTr: opts.noteTr ?? null,
    aiModel: opts.aiModel ?? null,
    dailyLimit: quota.isSuperAdmin ? null : quota.limit,
  })
}

/**
 * Çeviri maliyet kaydı — kullanıcı kotasını TÜKETMEZ (`ai_count`/`nmm_daily_actions`'a
 * yazmaz), yalnız süper-admin maliyet panosu için `translate_count` sayacını artırır
 * (`p_kind='translate'`). CLAUDE.md Dil Politikası: TR|||EN kalıcı çeviri altyapısaldır,
 * kotaya yazılmaz; fail-safe — sayaç hatası kayıt akışını bloklamaz. `workspaceId` opsiyonel
 * (per-kullanıcı maliyet için `userId` yeterli; RPC null workspace'i tolere eder).
 */
export async function logAITranslation(params: {
  userId: string
  workspaceId?: string | null
}): Promise<void> {
  const supabase = await createClient()
  try {
    await supabase.rpc('nmm_increment_ai_usage_daily', {
      p_user_id: params.userId,
      p_workspace_id: params.workspaceId ?? null,
      p_usage_date: todayCalendarKey(),
      p_kind: 'translate',
    })
  } catch (err) {
    console.error('[logAITranslation] increment failed:', err)
  }
}

/** Logs a successful AI generation to `nmm_daily_actions`. No-op if workspace unknown. */
export async function logAIGeneration(params: {
  workspaceId: string | null
  userId: string
  note: AIActionType
  candidateId?: string | null
  /** Optional metadata stored in note_tr — does not affect quota counting. */
  noteTr?: string | null
  /** Gemini model id — süper admin maliyet paneli. */
  aiModel?: string | null
  /**
   * Günlük AI limiti — verilirse insert atomik+limit-farkında yapılır (O-1: yarış
   * kapatma). `null`/undefined → limitsiz (süper admin) → düz insert. `checkAIQuota`
   * sonucundan: `quota.isSuperAdmin ? null : quota.limit`.
   */
  dailyLimit?: number | null
}): Promise<void> {
  if (!params.workspaceId) return
  const supabase = await createClient()

  // Süper admin / limitsiz akış — düz insert (mevcut davranış).
  const plainInsert = () =>
    supabase.from('nmm_daily_actions').insert({
      workspace_id: params.workspaceId!,
      user_id: params.userId,
      candidate_id: params.candidateId ?? null,
      action_type: 'ai_generate' as const,
      note: params.note,
      ...(params.noteTr ? { note_tr: params.noteTr } : {}),
      ...(params.aiModel ? { ai_model: params.aiModel } : {}),
    })

  try {
    let counted = true

    if (typeof params.dailyLimit === 'number' && Number.isFinite(params.dailyLimit)) {
      // Atomik limit-farkında insert: per-kullanıcı advisory-lock ile count+insert
      // tek seri bölgede → eşzamanlı sekme/çift-tık sayımı limiti aşamaz.
      const dayStartIso = istanbulDayStartIso(todayCalendarKey())
      const { data, error } = await supabase.rpc('nmm_insert_ai_action_if_under_limit', {
        p_user_id: params.userId,
        p_workspace_id: params.workspaceId,
        p_candidate_id: params.candidateId ?? null,
        p_note: params.note,
        p_note_tr: params.noteTr ?? null,
        p_ai_model: params.aiModel ?? null,
        p_day_start: dayStartIso,
        p_limit: params.dailyLimit,
      })
      if (error) {
        // Fail-open: RPC yoksa (migration uygulanmadan deploy) veya erişilemezse
        // düz insert'e düş — kota asla ödeyen kullanıcıyı kilitlemez.
        console.error('[logAIGeneration] atomic reserve failed, düz insert:', error)
        await plainInsert()
      } else {
        // false → limit dolu (eşzamanlı yarışta diğer istek doldurdu): sayma.
        counted = data === true
      }
    } else {
      await plainInsert()
    }

    if (counted) {
      // İstanbul günü — kota penceresi (dayStartIso) ile tutarlı olmalı.
      await supabase.rpc('nmm_increment_ai_usage_daily', {
        p_user_id: params.userId,
        p_workspace_id: params.workspaceId,
        p_usage_date: todayCalendarKey(),
        p_kind: 'ai',
      })
    }
  } catch (err) {
    console.error('[logAIGeneration] insert failed:', err)
  }
}
