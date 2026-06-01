'use client'

import { usePulseRealtime } from '@/hooks/usePulseRealtime'

/** Dashboard genelinde nabız realtime aboneliği (görünmez). */
export function PulseRealtimeSync() {
  usePulseRealtime()
  return null
}
