import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentSuccessEmail, sendUnresolvedOrderAlertEmail } from '@/lib/infra/mail'
import { verifyShopierSignature, parseShopierOrderId } from '@/lib/domain/shopierWebhook'
import {
  getShopierOsbCredentials,
  parseShopierOsbPayload,
  resolveOrderFromOsb,
  verifyShopierOsbHash,
} from '@/lib/domain/shopierOsb'
import {
  extractOrderFields,
  extractOrderId,
  collectIdCandidates,
  verifyShopierWebhookSignature,
} from '@/lib/domain/shopierOrderWebhook'
import {
  extractWorkspaceIdFromNote,
  resolvePlanFromProductId,
} from '@/lib/domain/shopierStorefront'
import { isSuperAdmin } from '@/lib/domain/auth'
import type { PlanId } from '@/lib/domain/pricing'

/**
 * Çözülemeyen siparişi Platform Yönetimi'nde göstermek için DB'ye yazar
 * (idempotent — order_id PK; mevcut satır 'applied' ise dokunmaz).
 */
async function recordUnresolvedOrder(params: {
  orderId: string | null
  note: string | null
  productId: string | null
}): Promise<void> {
  if (!params.orderId) return
  try {
    const supabase = createAdminClient()
    await supabase.from('nmm_shopier_processed_orders').upsert(
      {
        order_id: params.orderId,
        status: 'unresolved',
        note: params.note,
        product_id: params.productId,
      },
      { onConflict: 'order_id', ignoreDuplicates: true }
    )
  } catch (err) {
    console.error('[Shopier] recordUnresolvedOrder failed (non-fatal):', err)
  }
}

