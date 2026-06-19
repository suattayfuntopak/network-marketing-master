import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/domain/shopierPaymentSession', () => ({
  createShopierPaymentSession: vi.fn(),
}))

import { POST } from './route'
import { createShopierPaymentSession } from '@/lib/domain/shopierPaymentSession'

describe('POST /odeme/launch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns auto-submit HTML for a valid plan', async () => {
    ;(createShopierPaymentSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      API_key: 'test-key',
      signature: 'sig+test=',
      platform_order_id: 'ws_basic_monthly_1',
      total_order_value: '499',
    })

    const formData = new FormData()
    formData.set('plan', 'basic')
    formData.set('period', 'monthly')

    const req = new Request('http://localhost/odeme/launch', { method: 'POST', body: formData })
    const res = await POST(req as unknown as import('next/server').NextRequest)

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('api_pay4.php')
    expect(html).toContain('multipart/form-data')
    expect(html).toContain('value="499"')
    expect(createShopierPaymentSession).toHaveBeenCalledWith('basic', 'monthly')
  })

  it('returns 400 when plan is invalid', async () => {
    const formData = new FormData()
    formData.set('plan', 'enterprise')

    const req = new Request('http://localhost/odeme/launch', { method: 'POST', body: formData })
    const res = await POST(req as unknown as import('next/server').NextRequest)

    expect(res.status).toBe(400)
    expect(createShopierPaymentSession).not.toHaveBeenCalled()
  })
})
