/** Müşteri + sipariş birleştirme (SAF — DB'siz, test edilebilir). */

export interface CustomerRecord {
  id: string
  full_name: string
  phone: string | null
  note: string | null
  created_at: string
}

export interface OrderRecord {
  customer_id: string
  amount: number
  ordered_at: string
}

export interface CustomerWithStats extends CustomerRecord {
  orderCount: number
  totalAmount: number
  lastOrderAt: string | null
}

export interface CustomerListResult {
  customers: CustomerWithStats[]
  totalRevenue: number
  totalOrders: number
  customerCount: number
}

/**
 * Müşterileri sipariş özetiyle birleştirir; son siparişe göre (yoksa kayıt tarihine
 * göre) azalan sıralar. Tutarlar müşteri bazında toplanır.
 */
export function buildCustomerStats(
  customers: CustomerRecord[],
  orders: OrderRecord[],
): CustomerListResult {
  const byCustomer = new Map<string, { count: number; total: number; last: string | null }>()

  let totalRevenue = 0
  for (const o of orders) {
    totalRevenue += o.amount
    const agg = byCustomer.get(o.customer_id) ?? { count: 0, total: 0, last: null }
    agg.count += 1
    agg.total += o.amount
    if (!agg.last || o.ordered_at > agg.last) agg.last = o.ordered_at
    byCustomer.set(o.customer_id, agg)
  }

  const withStats: CustomerWithStats[] = customers.map(c => {
    const agg = byCustomer.get(c.id)
    return {
      ...c,
      orderCount: agg?.count ?? 0,
      totalAmount: agg?.total ?? 0,
      lastOrderAt: agg?.last ?? null,
    }
  })

  withStats.sort((a, b) => {
    const aKey = a.lastOrderAt ?? a.created_at
    const bKey = b.lastOrderAt ?? b.created_at
    return bKey.localeCompare(aKey)
  })

  return {
    customers: withStats,
    totalRevenue,
    totalOrders: orders.length,
    customerCount: customers.length,
  }
}
