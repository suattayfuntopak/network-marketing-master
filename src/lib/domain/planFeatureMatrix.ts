import type { LicenseTier } from '@/lib/domain/aiUsage'
import type { GatedFeature } from '@/lib/domain/featureAccess'
import { hasStatsAdvancedAccess } from '@/lib/domain/featureAccess'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { hasDownlineOnboardingAccess } from '@/lib/domain/teamLimits'

/** Plan kapıları — pazarlama metinleri ve erişim kontrolleri için tek kaynak. */
export type PlanFeatureId =
  | 'downline_onboarding'
  | 'stats_table_funnel'
  | 'stats_table_learning'
  | 'team_field_summary'

/** Minimum plan katmanı (super admin her zaman açık). */
export const PLAN_FEATURE_MIN_TIER: Record<PlanFeatureId, LicenseTier> = {
  downline_onboarding: 'plus',
  stats_table_funnel: 'plus',
  stats_table_learning: 'pro',
  team_field_summary: 'pro',
}

export function hasPlanFeature(
  featureId: PlanFeatureId,
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean,
): boolean {
  switch (featureId) {
    case 'downline_onboarding':
      return hasDownlineOnboardingAccess(licenseType, isSuperAdmin)
    case 'stats_table_funnel':
      return hasStatsAdvancedAccess(licenseType, isSuperAdmin)
    case 'stats_table_learning':
    case 'team_field_summary':
      return hasTeamPulseAccess(licenseType, isSuperAdmin)
  }
}

/** Ekibim upgrade banner — shellUi.teamFreeBanner* ile senkron. */
export const TEAM_FREE_BANNER_COPY = {
  tr: {
    title: 'Ekibinizi görüntülüyorsunuz',
    desc:
      'Listenizde “Katıldı” aşamasına gelen kişileri kartlarındaki “NMM’e Davet Et” ile ekibinize NMM Ortağı olarak katabilirsiniz. Ancak Distribütör Doğru Başlangıç takibi Plus planda; tam performans tablosu (eğitim sütunları) ve Ekibim saha özeti Pro planda açılır.',
  },
  en: {
    title: 'Viewing your team',
    desc:
      'When someone in your list reaches the “Joined” stage, use “Invite to NMM” on their card to add them as an NMM Partner. Downline Distributor Quick Start tracking is on Plus; the full performance table (learning columns) and Ekibim field summary unlock on Pro.',
  },
} as const

/** Ödeme sayfası ekip özellikleri — paymentPage.plusFeature2/3/4, proFeature2/3/4 ile senkron. */
export const PLAN_PAYMENT_TEAM_FEATURES = {
  tr: {
    plusDownlineOnboarding: 'Distribütör Doğru Başlangıç takibi — her yeni üyeyi ilk 90 günde doğru başlat',
    plusStatsFunnel: 'Ekip performans tablosu — aday hunisi ve Doğru Başlangıç sütunları',
    plusMemberLimit: 'Alt ekip yönetimi ve NMM davet kodu gönderimi (100 kişiye kadar)',
    proLearningColumns: 'Tam performans tablosu — eğitim, video ve itiraz sütunları',
    proFieldSummary: 'Ekibim saha özeti (Ekip Saha Nabzı)',
    proUnlimitedTeam: 'Sınırsız alt ekip yönetimi ve NMM davet kodu gönderimi',
  },
  en: {
    plusDownlineOnboarding: 'Quick Start onboarding — start every new distributor right in their first 90 days',
    plusStatsFunnel: 'Team performance table — pipeline funnel & Quick Start columns',
    plusMemberLimit: 'Downline management & NMM invites (up to 100 members)',
    proLearningColumns: 'Full performance table — training, video & objection columns',
    proFieldSummary: 'Ekibim field summary (Team Field Pulse)',
    proUnlimitedTeam: 'Unlimited downline management & NMM invite codes',
  },
} as const

