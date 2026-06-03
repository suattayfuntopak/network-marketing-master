import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { claimEmailSend } from '@/lib/infra/emailSentLog'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import { fetchFreeTrialRecipients } from '@/lib/infra/cronTrialRecipients'
import { sendTrialLifecycleEmail, type TrialEmailKind } from '@/lib/infra/trialEmails'

const JOBS: { kind: TrialEmailKind; offsetDays: number }[] = [
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

      const sent = await sendTrialLifecycleEmail(r.email, r.name, job.kind, r.lang)
      results.push({ kind: job.kind, email: r.email, sent })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
