'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
const PULSE_TABLES = [
  'nmm_user_progress',
  'nmm_learning_events',
  'nmm_video_progress',
  'nmm_pulse_weekly_summaries',
] as const

/**
 * F5: Nabız sorgularını Supabase Realtime ile tazeler (30sn polling yerine).
 * RLS sayesinde sponsor yalnızca yetkili olduğu satır değişikliklerini alır.
 */
export function usePulseRealtime() {
  const queryClient = useQueryClient()
  const { data: ws } = useWorkspace()
  const supabase = useMemo(() => createClient(), [])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ws?.workspaceId) return

    let channel: RealtimeChannel | null = null
    let cancelled = false

    const invalidatePulse = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({
          predicate: q =>
            Array.isArray(q.queryKey) &&
            typeof q.queryKey[0] === 'string' &&
            (q.queryKey[0].startsWith('pulse') || q.queryKey[0] === 'video-catalog'),
        })
        queryClient.invalidateQueries({ queryKey: ['video-catalog', ws.workspaceId] })
      }, 400)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return

      channel = supabase.channel(`pulse_realtime:${user.id}`)

      for (const table of PULSE_TABLES) {
        channel = channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            invalidatePulse()
          }
        )
      }

      channel.subscribe()
    })

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [queryClient, supabase, ws?.workspaceId])
}
