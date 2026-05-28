// Centralized AI quota + auth gate for server actions. Replaces the
// `getUser → membership → workspace → license expiry → count → compare`
// block previously duplicated across 7+ action files.

import { createClient } from '@/lib/supabase/server'
import { getLimitsForLicense } from '@/lib/aiUsage'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

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

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let licenseType = 'free'
  if (membership) {
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('license_type, license_expires_at')
      .eq('id', membership.workspace_id)
      .maybeSingle()
    if (ws) {
      const isExpired = ws.license_expires_at
        ? new Date(ws.license_expires_at) < new Date()
        : false
      licenseType = isExpired ? 'free' : (ws.license_type ?? 'free')
    }
  }

  const limits = getLimitsForLicense(licenseType, isSuperAdmin)
  const limit =
    actionType === 'roleplay' ? limits.roleplayLimit
    : actionType === 'compliance' ? limits.complianceLimit
    : limits.messageLimit

  // Compliance with limit === 0 means the feature is gated behind paid plans.
  if (!isSuperAdmin && actionType === 'compliance' && limit === 0) {
    return {
      ok: false,
      reason: 'feature_unavailable',
      message: lang === 'en'
        ? 'Compliance auditing requires a paid plan. Please upgrade to access this feature.'
        : 'Uyum denetimi özelliği ücretli planlarda kullanılabilir. Bu özelliğe erişmek için planınızı yükseltin.',
      limit: 0,
    }
  }

  let used = 0
  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let query = supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .gte('created_at', today.toISOString())

    if (actionType === 'roleplay') {
      query = query.eq('note', 'roleplay')
    } else if (actionType === 'compliance') {
      query = query.eq('note', 'compliance')
    } else {
      // message: null note is legacy (older rows) — count both
      query = query.or('note.is.null,note.eq.message')
    }

    const { count } = await query
    used = count ?? 0

    if (used >= limit) {
      const label =
        actionType === 'roleplay'
          ? (lang === 'en' ? 'roleplay' : 'prova')
          : actionType === 'compliance'
          ? (lang === 'en' ? 'compliance audit' : 'uyum denetleme')
          : (lang === 'en' ? 'message' : 'mesaj')
      return {
        ok: false,
        reason: 'limit_reached',
        message: lang === 'en'
          ? `You have reached your daily ${limit} ${label} limit. Try again tomorrow.`
          : `Günlük ${limit} ${label} limitinize ulaştınız. Yarın tekrar deneyin.`,
        limit,
      }
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    isSuperAdmin,
    workspaceId: membership?.workspace_id ?? null,
    licenseType,
    limit,
    used,
    remaining: isSuperAdmin ? Infinity : limit - used - 1,
  }
}

/** Logs a successful AI generation to `nmm_daily_actions`. No-op if workspace unknown. */
export async function logAIGeneration(params: {
  workspaceId: string | null
  userId: string
  note: AIActionType
  candidateId?: string | null
}): Promise<void> {
  if (!params.workspaceId) return
  const supabase = await createClient()
  try {
    await supabase.from('nmm_daily_actions').insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      candidate_id: params.candidateId ?? null,
      action_type: 'ai_generate' as const,
      note: params.note,
    })
  } catch (err) {
    console.error('[logAIGeneration] insert failed:', err)
  }
}
