import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPaymentSuccessEmail } from '@/lib/infra/mail'
import { verifyShopierSignature, parseShopierOrderId } from '@/lib/domain/shopierWebhook'
import {
  getShopierOsbCredentials,
  parseShopierOsbPayload,
  resolveOrderFromOsb,
  verifyShopierOsbHash,
} from '@/lib/domain/shopierOsb'
import {
  extractOrderFields,
  verifyShopierWebhookSignature,
} from '@/lib/domain/shopierOrderWebhook'
import {
  extractWorkspaceIdFromNote,
  resolvePlanFromProductId,
} from '@/lib/domain/shopierStorefront'

async function applyLicenseUpgrade(params: {
  workspaceId: string
  newLicenseType: string
  daysToAdd: number
  totalAmount: string
  parentId: string | null
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ws, error: wsError } = await supabase
    .from('nmm_workspaces')
    .select('license_expires_at, license_type, parent_id')
    .eq('id', params.workspaceId)
    .single()

  if (wsError || !ws) {
    throw new Error('Workspace not found')
  }

  const currentExpiry = ws.license_expires_at ? new Date(ws.license_expires_at) : new Date()
  const now = new Date()
  const baseDate = currentExpiry > now ? currentExpiry : now
  const newExpiry = new Date(baseDate)
  newExpiry.setDate(newExpiry.getDate() + params.daysToAdd)

  const { error: updateError } = await supabase
    .from('nmm_workspaces')
    .update({
      license_type: params.newLicenseType,
      license_expires_at: newExpiry.toISOString(),
    })
    .eq('id', params.workspaceId)

  if (updateError) {
    throw new Error('Database update failed')
  }

  if (ws.parent_id) {
    try {
      const { data: parentWs } = await supabase
        .from('nmm_workspaces')
        .select('license_expires_at, license_type')
        .eq('id', ws.parent_id)
        .maybeSingle()

      if (parentWs && parentWs.license_type !== 'free') {
        const parentExpiry = parentWs.license_expires_at
          ? new Date(parentWs.license_expires_at)
          : new Date()
        const parentBase = parentExpiry > now ? parentExpiry : now
        const parentNewExpiry = new Date(parentBase)
        parentNewExpiry.setDate(parentNewExpiry.getDate() + 7)

        await supabase
          .from('nmm_workspaces')
          .update({ license_expires_at: parentNewExpiry.toISOString() })
          .eq('id', ws.parent_id)
      }
    } catch (refErr) {
      console.error('[Shopier] Referral bonus failed (non-critical):', refErr)
    }
  }

  try {
    const { data: leaderMember } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name')
      .eq('workspace_id', params.workspaceId)
      .eq('role', 'leader')
      .maybeSingle()

    if (leaderMember) {
      const { data: authUser } = await supabase.auth.admin.getUserById(leaderMember.user_id)
      if (authUser?.user?.email) {
        sendPaymentSuccessEmail(
          authUser.user.email,
          leaderMember.full_name || authUser.user.user_metadata?.full_name || 'Değerli Ortak',
          params.newLicenseType as 'leader' | 'master' | 'pro',
          params.totalAmount,
          newExpiry.toISOString(),
          'tr'
        ).catch((err: unknown) => {
          console.error('[Shopier] payment success email failed:', err)
        })
      }
    }
  } catch (mailErr) {
    console.error('[Shopier] mail recipient error:', mailErr)
  }

  return newExpiry
}

