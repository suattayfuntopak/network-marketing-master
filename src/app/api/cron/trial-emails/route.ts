import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { claimEmailSend } from '@/lib/infra/emailSentLog'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import { fetchFreeTrialRecipients, fetchTrialUserStats } from '@/lib/infra/cronTrialRecipients'
import { sendTrialLifecycleEmail, type TrialEmailKind } from '@/lib/infra/trialEmails'
import { sendTrialLifecyclePush, shouldSendTrialPush } from '@/lib/infra/trialPush'

const JOBS: { kind: TrialEmailKind; offsetDays: number }[] = [
  // trial_mid: deneme günü ~7 = bitişe 7 gün kala (14 günlük deneme). Aktivasyon maili.
  { kind: 'trial_mid', offsetDays: 7 },
  { kind: 'trial_3d', offsetDays: 3 },
  { kind: 'trial_1d', offsetDays: 1 },
  { kind: 'trial_ended', offsetDays: -1 },
  { kind: 'trial_15d', offsetDays: -15 },
]

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const supabase = createAdminClient()
  const todayKey = todayCalendarKey()

  const results: { kind: TrialEmailKind; email: string; sent: boolean; skipped?: boolean }[] = []

  for (const job of JOBS) {
    const recipients = await fetchFreeTrialRecipients(supabase, job.offsetDays)

    for (const r of recipients) {
      // Idempotency: aynı gün aynı workspace+kind ikinci kez gönderilmez.
      const fresh = await claimEmailSend(supabase, r.workspaceId, job.kind, todayKey)
      if (!fresh) {
        results.push({ kind: job.kind, email: r.email, sent: false, skipped: true })
        continue
      }

      const stats = await fetchTrialUserStats(supabase, r.workspaceId)
      const sent = await sendTrialLifecycleEmail(r.email, r.name, job.kind, r.lang, stats, r.workspaceId)

      if (sent && shouldSendTrialPush(job.kind)) {
        const pushFresh = await claimEmailSend(supabase, r.workspaceId, `push_${job.kind}`, todayKey)
        if (pushFresh) {
          await sendTrialLifecyclePush(supabase, r.userId, job.kind)
        }
      }

      results.push({ kind: job.kind, email: r.email, sent })
    }
  }

  const sent = results.filter(r => r.sent).length
  const skipped = results.filter(r => r.skipped).length
  const byKind = JOBS.map(job => ({
    kind: job.kind,
    sent: results.filter(r => r.kind === job.kind && r.sent).length,
    skipped: results.filter(r => r.kind === job.kind && r.skipped).length,
  }))

  return NextResponse.json({ ok: true, processed: results.length, sent, skipped, byKind })
}
