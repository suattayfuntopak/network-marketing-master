import type { PulsePeriod } from '@/lib/domain/pulse'

/** Ekip ranking batch + hover prefetch ile senkron dönemler. */
export const TEAM_RANKING_BATCH_PERIODS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']
