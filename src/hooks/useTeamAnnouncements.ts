'use client'

import { useQuery } from '@tanstack/react-query'
import { getTeamAnnouncementsAction } from '@/app/(dashboard)/duyurular/actions'
import { queryKeys } from '@/lib/query/keys'

/** Ekip duyuruları — kendi + doğrudan üst hat. */
export function useTeamAnnouncements() {
  return useQuery({
    queryKey: queryKeys.teamAnnouncements(),
    queryFn: getTeamAnnouncementsAction,
    staleTime: 60_000,
  })
}
