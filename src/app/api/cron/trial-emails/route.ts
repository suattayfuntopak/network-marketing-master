import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFreeTrialRecipients } from '@/lib/infra/cronTrialRecipients'
import { sendTrialLifecycleEmail, type TrialEmailKind } from '@/lib/infra/trialEmails'

const JOBS: { kind: TrialEmailKind; offsetDays: number }[] = [
  { kind: 'trial_3d', offsetDays: 3 },
  { kind: 'trial_1d', offsetDays: 1 },
  { kind: 'trial_ended', offsetDays: -1 },
  { kind: 'trial_15d', offsetDays: -15 },
]

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: { kind: TrialEmailKind; email: string; sent: boolean }[] = []

  for (const job of JOBS) {
    const recipients = await fetchFreeTrialRecipients(supabase, job.offsetDays)

    for (const r of recipients) {
      const sent = await sendTrialLifecycleEmail(r.email, r.name, job.kind, 'tr')
      results.push({ kind: job.kind, email: r.email, sent })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
