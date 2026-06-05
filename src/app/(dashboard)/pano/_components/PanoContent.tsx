'use client'

import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'
import { OnboardingModal } from './OnboardingModal'
import { WelcomeCard } from './WelcomeCard'
import { PanoLauncherGrid } from './PanoLauncherGrid'
import { CrownHomeMockGrid } from './CrownHomeMockGrid'
import { BugunHubSections } from '@/app/(dashboard)/bugun/ilgilen/_components/BugunHubSections'
import { useTranslation } from '@/providers/LanguageProvider'
import { AccountStatusAlert } from './AccountStatusAlert'

export function PanoContent() {
  const { t } = useTranslation()
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const [todayHubOpen, setTodayHubOpen] = useState(false)
  const todayHubRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (todayHubOpen && todayHubRef.current) {
      todayHubRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [todayHubOpen])

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
    <div className="w-full space-y-5">
      {!cLoading && ws && (
        <OnboardingModal
          workspaceId={ws.workspaceId}
          inviteCode={ws.inviteCode}
          hasCandidatesInitially={candidates.length > 0}
        />
      )}
      <AccountStatusAlert />

      <div className="w-full space-y-5 md:mx-auto md:max-w-5xl">
        <header className="md:text-center">
          {wsLoading ? (
            <div className="h-8 w-56 animate-pulse rounded bg-[var(--bg-subtle)] md:mx-auto" />
          ) : (
            <h1 className="text-2xl font-bold text-[var(--text-1)]">
              {greetingIcon} {greeting} {firstName} 👋🏻
            </h1>
          )}
        </header>

        {!cLoading && <WelcomeCard candidateCount={candidates.length} />}

        <PanoLauncherGrid
          todayHubOpen={todayHubOpen}
          onTodayHubToggle={() => setTodayHubOpen(open => !open)}
        />

        {todayHubOpen && (
          <div ref={todayHubRef} className="animate-in fade-in slide-in-from-top-2 duration-200">
            <CrownHomeMockGrid />
          </div>
        )}

        <BugunHubSections />
      </div>
    </div>
  )
}
