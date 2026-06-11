import type { FunnelMetricKey } from '@/lib/ui/funnelMetricVisuals'

/** Kendi saha özeti (1. tekil) — dashboard.dailyTrackMetric* */
export const FUNNEL_METRIC_LABEL_KEYS_SELF: Record<FunnelMetricKey, string> = {
  arama: 'dashboard.dailyTrackMetricCalls',
  tanisma: 'dashboard.dailyTrackMetricMeetings',
  sunum: 'dashboard.dailyTrackMetricPresentations',
  yeniUye: 'dashboard.dailyTrackMetricMembers',
}

/** Ekip üyesi aktivite özeti (3. tekil) — team.fieldMetric* */
export const FUNNEL_METRIC_LABEL_KEYS_MEMBER: Record<FunnelMetricKey, string> = {
  arama: 'team.fieldMetricCalls',
  tanisma: 'team.fieldMetricMeetings',
  sunum: 'team.fieldMetricPresentations',
  yeniUye: 'team.fieldMetricMembers',
}

export function funnelMetricLabelKeys(
  mode: 'self' | 'member',
): Record<FunnelMetricKey, string> {
  return mode === 'member'
    ? FUNNEL_METRIC_LABEL_KEYS_MEMBER
    : FUNNEL_METRIC_LABEL_KEYS_SELF
}
