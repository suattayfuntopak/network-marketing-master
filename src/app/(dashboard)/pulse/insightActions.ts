'use server'

import { createClient } from '@/lib/supabase/server'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { isSuperAdmin } from '@/lib/domain/auth'
import { previousWeekStartKey } from '@/lib/domain/pulseRollup'
import { todayCalendarKey } from '@/lib/utils/calendarDates'

export type PulseWeeklyInsight = {
  weekStart: string
  scope: 'personal' | 'team'
  summary: string
  bullets: string[]
  riskFlags: string[]
  createdAt: string
}

async function assertMember(workspaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) return { supabase, user }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export async function getPulseWeeklyInsightAction(
  workspaceId: string,
  scope: 'personal' | 'team',
  lang: 'tr' | 'en'
): Promise<PulseWeeklyInsight | null> {
  const { supabase, user } = await assertMember(workspaceId)

  if (scope === 'team') {
    const { data: ws } = await supabase
      .from('nmm_workspaces')
      .select('license_type')
      .eq('id', workspaceId)
      .single()

    if (!hasTeamPulseAccess(ws?.license_type, isSuperAdmin(user))) {
      return null
    }
  }

  const weekStart = previousWeekStartKey(todayCalendarKey())

  const { data: row } = await supabase
    .from('nmm_pulse_weekly_summaries')
    .select(
      'week_start, scope, summary_tr, summary_en, bullets_tr, bullets_en, risk_flags, created_at'
    )
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('scope', scope)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (!row) {
    const { data: latest } = await supabase
      .from('nmm_pulse_weekly_summaries')
      .select(
        'week_start, scope, summary_tr, summary_en, bullets_tr, bullets_en, risk_flags, created_at'
      )
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .eq('scope', scope)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latest) return null
    return mapRow(latest, lang)
  }

  return mapRow(row, lang)
}

function mapRow(
  row: {
    week_start: string
    scope: string
    summary_tr: string
    summary_en: string
    bullets_tr: unknown
    bullets_en: unknown
    risk_flags: unknown
    created_at: string
  },
  lang: 'tr' | 'en'
): PulseWeeklyInsight {
  const bulletsRaw = lang === 'en' ? row.bullets_en : row.bullets_tr
  const bullets = Array.isArray(bulletsRaw)
    ? (bulletsRaw as string[]).filter(Boolean)
    : []

  const riskRaw = row.risk_flags
  const riskFlags = Array.isArray(riskRaw) ? (riskRaw as string[]).filter(Boolean) : []

  return {
    weekStart: row.week_start,
    scope: row.scope as 'personal' | 'team',
    summary: lang === 'en' ? row.summary_en : row.summary_tr,
    bullets,
    riskFlags,
    createdAt: row.created_at,
  }
}
