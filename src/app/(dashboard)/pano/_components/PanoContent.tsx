'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { OnboardingModal } from './OnboardingModal'
import { WelcomeCard } from './WelcomeCard'
import { PanoLauncherGrid } from './PanoLauncherGrid'
import { MorningBrief } from './MorningBrief'
import { useTranslation } from '@/providers/LanguageProvider'
import { formatPanoDateLine } from '@/lib/utils/calendarLocale'
import { AccountStatusAlert } from './AccountStatusAlert'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHelp } from '@/components/ui/PageHelp'

export function PanoContent() {
  const { t, lang } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)

  const hour = new Date().getHours()
  const greeting = hour < 5
    ? t('dashboard.greetingNight')
    : hour < 12
      ? t('dashboard.greetingMorning')
      : hour < 14
        ? t('dashboard.greetingAfternoon')
        : hour < 19
          ? t('dashboard.greetingDay')
          : t('dashboard.greetingEvening')

  const greetingIcon = hour < 5 ? '🌙' : hour < 12 ? '🌅' : hour < 14 ? '☀️' : hour < 19 ? '🌤️' : '🌙'
  const firstName = ws?.fullName?.split(' ')[0] ?? ''
  const todayLine = formatPanoDateLine(new Date(), lang)

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-1 md:gap-2 md:overflow-hidden">
      {!cLoading && ws && (
        <OnboardingModal
          workspaceId={ws.workspaceId}
          inviteCode={ws.inviteCode}
          hasCandidatesInitially={candidates.length > 0}
        />
      )}
      <AccountStatusAlert />

      <header className="shrink-0 md:mt-5">
        <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
          {wsLoading ? (
            <Skeleton className="h-7 w-56" />
          ) : (
            <h1 className="min-w-0 text-lg font-bold text-[var(--text-1)] md:text-xl">
              {greetingIcon} {greeting} {firstName}
            </h1>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <PageHelp />
            <p className="shrink-0 text-right text-sm font-medium tracking-wide text-[var(--text-3)] md:text-[15px]">
              {todayLine}
            </p>
          </div>
        </div>
      </header>

      <MorningBrief />

      <div className="min-h-0 flex-1 md:flex md:flex-col">
        <PanoLauncherGrid />
      </div>

      {!cLoading && (
        <div className="md:hidden">
          <WelcomeCard candidateCount={candidates.length} />
        </div>
      )}
    </div>
  )
}
