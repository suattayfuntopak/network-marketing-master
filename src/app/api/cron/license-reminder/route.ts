import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { claimEmailSend } from '@/lib/infra/emailSentLog'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import { sendLicenseExpiryEmail } from '@/lib/infra/mail'
import { normalizeLicenseType } from '@/lib/domain/aiUsage'

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const supabase = createAdminClient()
  const todayKey = todayCalendarKey()

  const now = new Date()
  const results: { email: string; days: number; sent: boolean; skipped?: boolean }[] = []

  for (const daysRemaining of [7, 3, 1]) {
    // Cron: sunucu-yerel gün penceresi (kasıtlı; metrik gün anahtarı değil).
    const targetStart = new Date(now)
    targetStart.setDate(targetStart.getDate() + daysRemaining)
    targetStart.setHours(0, 0, 0, 0)

    const targetEnd = new Date(targetStart)
    targetEnd.setHours(23, 59, 59, 999)

    const { data: workspaces, error } = await supabase
      .from('nmm_workspaces')
      .select('id, license_type, license_expires_at')
      .gte('license_expires_at', targetStart.toISOString())
      .lte('license_expires_at', targetEnd.toISOString())
      .in('license_type', ['basic', 'plus', 'pro'])

    if (error) {
      console.error(`[license-reminder] Error querying workspaces for ${daysRemaining}d:`, error)
      continue
    }

    for (const ws of workspaces ?? []) {
      try {
        const { data: member } = await supabase
          .from('nmm_workspace_members')
          .select('user_id, full_name')
          .eq('workspace_id', ws.id)
          .eq('role', 'leader')
          .maybeSingle()

        if (!member) continue
        if (!ws.license_expires_at) continue

        const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id)
        if (!authUser?.user?.email) continue

        const email = authUser.user.email
        const name = member.full_name || authUser.user.user_metadata?.full_name || 'Değerli Ortak'

        // Idempotency: aynı gün aynı workspace+gün-eşiği ikinci kez gönderilmez.
        const fresh = await claimEmailSend(supabase, ws.id, `license_${daysRemaining}d`, todayKey)
        if (!fresh) {
          results.push({ email, days: daysRemaining, sent: false, skipped: true })
          continue
        }

        const sent = await sendLicenseExpiryEmail(
          email,
          name,
          normalizeLicenseType(ws.license_type) as 'basic' | 'plus' | 'pro',
          ws.license_expires_at,
          daysRemaining,
          'tr'
        )

        results.push({ email, days: daysRemaining, sent })
      } catch (err) {
        console.error(`[license-reminder] Failed for workspace ${ws.id}:`, err)
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