async function applyLicenseUpgrade(params: {
  workspaceId: string
  newLicenseType: PlanId
  daysToAdd: number
  totalAmount: string
  parentId: string | null
  /** Shopier sipariş id'si — idempotency (aynı sipariş tekrar gelirse atla). */
  orderId?: string | null
}): Promise<Date | null> {
  const supabase = createAdminClient()

  // Idempotency: aynı Shopier siparişi ikinci kez lisans uzatmasın.
  if (params.orderId) {
    const { error: claimErr } = await supabase.from('nmm_shopier_processed_orders').insert({
      order_id: params.orderId,
      workspace_id: params.workspaceId,
      plan: params.newLicenseType,
      amount: params.totalAmount,
    })
    if (claimErr) {
      if (claimErr.code === '23505') {
        console.info('[Shopier] order already processed, skipping', params.orderId)
        return null
      }
      // Dedupe tablosu hatası lisansı bloklamasın (sadece logla).
      console.error('[Shopier] dedupe insert error (non-fatal):', claimErr.message)
    }
  }

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
      // Süper admin'e (uygulama sahibi, test/override) ödeme maili gönderme; gerçek müşterilere gider.
      if (authUser?.user?.email && !isSuperAdmin({ email: authUser.user.email })) {
        sendPaymentSuccessEmail(
          authUser.user.email,
          leaderMember.full_name || authUser.user.user_metadata?.full_name || 'Değerli Ortak',
          params.newLicenseType,
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

  const osbExpiry = await applyLicenseUpgrade({
    workspaceId: parsed.workspaceId,
    newLicenseType: parsed.plan,
    daysToAdd: parsed.daysToAdd,
    totalAmount: String(payload.price ?? ''),
    parentId: null,
    orderId: payload.orderid,
  })

  if (!osbExpiry) {
    console.info(`[Shopier OSB] Already processed for workspace ${parsed.workspaceId}`)
    return new NextResponse('already-processed', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
  console.info(`[Shopier OSB] License updated for workspace ${parsed.workspaceId}`)
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

  // Non-PII log: alıcı bilgileri (e-posta/telefon/ad) loglanmaz.
  console.info('[Shopier order.created] received', {
    event,
    webhookId: request.headers.get('shopier-webhook-id'),
  })

  // İmza: HS256, ham gövde → hex. DİKKAT: her webhook'un AYRI secret'ı var (Shopier
  // kayıt cevabındaki `token`). order.created → SHOPIER_WEBHOOK_SECRET;
  // refund.updated → SHOPIER_REFUND_WEBHOOK_SECRET.
  //
  // GÜVENLİK: secret yoksa FAIL-CLOSED. order.created imzasız işlenirse saldırgan
  // sahte JSON ile bedava lisans alabilir; bu yüzden secret eksikse 500 döner.
  // SHOPIER_WEBHOOK_VERIFY=false yalnız geliştirme/ilk-test için bir kaçış kapısıdır
  // ve production'da kabul edilmez (orada zorla 500 döner).
  const isRefund = event === 'refund.updated'
  const secret = isRefund
    ? process.env.SHOPIER_REFUND_WEBHOOK_SECRET
    : process.env.SHOPIER_WEBHOOK_SECRET
  const verifyDisabled = process.env.SHOPIER_WEBHOOK_VERIFY === 'false'
  const isProd =
    process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

  if (verifyDisabled && isProd) {
    // Doğrulama kapatma anahtarı prod'da bir yapılandırma hatasıdır → işleme.
    console.error('[Shopier] SHOPIER_WEBHOOK_VERIFY=false production\'da kabul edilmez')
    return new NextResponse('verification required', { status: 500 })
  }

  if (verifyDisabled) {
    // Yalnız prod-dışı: imza doğrulaması bilinçli atlanıyor.
    console.warn('[Shopier] imza doğrulaması atlandı (SHOPIER_WEBHOOK_VERIFY=false, prod değil)')
  } else if (!secret) {
    if (isRefund) {
      // İade lisans düşürme kritik → secret yoksa doğrulayamayız, GÜVENLİ TARAF: işleme.
      console.warn('[Shopier refund] secret yok, iade işlenmedi (SHOPIER_REFUND_WEBHOOK_SECRET ekleyin)')
      return NextResponse.json({ received: true, refunded: false, reason: 'no-secret' })
    }
    // order.created: secret yoksa imzasız lisans verme — FAIL-CLOSED.
    console.error('[Shopier] SHOPIER_WEBHOOK_SECRET tanımsız — webhook imzasız işlenemez')
    return new NextResponse('server misconfigured: webhook secret missing', { status: 500 })
  } else if (!verifyShopierWebhookSignature(raw, signature, secret, timestamp)) {
    console.warn('[Shopier] signature mismatch', { event })
    return new NextResponse('invalid signature', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    return new NextResponse('invalid json', { status: 400 })
  }

  // İade tamamlandı → lisansı düşür. (refund.requested = sadece talep; erken düşürme yapma.)
  if (event === 'refund.updated') {
    return handleRefundWebhook(payload, event)
  }
  if (event === 'refund.requested') {
    console.info('[Shopier refund] requested (refund.updated bekleniyor, aksiyon yok)')
    return NextResponse.json({ received: true })
  }
  // Yalnız order.created işlenir (başka event header'ı gelirse yok say).
  if (event && event !== 'order.created') {
    return NextResponse.json({ received: true, ignored: event })
  }

  const { note, productId } = extractOrderFields(payload)
  const orderId = extractOrderId(payload)
  const workspaceId = extractWorkspaceIdFromNote(note)
  const resolved = productId ? resolvePlanFromProductId(productId) : null

  if (!workspaceId || !resolved) {
    // 200 dön ki Shopier sürekli retry etmesin; eksikleri log'dan tamamlayacağız.
    const reason = !workspaceId
      ? 'note → workspaceId çözülemedi'
      : 'productId → plan çözülemedi'
    console.warn('[Shopier order.created] unresolved', {
      note,
      productId,
      hasWorkspace: !!workspaceId,
      hasPlan: !!resolved,
    })
    // KRİTİK: order.created = gerçek bir sipariş. Eşleşmezse müşteri ödemiş ama
    // lisans alamamış olabilir → (a) süper admin'e e-posta, (b) Platform
    // Yönetimi'nde görünmesi için DB'ye yaz (idempotent). Sessiz başarısızlık yok.
    await recordUnresolvedOrder({ orderId, note, productId })
    sendUnresolvedOrderAlertEmail({ orderId, note, productId, reason }).catch((err) => {
      console.error('[Shopier order.created] unresolved alert email failed:', err)
    })
    return NextResponse.json({ received: true, applied: false })
  }

  const newExpiry = await applyLicenseUpgrade({
    workspaceId,
    newLicenseType: resolved.plan,
    daysToAdd: resolved.daysToAdd,
    totalAmount: '',
    parentId: null,
    orderId,
  })

  if (!newExpiry) {
    // Idempotency: bu sipariş daha önce işlenmiş → tekrar uzatma.
    return NextResponse.json({ received: true, applied: false, duplicate: true })
  }

  console.info(
    `[Shopier order.created] License updated for workspace ${workspaceId} (${resolved.plan}) until ${newExpiry.toISOString()}`
  )
  return NextResponse.json({ received: true, applied: true })
}

/**
 * Shopier iade (refund) webhook'u → ilgili siparişin workspace'inin lisansını düşürür.
 * Refund payload alan adları kesin değil; işlenmiş sipariş id'leriyle kesişim kurularak
 * doğru workspace bulunur (collectIdCandidates). Eşleşme yoksa non-PII özet loglanır.
 */
async function handleRefundWebhook(payload: unknown, event: string) {
  const supabase = createAdminClient()
  const candidates = collectIdCandidates(payload)
  if (candidates.length === 0) {
    console.warn('[Shopier refund] no id candidates', { event })
    return NextResponse.json({ received: true, refunded: false })
  }

  const { data: orders } = await supabase
    .from('nmm_shopier_processed_orders')
    .select('order_id, workspace_id')
    .in('order_id', candidates)
    .eq('status', 'applied')

  if (!orders || orders.length === 0) {
    console.warn('[Shopier refund] no matching applied order', { event, candidateCount: candidates.length })
    return NextResponse.json({ received: true, refunded: false })
  }

  for (const o of orders) {
    if (!o.workspace_id) continue
    await supabase
      .from('nmm_workspaces')
      .update({ license_type: 'free', license_expires_at: null })
      .eq('id', o.workspace_id)
    await supabase
      .from('nmm_shopier_processed_orders')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('order_id', o.order_id)
    console.info('[Shopier refund] license revoked', { orderId: o.order_id, workspaceId: o.workspace_id })
  }
  return NextResponse.json({ received: true, refunded: true, count: orders.length })
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
      orderId: platform_order_id,
    })

    if (!newExpiry) {
      return NextResponse.json({ success: true, message: 'Already processed', duplicate: true })
    }

    console.info(
      `[Shopier Webhook] Success! Workspace ${parsed.workspaceId} until ${newExpiry.toISOString()}`
    )
    return NextResponse.json({ success: true, message: 'License updated successfully' })
  } catch (err: unknown) {
    console.error('[Shopier] Exception:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}
