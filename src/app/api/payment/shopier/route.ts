import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

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
    
    // Get Shopier Secret from env or fallback to a default test key if none
    const apiSecret = process.env.SHOPIER_API_SECRET || 'shopier_test_secret_key'
    
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
    
    // Extract workspaceId from platform_order_id (formatted as workspaceId_timestamp)
    const parts = platform_order_id.split('_')
    const workspaceId = parts[0]
    
    if (!workspaceId || workspaceId.length < 10) {
      console.error('[Shopier Webhook] Invalid workspace ID format in order_id:', platform_order_id)
      return NextResponse.json({ error: 'Invalid order id format' }, { status: 400 })
    }
    
    // supabase admin client using service role key to bypass row level security (RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Fetch current license details
    const { data: ws, error: wsError } = await supabase
      .from('nmm_workspaces')
      .select('license_expires_at, license_type')
      .eq('id', workspaceId)
      .single()
      
    if (wsError || !ws) {
      console.error('[Shopier Webhook] Workspace not found in DB:', workspaceId, wsError)
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }
    
    // Determine license type and duration based on payment amount:
    const amountVal = Math.round(parseFloat(total_amount))
    let newLicenseType: 'leader' | 'master' | 'pro' = 'leader'
    let daysToAdd = 30

    // Match exact sweet-spot amounts or apply robust fallbacks
    if (amountVal === 399) {
      newLicenseType = 'leader'
      daysToAdd = 30
    } else if (amountVal === 1199) {
      newLicenseType = 'master'
      daysToAdd = 30
    } else if (amountVal === 2499) {
      newLicenseType = 'pro'
      daysToAdd = 30
    } else if (amountVal === 3499) {
      newLicenseType = 'leader'
      daysToAdd = 365
    } else if (amountVal === 9999) {
      newLicenseType = 'master'
      daysToAdd = 365
    } else if (amountVal === 19999) {
      newLicenseType = 'pro'
      daysToAdd = 365
    } else {
      // Fallbacks
      if (amountVal >= 15000) {
        newLicenseType = 'pro'
        daysToAdd = 365
      } else if (amountVal >= 8000) {
        newLicenseType = 'master'
        daysToAdd = 365
      } else if (amountVal >= 3000) {
        newLicenseType = 'leader'
        daysToAdd = 365
      } else if (amountVal >= 2000) {
        newLicenseType = 'pro'
        daysToAdd = 30
      } else if (amountVal >= 1000) {
        newLicenseType = 'master'
        daysToAdd = 30
      } else {
        newLicenseType = 'leader'
        daysToAdd = 30
      }
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
    
    // Fetch leader's email and details to send invoice/success notification email
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
          
          const { sendPaymentSuccessEmail } = require('@/lib/mail')
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
