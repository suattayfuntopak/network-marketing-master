'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { parsePeriodOffset } from '@/lib/utils/hubPeriodRange'

export function useHubPeriodNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const offset = parsePeriodOffset(searchParams.get('offset'))

  function go(toOffset: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (toOffset === 0) params.delete('offset')
    else params.set('offset', String(toOffset))
    const q = params.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  function goToCurrentPeriod() {
    go(0)
  }

  return { offset, go, goToCurrentPeriod }
}
