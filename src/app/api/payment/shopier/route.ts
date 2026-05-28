import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentSuccessEmail } from '@/lib/infra/mail'

export async function POST(request: NextRequest) {
  try {
    // Shopier sends form-urlencoded data
    const formData = await request.formData()
    
    const platform_order_id = formData.get('platform_order_id')?.toString() || ''
    const random_number = formData.get('random_number')?.toString() || ''
    const status = formData.get('status')?.toString() || ''
    const total_amount = formData.get('total_amount')?.toString() || ''
    const signature = formData.get('signature')?.toString() || ''
    
    // Verify parameters exist
    if (!platform_order_id || !random_number || !status || !total_amount || !signature) {
      console.warn('[Shopier Webhook] Missing parameters:', { platform_order_id, random_number, status, total_amount, signature })
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }
    
    // Shopier secret must come from env — no fallback. A hardcoded fallback
    // would let anyone with knowledge of the constant forge signed webhooks.
    const apiSecret = process.env.SHOPIER_API_SECRET
    if (!apiSecret) {
      console.error('[Shopier Webhook] SHOPIER_API_SECRET is not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Verify signature to prevent fake webhook attacks
    const signatureData = platform_order_id + random_number + total_amount + status
    const expectedSignature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureData)
      .digest('base64')

    if (signature !== expectedSignature) {
      console.warn('[Shopier Webhook] Invalid signature received:', { received: signature, expected: expectedSignature })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (status.toLowerCase() !== 'success') {
      console.log('[Shopier Webhook] Payment not successful, status:', status)
      return NextResponse.json({ message: 'Payment status is not success' }, { status: 200 })
    }

    // platform_order_id format (set during initiation): `<workspaceId>_<plan>_<period>_<timestamp>`.
    // License type and duration are read from the signed order_id, not from
    // total_amount — currency drift or price changes can't grant the wrong tier.
    const parts = platform_order_id.split('_')
    if (parts.length < 4) {
      console.error('[Shopier Webhook] Invalid order_id format (expected <ws>_<plan>_<period>_<ts>):', platform_order_id)
      return NextResponse.json({ error: 'Invalid order id format' }, { status: 400 })
    }
    const workspaceId = parts[0]
    const plan = parts[1]
    const period = parts[2]

    const VALID_PLANS = ['leader', 'master', 'pro'] as const
    const VALID_PERIODS = ['monthly', 'yearly'] as const
    type Plan = (typeof VALID_PLANS)[number]
    type Period = (typeof VALID_PERIODS)[number]

    if (!workspaceId || workspaceId.length < 10) {
      console.error('[Shopier Webhook] Invalid workspace ID in order_id:', platform_order_id)
      return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 })
    }
    if (!VALID_PLANS.includes(plan as Plan) || !VALID_PERIODS.includes(period as Period)) {
      console.error('[Shopier Webhook] Invalid plan/period in order_id:', { plan, period, platform_order_id })
      return NextResponse.json({ error: 'Invalid plan or period' }, { status: 400 })
    }

    const newLicenseType = plan as Plan
    const daysToAdd = (period as Period) === 'yearly' ? 365 : 30

    // supabase admin client using service role key to bypass row level security (RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch current license details
    const { data: ws, error: wsError } = await supabase
      .from('nmm_workspaces')
      .select('license_expires_at, license_type, parent_id')
      .eq('id', workspaceId)
      .single()

    if (wsError || !ws) {
      console.error('[Shopier Webhook] Workspace not found in DB:', workspaceId, wsError)
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }
    
    // Calculate new expiry (from current expiry if in the future, or today if expired)
    const currentExpiry = ws.license_expires_at ? new Date(ws.license_expires_at) : new Date()
    const now = new Date()
    
    const baseDate = currentExpiry > now ? currentExpiry : now
    const newExpiry = new Date(baseDate)
    newExpiry.setDate(newExpiry.getDate() + daysToAdd)
    
    const { error: updateError } = await supabase
      .from('nmm_workspaces')
      .update({
        license_type: newLicenseType,
        license_expires_at: newExpiry.toISOString()
      })
      .eq('id', workspaceId)
      
    if (updateError) {
      console.error('[Shopier Webhook] Failed to update workspace license:', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
    
    // Referral bonus: extend upline (parent) workspace license by 7 days
    if (ws.parent_id) {
      try {
        const { data: parentWs } = await supabase
          .from('nmm_workspaces')
          .select('license_expires_at, license_type')
          .eq('id', ws.parent_id)
          .maybeSingle()

        if (parentWs && parentWs.license_type !== 'free') {
          const parentExpiry = parentWs.license_expires_at ? new Date(parentWs.license_expires_at) : new Date()
          const parentBase = parentExpiry > now ? parentExpiry : now
          const parentNewExpiry = new Date(parentBase)
          parentNewExpiry.setDate(parentNewExpiry.getDate() + 7)

          await supabase
            .from('nmm_workspaces')
            .update({ license_expires_at: parentNewExpiry.toISOString() })
            .eq('id', ws.parent_id)

          console.log(`[Shopier Webhook] Referral bonus: +7 days added to parent workspace ${ws.parent_id}`)
        }
      } catch (refErr) {
        console.error('[Shopier Webhook] Referral bonus failed (non-critical):', refErr)
      }
    }

    // Fetch leader's email and send invoice/success notification email
    try {
      const { data: leaderMember } = await supabase
        .from('nmm_workspace_members')
        .select('user_id, full_name')
        .eq('workspace_id', workspaceId)
        .eq('role', 'leader')
        .maybeSingle()

      if (leaderMember) {
        const { data: authUser } = await supabase.auth.admin.getUserById(leaderMember.user_id)
        if (authUser?.user?.email) {
          const userEmail = authUser.user.email
          const userFullName = leaderMember.full_name || authUser.user.user_metadata?.full_name || 'Değerli Ortak'

          sendPaymentSuccessEmail(
            userEmail,
            userFullName,
            newLicenseType,
            total_amount,
            newExpiry.toISOString(),
            'tr'
          ).catch((err: any) => {
            console.error('[Shopier Webhook] Failed to send payment success email in background:', err)
          })
        }
      }
    } catch (mailErr) {
      console.error('[Shopier Webhook] Error resolving mail recipient or sending email:', mailErr)
    }

    console.log(`[Shopier Webhook] Success! Workspace ${workspaceId} upgraded to ${newLicenseType} until ${newExpiry.toISOString()}`)
    return NextResponse.json({ success: true, message: 'License updated successfully' })
    
  } catch (err: any) {
    console.error('[Shopier Webhook] Exception:', err)
    return NextResponse.json({ error: 'Internal server error', details: err?.message }, { status: 500 })
  }
}
