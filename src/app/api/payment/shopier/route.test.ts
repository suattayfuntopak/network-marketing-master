import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

// Yapılandırılabilir mock durumu (vi.mock hoisted olduğundan vi.hoisted ile paylaşılır).
const h = vi.hoisted(() => ({
  // applyLicenseUpgrade dedupe insert sonucu — idempotency testinde 23505'e çekilir.
  insertResult: { error: null as null | { code: string; message: string } },
  // refund eşleşmesi için "applied" siparişler.
  ordersForRefund: [] as Array<{ order_id: string; workspace_id: string | null }>,
  // çağrı sayaçları (assert için).
  upsertCalls: [] as unknown[],
  wsUpdates: [] as unknown[],
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const state = { op: '' as string }
      const builder: Record<string, unknown> = {}
      Object.assign(builder, {
        select: vi.fn(() => { state.op = 'select'; return builder }),
        update: vi.fn((v: unknown) => {
          state.op = 'update'
          if (table === 'nmm_workspaces') h.wsUpdates.push(v)
          return builder
        }),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        insert: vi.fn(() => Promise.resolve(h.insertResult)),
        upsert: vi.fn((v: unknown) => { h.upsertCalls.push(v); return Promise.resolve({ error: null }) }),
        single: vi.fn(() =>
          Promise.resolve({ data: { license_expires_at: null, license_type: 'free', parent_id: null }, error: null }),
        ),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        // Zincir sonunda await edilirse: update → {error:null}, select → {data}.
        then: (resolve: (v: unknown) => unknown) =>
          resolve(
            state.op === 'update'
              ? { error: null }
              : { data: table === 'nmm_shopier_processed_orders' ? h.ordersForRefund : [], error: null },
          ),
      })
      return builder
    }),
    auth: { admin: { getUserById: vi.fn() } },
  })),
}))

vi.mock('@/lib/infra/mail', () => ({
  sendPaymentSuccessEmail: vi.fn(),
  sendUnresolvedOrderAlertEmail: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('@/lib/domain/shopierOsb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/domain/shopierOsb')>()
  return {
    ...actual,
    getShopierOsbCredentials: () => ({ username: 'osb-user', password: 'osb-pass' }),
    verifyShopierOsbHash: vi.fn(() => true),
    parseShopierOsbPayload: vi.fn(() => ({
      orderid: '999311ea-4e69-4b84-97b5-a1468ffd083e_basic_monthly_1700000000',
      price: 399,
      email: 'buyer@example.com',
    })),
    resolveOrderFromOsb: vi.fn(() => ({
      workspaceId: '999311ea-4e69-4b84-97b5-a1468ffd083e',
      plan: 'basic',
      period: 'monthly',
      daysToAdd: 30,
    })),
  }
})

import { POST } from './route'
import { verifyShopierOsbHash } from '@/lib/domain/shopierOsb'
import { sendUnresolvedOrderAlertEmail } from '@/lib/infra/mail'

const WS = '999311ea-4e69-4b84-97b5-a1468ffd083e'
const PRODUCTS = JSON.stringify({ basic_monthly: { url: 'https://x/1', productId: 'PROD_B_M' } })

function formRequest(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return new Request('http://localhost/api/payment/shopier', { method: 'POST', body: fd })
}

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/payment/shopier', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'shopier-event': 'order.created', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/payment/shopier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.insertResult = { error: null }
    h.ordersForRefund = []
    h.upsertCalls = []
    h.wsUpdates = []
    process.env.SHOPIER_API_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.SHOPIER_PRODUCTS = PRODUCTS
    process.env.SHOPIER_WEBHOOK_VERIFY = 'false' // testte imza doğrulamasını atla
    process.env.SHOPIER_REFUND_WEBHOOK_SECRET = 'refund-secret'
  })

  // ── OSB (eski) ──
  it('returns plain success for valid OSB notification', async () => {
    const res = await POST(formRequest({ res: 'payload', hash: 'abc' }) as unknown as NextRequest)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('success')
    expect(verifyShopierOsbHash).toHaveBeenCalled()
  })

  it('rejects OSB when hash verification fails', async () => {
    ;(verifyShopierOsbHash as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
    const res = await POST(formRequest({ res: 'payload', hash: 'bad' }) as unknown as NextRequest)
    expect(res.status).toBe(401)
  })

  // ── order.created REST webhook ──
  it('applies license for a resolvable order.created', async () => {
    const body = { id: '12345678', note: `${WS}_basic_monthly_1700`, lineItems: [{ productId: 'PROD_B_M' }] }
    const res = await POST(jsonRequest(body) as unknown as NextRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ applied: true })
    expect(h.wsUpdates.length).toBeGreaterThan(0) // lisans güncellendi
  })

  it('records + alerts on an unresolved order (paid but unmatched)', async () => {
    // productId haritada yok → çözülemez.
    const body = { id: '12345678', note: `${WS}_basic_monthly_1700`, lineItems: [{ productId: 'UNKNOWN' }] }
    const res = await POST(jsonRequest(body) as unknown as NextRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ applied: false })
    expect(sendUnresolvedOrderAlertEmail).toHaveBeenCalledOnce()
    // Platform panelinde görünmesi için DB'ye 'unresolved' yazıldı.
    expect(h.upsertCalls).toEqual([expect.objectContaining({ status: 'unresolved', order_id: '12345678' })])
  })

  it('is idempotent — a duplicate order is skipped (no second upgrade)', async () => {
    h.insertResult = { error: { code: '23505', message: 'duplicate key' } }
    const body = { id: '12345678', note: `${WS}_basic_monthly_1700`, lineItems: [{ productId: 'PROD_B_M' }] }
    const res = await POST(jsonRequest(body) as unknown as NextRequest)
    expect(await res.json()).toMatchObject({ applied: false, duplicate: true })
    expect(h.wsUpdates.length).toBe(0) // lisans İKİNCİ kez uzatılmadı
  })

  // ── refund.updated → lisansı düşür ──
  it('revokes license on refund.updated matching a processed order', async () => {
    h.ordersForRefund = [{ order_id: '87654321', workspace_id: WS }]
    const body = { id: '87654321', order: { id: '87654321' } }
    const res = await POST(jsonRequest(body, { 'shopier-event': 'refund.updated' }) as unknown as NextRequest)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ refunded: true, count: 1 })
    expect(h.wsUpdates).toEqual([expect.objectContaining({ license_type: 'free', license_expires_at: null })])
  })
})