/** UpgradeGate / kilit overlay metinleri — shellUi.* ve statsPage.teamLockedDesc ile senkron. */
export const PLAN_GATE_COPY = {
  tr: {
    teamGateDesc:
      'Distribütör Doğru Başlangıç adımlarını alt ekip üyelerinde takip etmek Plus veya Pro planda açılır. Basic planda ekibinizi görüntüleyebilir ve davet gönderebilirsiniz (25 kişiye kadar).',
    upgradeTeamPulseDesc:
      'Ekibim saha özeti (Ekip Saha Nabzı) ve eğitim/video/itiraz nabzı Pro planda açılır.',
    upgradeStatsDesc:
      'Ekip Performans tablosunun huni ve DDBR sütunları Plus veya Pro planda; eğitim, video ve itiraz sütunları Pro plandadır.',
    statsTeamLockedDesc:
      'Ekip Performans tablosunun huni ve DDBR sütunları Plus veya Pro planda açılır; eğitim, video ve itiraz sütunları Pro plandadır.',
    teamProUpgradeTitle: 'Ekibim saha özeti Pro planda',
    teamProUpgradeDesc:
      'Ekip Saha Nabzı ve eğitim/video/itiraz nabzı Pro planda açılır. Plus planınız huni tablosu ve DDBR takibini zaten içerir.',
    teamProUpgradeCta: 'Pro planları gör',
    upgradePlusCta: 'Plus planları gör',
  },
  en: {
    teamGateDesc:
      'Track downline Distributor Quick Start steps on Plus or Pro. On Basic you can view your team and send invites (up to 25 members).',
    upgradeTeamPulseDesc:
      'Ekibim field summary (Team Field Pulse) and training/video/objection pulse unlock on Pro.',
    upgradeStatsDesc:
      'Team performance funnel and Quick Start columns are on Plus or Pro; learning columns are on Pro.',
    statsTeamLockedDesc:
      'Team performance funnel and Quick Start columns unlock on Plus or Pro; training, video and objection columns are on Pro.',
    teamProUpgradeTitle: 'Ekibim field summary is on Pro',
    teamProUpgradeDesc:
      'Team Field Pulse and training/video/objection pulse unlock on Pro. Your Plus plan already includes the funnel table and Quick Start tracking.',
    teamProUpgradeCta: 'View Pro plans',
    upgradePlusCta: 'View Plus plans',
  },
} as const

/** PageHelp — plan katmanları adımı (ekip / istatistik / saha özeti). */
export const PLAN_PAGE_HELP_PLAN_STEP = {
  tr: {
    t: 'Plan katmanları',
    d: 'Plus: Distribütör Doğru Başlangıç + huni tablosu. Pro: eğitim/video/itiraz sütunları + Ekibim saha özeti.',
  },
  en: {
    t: 'Plan tiers',
    d: 'Plus: downline Quick Start + funnel table. Pro: learning columns + Ekibim field summary.',
  },
} as const

/** Landing fiyatlandırma — landingPage.planPlusFeat2/3/4 ile aynı metinler. */
export const PLAN_LANDING_TEAM_FEATURES = PLAN_PAYMENT_TEAM_FEATURES

/** UpgradeGate modal mini kartları — shellUi.planBlurb_* ile senkron ({limit} = günlük YZ). */
export const PLAN_MODAL_BLURBS = {
  tr: {
    basic: 'Günlük {limit} YZ — koç + saha',
    plus: 'Günlük {limit} YZ · DDBR + huni tablosu',
    pro: 'Günlük {limit} YZ · eğitim sütunları + saha özeti',
  },
  en: {
    basic: 'Daily {limit} AI — coach + field',
    plus: 'Daily {limit} AI · Quick Start + funnel table',
    pro: 'Daily {limit} AI · learning columns + field summary',
  },
} as const

export type UpgradePlansTarget = 'general' | 'plus' | 'pro'

export type ProUpgradeCtaSource =
  | 'upgrade_gate'
  | 'ekip_summary'
  | 'ekip_training'
  | 'stats_hint'

/** Ödeme deep link — feature’a göre Plus veya Pro kartına gider. */
export function resolveUpgradePlansTarget(
  feature: GatedFeature | 'team_full',
): UpgradePlansTarget {
  if (feature === 'team_pulse') return 'pro'
  if (feature === 'stats_advanced' || feature === 'team_full') return 'plus'
  return 'general'
}

export function upgradePlansHref(target: UpgradePlansTarget): string {
  if (target === 'pro') return '/odeme?plan=pro'
  if (target === 'plus') return '/odeme?plan=plus'
  return '/odeme'
}
