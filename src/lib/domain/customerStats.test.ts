import { describe, it, expect } from 'vitest'
import { buildCustomerStats, type CustomerRecord, type OrderRecord } from '@/lib/domain/customerStats'

const cust = (id: string, created_at: string): CustomerRecord => ({
  id,
  full_name: `C-${id}`,
  phone: null,
  note: null,
  created_at,
})
const order = (customer_id: string, amount: number, ordered_at: string): OrderRecord => ({
  customer_id,
  amount,
  ordered_at,
})

describe('buildCustomerStats', () => {
  it('siparişsiz müşteri → sıfır istatistik', () => {
    const r = buildCustomerStats([cust('a', '2026-06-01T00:00:00Z')], [])
    expect(r.customers[0]).toMatchObject({ orderCount: 0, totalAmount: 0, lastOrderAt: null })
    expect(r.totalRevenue).toBe(0)
    expect(r.customerCount).toBe(1)
  })

  it('müşteri bazında sipariş toplar', () => {
    const r = buildCustomerStats(
      [cust('a', '2026-06-01T00:00:00Z')],
      [order('a', 100, '2026-06-02T00:00:00Z'), order('a', 50, '2026-06-05T00:00:00Z')],
    )
    expect(r.customers[0].orderCount).toBe(2)
    expect(r.customers[0].totalAmount).toBe(150)
    expect(r.customers[0].lastOrderAt).toBe('2026-06-05T00:00:00Z')
  })

  it('toplam ciro ve sipariş sayısı tüm siparişlerden', () => {
    const r = buildCustomerStats(
      [cust('a', '2026-06-01T00:00:00Z'), cust('b', '2026-06-01T00:00:00Z')],
      [order('a', 100, '2026-06-02T00:00:00Z'), order('b', 200, '2026-06-03T00:00:00Z')],
    )
    expect(r.totalRevenue).toBe(300)
    expect(r.totalOrders).toBe(2)
  })

  it('son siparişe göre azalan sıralar', () => {
    const r = buildCustomerStats(
      [cust('a', '2026-06-01T00:00:00Z'), cust('b', '2026-06-01T00:00:00Z')],
      [order('a', 10, '2026-06-02T00:00:00Z'), order('b', 10, '2026-06-09T00:00:00Z')],
    )
    expect(r.customers.map(c => c.id)).toEqual(['b', 'a'])
  })

  it('siparişsizler kayıt tarihine göre sıralanır', () => {
    const r = buildCustomerStats(
      [cust('old', '2026-05-01T00:00:00Z'), cust('new', '2026-06-10T00:00:00Z')],
      [],
    )
    expect(r.customers.map(c => c.id)).toEqual(['new', 'old'])
  })
})
