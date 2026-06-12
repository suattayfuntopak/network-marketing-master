import { describe, it, expect } from 'vitest'
import {
  hubPeriodTabLabel,
  pulsePeriodLabel,
  sheetActivityPeriodLabel,
} from './pulsePeriodLabels'

const t = (key: string) => key

describe('pulsePeriodLabels', () => {
  it('pulsePeriodLabel uses hub keys by default', () => {
    expect(pulsePeriodLabel(t, 'today')).toBe('dashboard.summaryTabDaily')
    expect(pulsePeriodLabel(t, '7d')).toBe('dashboard.summaryTabWeekly')
    expect(pulsePeriodLabel(t, '30d')).toBe('dashboard.summaryTabMonthly')
    expect(pulsePeriodLabel(t, 'ytd')).toBe('dashboard.summaryTabYearly')
    expect(pulsePeriodLabel(t, 'all')).toBe('dashboard.summaryTabAllTime')
  })

  it('pulsePeriodLabel rolling30 uses stats key for 30d only', () => {
    expect(pulsePeriodLabel(t, '30d', { rolling30: true })).toBe('statsPage.period30d')
    expect(pulsePeriodLabel(t, '7d', { rolling30: true })).toBe('dashboard.summaryTabWeekly')
  })

  it('hubPeriodTabLabel maps hub tabs', () => {
    expect(hubPeriodTabLabel(t, 'monthly')).toBe('dashboard.summaryTabMonthly')
    expect(hubPeriodTabLabel(t, 'all')).toBe('dashboard.summaryTabAllTime')
  })

  it('sheetActivityPeriodLabel uses rolling 30d label', () => {
    expect(sheetActivityPeriodLabel(t, '30d')).toBe('statsPage.period30d')
    expect(sheetActivityPeriodLabel(t, '7d')).toBe('dashboard.summaryTabWeekly')
  })
})
