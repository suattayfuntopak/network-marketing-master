import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          license_expires_at: null,
          license_type: 'free',
          parent_id: null,
        },
      }),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
    auth: { admin: { getUserById: vi.fn() } },
  })),
}))

vi.mock('@/lib/infra/mail', () => ({
  sendPaymentSuccessEmail: vi.fn(),
}))

vi.mock('@/lib/domain/shopierOsb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/domain/shopierOsb')>()
  return {
    ...actual,
    getShopierOsbCredentials: () => ({
      username: 'osb-user',
      password: 'osb-pass',
    }),
    verifyShopierOsbHash: vi.fn(() => true),
    parseShopierOsbPayload: vi.fn(() => ({
      orderid: '999311ea-4e69-4b84-97b5-a1468ffd083e_leader_monthly_1700000000',
      price: 399,
      email: 'buyer@example.com',
    })),
    resolveOrderFromOsb: vi.fn(() => ({
      workspaceId: '999311ea-4e69-4b84-97b5-a1468ffd083e',
      plan: 'leader',
      period: 'monthly',
      daysToAdd: 30,
    })),
  }
})

import { POST } from './route'
import { verifyShopierOsbHash } from '@/lib/domain/shopierOsb'

function formRequest(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return new Request('http://localhost/api/payment/shopier', {
    method: 'POST',
    body: fd,
  })
}

describe('POST /api/payment/shopier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SHOPIER_API_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  })

  it('returns plain success for valid OSB notification', async () => {
    const res = await POST(
      formRequest({ res: 'payload', hash: 'abc' }) as unknown as import('next/server').NextRequest
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('success')
    expect(verifyShopierOsbHash).toHaveBeenCalled()
  })

  it('rejects OSB when hash verification fails', async () => {
    ;(verifyShopierOsbHash as ReturnType<typeof vi.fn>).mockReturnValueOnce(false)
    const res = await POST(
      formRequest({ res: 'payload', hash: 'bad' }) as unknown as import('next/server').NextRequest
    )
    expect(res.status).toBe(401)
  })
})
