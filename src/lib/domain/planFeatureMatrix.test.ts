import { describe, expect, it } from 'vitest'
import {
  PLAN_FEATURE_MIN_TIER,
  TEAM_FREE_BANNER_COPY,
  hasPlanFeature,
  type PlanFeatureId,
} from '@/lib/domain/planFeatureMatrix'
import { hasDownlineOnboardingAccess } from '@/lib/domain/teamLimits'
import { hasStatsAdvancedAccess } from '@/lib/domain/featureAccess'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { shellSection } from '@/lib/translations/sections/shell'

describe('planFeatureMatrix', () => {
  it('free and basic tiers cannot access gated team features', () => {
    for (const featureId of Object.keys(PLAN_FEATURE_MIN_TIER) as PlanFeatureId[]) {
      expect(hasPlanFeature(featureId, 'free')).toBe(false)
      expect(hasPlanFeature(featureId, 'basic')).toBe(false)
    }
  })

  it('hasPlanFeature stays aligned with domain access helpers', () => {
    expect(hasPlanFeature('downline_onboarding', 'plus')).toBe(
      hasDownlineOnboardingAccess('plus'),
    )
    expect(hasPlanFeature('stats_table_funnel', 'plus')).toBe(
      hasStatsAdvancedAccess('plus'),
    )
    expect(hasPlanFeature('stats_table_learning', 'pro')).toBe(
      hasTeamPulseAccess('pro'),
    )
    expect(hasPlanFeature('team_field_summary', 'pro')).toBe(
      hasTeamPulseAccess('pro'),
    )
  })

  it('pro unlocks every matrix feature', () => {
    for (const featureId of Object.keys(PLAN_FEATURE_MIN_TIER) as PlanFeatureId[]) {
      expect(hasPlanFeature(featureId, 'pro')).toBe(true)
    }
  })

  it('TEAM_FREE_BANNER_COPY stays synced with shellUi translations', () => {
    expect(shellSection.tr.shellUi.teamFreeBannerTitle).toBe(TEAM_FREE_BANNER_COPY.tr.title)
    expect(shellSection.tr.shellUi.teamFreeBannerDesc).toBe(TEAM_FREE_BANNER_COPY.tr.desc)
    expect(shellSection.en.shellUi.teamFreeBannerTitle).toBe(TEAM_FREE_BANNER_COPY.en.title)
    expect(shellSection.en.shellUi.teamFreeBannerDesc).toBe(TEAM_FREE_BANNER_COPY.en.desc)
  })
})