/** Shopier OSB (Otomatik Sipariş Bildirimi) — res + hash payload */
async function handleOsbNotification(res: string, hash: string) {
  const credentials = getShopierOsbCredentials()
  if (!verifyShopierOsbHash(res, hash, credentials)) {
    console.warn('[Shopier OSB] Invalid hash')
    return new NextResponse('invalid', { status: 401 })
  }

  const payload = parseShopierOsbPayload(res)
  if (!payload?.orderid) {
    console.warn('[Shopier OSB] Missing orderid in payload')
    return new NextResponse('invalid payload', { status: 400 })
  }

  const parsed = resolveOrderFromOsb(payload)
  if (!parsed) {
    console.error('[Shopier OSB] Unparseable orderid:', payload.orderid)
    return new NextResponse('invalid order', { status: 400 })
  }

  await applyLicenseUpgrade({
    workspaceId: parsed.workspaceId,
    newLicenseType: parsed.plan,
    daysToAdd: parsed.daysToAdd,
    totalAmount: String(payload.price ?? ''),
    parentId: null,
  })

  console.log(`[Shopier OSB] License updated for workspace ${parsed.workspaceId}`)
  return new NextResponse('success', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

/**
 * Shopier `order.created` REST webhook'u (dükkan-yönlendirme modeli).
 * note → workspaceId ("kime"); productId → plan/süre (güvenli tier kaynağı).
 *
 * KEŞİF FAZI: payload alan adları kesinleşene dek ham gövde + header'lar loglanır.
 * SHOPIER_WEBHOOK_SECRET set ise HS256 imza doğrulanır (SHOPIER_WEBHOOK_VERIFY=false
 * ile geçici bypass — sadece ilk test webhook'larını görmek için).
 */
async function handleOrderCreatedWebhook(request: NextRequest) {
  const raw = await request.text()
  const signature = request.headers.get('shopier-signature')
  const event = request.headers.get('shopier-event')
  const timestamp = request.headers.get('shopier-timestamp')

  // Keşif: gerçek payload + header'ları gör (alan adlarını buradan kilitleyeceğiz).
  console.info('[Shopier order.created] received', {
    event,
    timestamp,
    webhookId: request.headers.get('shopier-webhook-id'),
    bodyPreview: raw.slice(0, 4000),
  })

  const secret = process.env.SHOPIER_WEBHOOK_SECRET
  if (secret && process.env.SHOPIER_WEBHOOK_VERIFY !== 'false') {
    if (!verifyShopierWebhookSignature(raw, signature, secret, timestamp)) {
      console.warn('[Shopier order.created] signature mismatch')
      return new NextResponse('invalid signature', { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('invalid json', { status: 400 })
  }

  // Yalnız order.created işlenir (başka event header'ı gelirse yok say).
  if (event && event !== 'order.created') {
    return NextResponse.json({ received: true, ignored: event })
  }

  const { note, productId } = extractOrderFields(payload)
  const workspaceId = extractWorkspaceIdFromNote(note)
  const resolved = productId ? resolvePlanFromProductId(productId) : null

  if (!workspaceId || !resolved) {
    // 200 dön ki Shopier sürekli retry etmesin; eksikleri log'dan tamamlayacağız.
    console.warn('[Shopier order.created] unresolved', {
      note,
      productId,
      hasWorkspace: !!workspaceId,
      hasPlan: !!resolved,
    })
    return NextResponse.json({ received: true, applied: false })
  }

  const newExpiry = await applyLicenseUpgrade({
    workspaceId,
    newLicenseType: resolved.plan,
    daysToAdd: resolved.daysToAdd,
    totalAmount: '',
    parentId: null,
  })

  console.log(
    `[Shopier order.created] License updated for workspace ${workspaceId} (${resolved.plan}) until ${newExpiry.toISOString()}`
  )
  return NextResponse.json({ received: true, applied: true })
}

export async function POST(request: NextRequest) {
  try {
    // order.created REST webhook'u JSON gönderir; OSB/api_pay4 ise form-encoded.
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return await handleOrderCreatedWebhook(request)
    }

    const formData = await request.formData()

    const osbRes = formData.get('res')?.toString()
    const osbHash = formData.get('hash')?.toString()
    if (osbRes && osbHash) {
      return handleOsbNotification(osbRes, osbHash)
    }

    const platform_order_id = formData.get('platform_order_id')?.toString() || ''
    const random_number = formData.get('random_number')?.toString() || ''
    const status = formData.get('status')?.toString() || ''
    const total_amount = formData.get('total_amount')?.toString() || ''
    const signature = formData.get('signature')?.toString() || ''

    if (!platform_order_id || !random_number || !status || !total_amount || !signature) {
      console.warn('[Shopier Webhook] Missing parameters')
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const apiSecret = process.env.SHOPIER_API_SECRET
    if (!apiSecret) {
      console.error('[Shopier Webhook] SHOPIER_API_SECRET is not configured')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const validSignature = verifyShopierSignature(
      { platform_order_id, random_number, total_amount, status, signature },
      apiSecret
    )
    if (!validSignature) {
      console.warn('[Shopier Webhook] Invalid signature for order:', platform_order_id)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    if (status.toLowerCase() !== 'success') {
      return NextResponse.json({ message: 'Payment status is not success' }, { status: 200 })
    }

    const parsed = parseShopierOrderId(platform_order_id)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid order id format' }, { status: 400 })
    }

    const newExpiry = await applyLicenseUpgrade({
      workspaceId: parsed.workspaceId,
      newLicenseType: parsed.plan,
      daysToAdd: parsed.daysToAdd,
      totalAmount: total_amount,
      parentId: null,
    })

    console.log(
      `[Shopier Webhook] Success! Workspace ${parsed.workspaceId} until ${newExpiry.toISOString()}`
    )
    return NextResponse.json({ success: true, message: 'License updated successfully' })
  } catch (err: unknown) {
    console.error('[Shopier] Exception:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
