'use client'

import { useQuery } from '@tanstack/react-query'
import { getCustomerDetailAction } from '@/app/(dashboard)/musteriler/actions'
import { queryKeys } from '@/lib/query/keys'

export function useCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customerDetail(customerId),
    queryFn: () => getCustomerDetailAction(customerId),
    staleTime: 30_000,
    enabled: !!customerId,
  })
}
