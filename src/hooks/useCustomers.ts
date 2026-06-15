'use client'

import { useQuery } from '@tanstack/react-query'
import { getCustomersAction } from '@/app/(dashboard)/musteriler/actions'
import { queryKeys } from '@/lib/query/keys'

/** Müşteri listesi + sipariş özetleri. */
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: getCustomersAction,
    staleTime: 60_000,
  })
}
