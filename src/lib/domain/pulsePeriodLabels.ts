import type { PulsePeriod, SheetActivityPeriod } from '@/lib/domain/pulse'
import {
  pulsePeriodToHubGridPeriod,
  type HubPeriodTab,
} from '@/lib/domain/hubPeriodPrefetch'

export const PULSE_PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']

export const HUB_PERIOD_TAB_LABEL_KEYS: Record<HubPeriodTab, string> = {
  daily: 'dashboard.summaryTabDaily',
  weekly: 'dashboard.summaryTabWeekly',
  monthly: 'dashboard.summaryTabMonthly',
  yearly: 'dashboard.summaryTabYearly',
  all: 'dashboard.summaryTabAllTime',
}

/** Mobilde sığması için kısa etiket: 1 / 7 / 30 / 365 / ∞ */
export const PULSE_PERIOD_SHORT: Record<PulsePeriod, string> = {
  today: '1',
  '7d': '7',
  '30d': '30',
  ytd: '365',
  all: '∞',
}

export type PulsePeriodLabelOpts = { rolling30?: boolean }

/** Pulse dönem etiketi — varsayılan hub takvimi; `rolling30` ile kayan 30 gün (İstatistikler / ekip sheet). */
export function pulsePeriodLabel(
  t: (key: string) => string,
  p: PulsePeriod,
  opts?: PulsePeriodLabelOpts,
): string {
  if (p === '30d' && opts?.rolling30) return t('statsPage.period30d')
  return t(HUB_PERIOD_TAB_LABEL_KEYS[pulsePeriodToHubGridPeriod(p)])
}

export function hubPeriodTabLabel(t: (key: string) => string, tab: HubPeriodTab): string {
  return t(HUB_PERIOD_TAB_LABEL_KEYS[tab])
}

export function sheetPeriodToHubTab(period: SheetActivityPeriod): HubPeriodTab {
  return pulsePeriodToHubGridPeriod(period)
}

/** Ekip aktivite sheet masaüstü sekme etiketi — 30g kayan pencere, diğerleri hub ile hizalı. */
export function sheetActivityPeriodLabel(
  t: (key: string) => string,
  period: SheetActivityPeriod,
): string {
  return pulsePeriodLabel(t, period, { rolling30: period === '30d' })
}
