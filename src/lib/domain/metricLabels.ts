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

/** Hedefim — bugünkü plan (1. tekil, gelecek zaman) — hedef.dailyRow* */
export const FUNNEL_METRIC_LABEL_KEYS_PLAN: Record<FunnelMetricKey, string> = {
  arama: 'hedef.dailyRowCalls',
  tanisma: 'hedef.dailyRowMeetings',
  sunum: 'hedef.dailyRowPresentations',
  yeniUye: 'hedef.dailyRowMembers',
}

export function funnelMetricLabelKeys(
  mode: 'self' | 'member' | 'plan',
): Record<FunnelMetricKey, string> {
  if (mode === 'member') return FUNNEL_METRIC_LABEL_KEYS_MEMBER
  if (mode === 'plan') return FUNNEL_METRIC_LABEL_KEYS_PLAN
  return FUNNEL_METRIC_LABEL_KEYS_SELF
}
