import { describe, expect, it } from 'vitest'
import {
  PLAN_FEATURE_MIN_TIER,
  PLAN_GATE_COPY,
  PLAN_MODAL_BLURBS,
  PLAN_PAYMENT_TEAM_FEATURES,
  TEAM_FREE_BANNER_COPY,
  hasPlanFeature,
  resolveUpgradePlansTarget,
  upgradePlansHref,
  type PlanFeatureId,
} from '@/lib/domain/planFeatureMatrix'
import { hasDownlineOnboardingAccess } from '@/lib/domain/teamLimits'
import { hasStatsAdvancedAccess } from '@/lib/domain/featureAccess'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { shellSection } from '@/lib/translations/sections/shell'
import { paymentSection } from '@/lib/translations/sections/payment'
import { statsSection } from '@/lib/translations/sections/stats'
import { landingSection } from '@/lib/translations/sections/landing'

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

  it('PLAN_PAYMENT_TEAM_FEATURES stays synced with paymentPage translations', () => {
    for (const lang of ['tr', 'en'] as const) {
      const pay = paymentSection[lang].paymentPage
      const feat = PLAN_PAYMENT_TEAM_FEATURES[lang]
      expect(pay.plusFeature2).toBe(feat.plusDownlineOnboarding)
      expect(pay.plusFeature3).toBe(feat.plusStatsFunnel)
      expect(pay.plusFeature4).toBe(feat.plusMemberLimit)
      expect(pay.proFeature2).toBe(feat.proLearningColumns)
      expect(pay.proFeature3).toBe(feat.proFieldSummary)
      expect(pay.proFeature4).toBe(feat.proUnlimitedTeam)
    }
  })

  it('PLAN_GATE_COPY stays synced with shellUi and stats gate translations', () => {
    for (const lang of ['tr', 'en'] as const) {
      const gate = PLAN_GATE_COPY[lang]
      const shell = shellSection[lang].shellUi
      expect(shell.teamGateDesc).toBe(gate.teamGateDesc)
      expect(shell.upgradeTeamPulseDesc).toBe(gate.upgradeTeamPulseDesc)
      expect(shell.upgradeStatsDesc).toBe(gate.upgradeStatsDesc)
      expect(shell.teamProUpgradeTitle).toBe(gate.teamProUpgradeTitle)
      expect(shell.teamProUpgradeDesc).toBe(gate.teamProUpgradeDesc)
      expect(shell.teamProUpgradeCta).toBe(gate.teamProUpgradeCta)
      expect(statsSection[lang].statsPage.teamLockedDesc).toBe(gate.statsTeamLockedDesc)
    }
  })

  it('PLAN_LANDING_TEAM_FEATURES stays synced with landingPage translations', () => {
    for (const lang of ['tr', 'en'] as const) {
      const land = landingSection[lang].landingPage
      const feat = PLAN_PAYMENT_TEAM_FEATURES[lang]
      expect(land.planPlusFeat2).toBe(feat.plusDownlineOnboarding)
      expect(land.planPlusFeat3).toBe(feat.plusStatsFunnel)
      expect(land.planPlusFeat4).toBe(feat.plusMemberLimit)
      expect(land.planProFeat2).toBe(feat.proLearningColumns)
      expect(land.planProFeat3).toBe(feat.proFieldSummary)
      expect(land.planProFeat4).toBe(feat.proUnlimitedTeam)
    }
  })

  it('PLAN_MODAL_BLURBS stays synced with shellUi plan blurbs', () => {
    for (const lang of ['tr', 'en'] as const) {
      const blurbs = PLAN_MODAL_BLURBS[lang]
      const shell = shellSection[lang].shellUi
      expect(shell.planBlurb_basic).toBe(blurbs.basic)
      expect(shell.planBlurb_plus).toBe(blurbs.plus)
      expect(shell.planBlurb_pro).toBe(blurbs.pro)
    }
  })

  it('resolveUpgradePlansTarget routes team_pulse to Pro checkout', () => {
    expect(resolveUpgradePlansTarget('team_pulse')).toBe('pro')
    expect(upgradePlansHref('pro')).toBe('/odeme?plan=pro')
    expect(resolveUpgradePlansTarget('stats_advanced')).toBe('general')
    expect(resolveUpgradePlansTarget('team_full')).toBe('general')
    expect(upgradePlansHref('general')).toBe('/odeme')
  })
})
