import { DashboardLoading } from '@/components/ui/DashboardLoading'

/**
 * Dashboard segment Suspense fallback. Layout/route SSR verisi (workspace +
 * kritik dalga) çözülürken boş ekran yerine iskelet göster — giriş→pano ve
 * sekme geçişlerinde algılanan gecikmeyi maskeler.
 */
export default function Loading() {
  return <DashboardLoading />
}
