'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { getMemberDetailAction } from '@/app/(dashboard)/ekip/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/query/keys'
import { waHref } from '@/lib/utils/waLink'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import {
  ActivityBadge,
  activityLevel,
  MemberActionButtons,
  MemberPersonDetailSections,
  useMemberCoachingMessage,
} from '@/app/(dashboard)/ekip/_components/MemberPersonDetailSections'

export function MemberDetailPage({ userId }: { userId: string }) {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()

  const qKey = queryKeys.memberDetail(ws?.workspaceId ?? '', userId)
  const { data, isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => getMemberDetailAction(ws!.workspaceId, userId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  const m = data?.member
  const coaching = useMemberCoachingMessage({
    workspaceId: ws?.workspaceId ?? '',
    userId,
    memberName: m?.full_name ?? null,
    lastActivityAt: m?.last_activity_at ?? null,
    phone: m?.phone,
  })

  return (
    <>
      {coaching.UpgradePrompt}
      <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="w-full max-w-full min-w-0 space-y-5">

          <div className="flex items-center gap-3">
            <Link
              href="/ekip"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]"
              aria-label={t('team.memberDetailBack')}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('team.memberDetailTitle')}
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : !data?.hasAccess || !m ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
              <p className="text-sm text-[var(--text-3)]">{t('team.memberDetailNotFound')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center gap-4">
                  <PersonAvatar
                    name={m.full_name ?? '—'}
                    imageUrl={m.avatar_url ?? null}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-[var(--text-1)]">{m.full_name ?? '—'}</p>
                    {m.joined_at && (
                      <p className="text-xs text-[var(--text-3)]">
                        {t('team.memberDetailJoinedDate', {
                          date: new Date(m.joined_at).toLocaleDateString(
                            lang === 'en' ? 'en-GB' : 'tr-TR',
                            { day: 'numeric', month: 'short', year: 'numeric' },
                          ),
                        })}
                      </p>
                    )}
                    <div className="mt-2">
                      <ActivityBadge level={activityLevel(m.last_activity_at)} t={t} />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <MemberActionButtons
                    t={t}
                    wa={m.phone ? waHref(m.phone) : null}
                    phone={m.phone}
                    generating={coaching.generating}
                    hasAiFieldAccess={coaching.hasAiFieldAccess}
                    onCoaching={coaching.handleCoachingAI}
                  />
                </div>
              </div>

              <MemberPersonDetailSections
                workspaceId={ws!.workspaceId}
                userId={userId}
                memberSeed={m}
                teamPulseUnlocked={hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)}
                coaching={coaching}
              />
            </>
          )}

        </div>
      </main>
    </>
  )
}
