'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { OnboardingModal } from './OnboardingModal'
import { WelcomeCard } from './WelcomeCard'
import { PanoLauncherGrid } from './PanoLauncherGrid'
import { useTranslation } from '@/providers/LanguageProvider'
import { AccountStatusAlert } from './AccountStatusAlert'

export function PanoContent() {
  const { t } = useTranslation()
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

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3 md:gap-4 md:overflow-hidden">
      {!cLoading && ws && (
        <OnboardingModal
          workspaceId={ws.workspaceId}
          inviteCode={ws.inviteCode}
          hasCandidatesInitially={candidates.length > 0}
        />
      )}
      <AccountStatusAlert />

      <header className="shrink-0 space-y-1 md:text-center">
        {wsLoading ? (
          <div className="h-7 w-56 animate-pulse rounded bg-[var(--bg-subtle)] md:mx-auto" />
        ) : (
          <h1 className="text-lg font-bold text-[var(--text-1)] md:text-xl">
            {greetingIcon} {greeting} {firstName} 👋🏻
          </h1>
        )}
      </header>

      <div className="min-h-0 flex-1 md:flex md:flex-col md:justify-center">
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
