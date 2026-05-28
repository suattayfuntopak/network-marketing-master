import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLicenseExpiryEmail } from '@/lib/infra/mail'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const results: { email: string; days: number; sent: boolean }[] = []

  for (const daysRemaining of [7, 3, 1]) {
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
      .in('license_type', ['leader', 'master', 'pro'])

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

        const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id)
        if (!authUser?.user?.email) continue

        const email = authUser.user.email
        const name = member.full_name || authUser.user.user_metadata?.full_name || 'Değerli Ortak'

        const sent = await sendLicenseExpiryEmail(
          email,
          name,
          ws.license_type as 'leader' | 'master' | 'pro',
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
