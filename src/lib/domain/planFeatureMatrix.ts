import type { LicenseTier } from '@/lib/domain/aiUsage'
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
