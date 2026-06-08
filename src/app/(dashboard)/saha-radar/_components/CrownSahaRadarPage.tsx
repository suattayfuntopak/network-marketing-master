'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Bot,
  ChevronRight,
  Clock,
  Copy,
  Lock,
  Phone,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/crown/actions'
import type { SahaRadarMember, SahaRadarFollowUp } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'
import { queryKeys } from '@/lib/query/keys'
import { waHref } from '@/lib/utils/waLink'
import { useMarkContacted } from '@/hooks/useCandidates'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { generateQuickMessageAction } from '@/app/(dashboard)/bugun/ilgilen/actions'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'

type InnerTab = 'aktivite' | 'takipler'
type ActiveAiMessage = {
  message: string
  candidateName: string
  phone: string | null
  candidateId: string
}

function ActivityDot({ level }: { level: 'active' | 'recent' | 'silent' }) {
  return (
    <span
      className={clsx(
        'inline-block h-2.5 w-2.5 rounded-full shrink-0',
        level === 'active'
          ? 'bg-emerald-500'
          : level === 'recent'
            ? 'bg-amber-400'
            : 'bg-rose-500',
      )}
    />
  )
}

function FollowUpCard({
  f,
  t,
  lang,
  onAIClick,
  onWaClick,
  onCallClick,
  generatingId,
  hasAiFieldAccess,
}: {
  f: SahaRadarFollowUp
  t: ReturnType<typeof useTranslation>['t']
  lang: 'tr' | 'en'
  onAIClick: (f: SahaRadarFollowUp) => void
  onWaClick: (id: string) => void
  onCallClick: (id: string) => void
  generatingId: string | null
  hasAiFieldAccess: boolean
}) {
  const router = useRouter()
  const wa = f.phone ? waHref(f.phone) : null
  const dueDate = new Date(f.dueAt)
  const dateStr = dueDate.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })

  return (
    <li
      className={clsx(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition active:scale-[0.99]',
        f.isOverdue
          ? 'border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/15'
          : 'border-[var(--border)] bg-[var(--bg-card)]',
      )}
      onClick={() => router.push(`/pipeline/${f.id}`)}
    >
      <Clock
        className={clsx(
          'h-4 w-4 shrink-0',
          f.isOverdue ? 'text-rose-500' : 'text-amber-500',
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-1)]">
          {f.candidateName}
        </p>
        <p className="text-xs text-[var(--text-3)]">
          {!f.isMine && <>{f.ownerName} · </>}
          {dateStr}
          {f.isOverdue && (
            <span className="ml-1 font-bold text-rose-500">
              {t('crown.sahaRadarOverdue')}
            </span>
          )}
        </p>
      </div>
      <div
        className="flex shrink-0 items-center gap-1.5"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onAIClick(f)}
          disabled={generatingId === f.id}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7] transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 active:scale-95"
          aria-label="AI Mesaj Üret"
          title="AI Mesaj Üret"
        >
          {generatingId === f.id ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
          ) : (
            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {!hasAiFieldAccess && (
            <Lock
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]"
              strokeWidth={2.5}
              aria-hidden
            />
          )}
        </button>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              e.stopPropagation()
              onWaClick(f.id)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366] text-white transition-all hover:scale-105 hover:shadow-md"
            aria-label="WhatsApp"
            title="WhatsApp"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
          </a>
        )}
        {f.phone && (
          <a
            href={`tel:${f.phone}`}
            onClick={e => {
              e.stopPropagation()
              onCallClick(f.id)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md"
            aria-label="Ara"
            title="Ara"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        )}
      </div>
    </li>
  )
}

function MemberCard({
  m,
  t,
}: {
  m: SahaRadarMember
  t: ReturnType<typeof useTranslation>['t']
}) {
  const router = useRouter()
  const labelKey =
    m.activityLevel === 'active'
      ? 'crown.sahaRadarActive'
      : m.activityLevel === 'recent'
        ? 'crown.sahaRadarRecent'
        : 'crown.sahaRadarSilent'
  const daysBadge =
    m.daysSinceActivity === null
      ? t('crown.sahaRadarNeverActive')
      : m.daysSinceActivity === 0
        ? t('crown.sahaRadarToday')
        : t('crown.sahaRadarDaysAgo', { count: m.daysSinceActivity })
  const wa = m.phone ? waHref(m.phone) : null

  return (
    <li
      className={clsx(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition active:scale-[0.99]',
        m.activityLevel === 'silent'
          ? 'border-rose-500/25 bg-rose-50/30 dark:bg-rose-950/15'
          : 'border-[var(--border)] bg-[var(--bg-card)]',
      )}
      onClick={() => router.push('/ekip')}
    >
      <PersonAvatar name={m.fullName} imageUrl={m.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-1)]">
          {m.fullName}
        </p>
        <p className="text-xs text-[var(--text-3)]">{daysBadge}</p>
      </div>
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span
          className={clsx(
            'text-[10px] font-bold rounded-full px-2 py-0.5',
            m.activityLevel === 'active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : m.activityLevel === 'recent'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
          )}
        >
          {t(labelKey)}
        </span>
        <ActivityDot level={m.activityLevel} />
        <div className="flex items-center gap-1.5 ml-1">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366] text-white transition-all hover:scale-105 hover:shadow-md"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </a>
          )}
          {m.phone && (
            <a
              href={`tel:${m.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md"
              aria-label="Ara"
              title="Ara"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

export function CrownSahaRadarPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const { data: ws } = useWorkspace()
  const markContacted = useMarkContacted(ws?.workspaceId ?? '')
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()
  const [innerTab, setInnerTab] = useState<InnerTab>('takipler')
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [activeAiMessage, setActiveAiMessage] = useState<ActiveAiMessage | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.crownSahaRadar(ws?.workspaceId ?? ''),
    queryFn: () => getCrownSahaRadarAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 0,
    refetchInterval: 60_000,
  })

  async function handleAIMessage(f: SahaRadarFollowUp) {
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    setGeneratingId(f.id)
    try {
      const result = await generateQuickMessageAction({
        name: f.candidateName,
        stage: f.stage,
        note: '',
      })
      if (result.error || !result.message) {
        toast.error(result.error ?? 'Mesaj oluşturulamadı.')
        return
      }
      setActiveAiMessage({
        message: result.message,
        candidateName: f.candidateName,
        phone: f.phone,
        candidateId: f.id,
      })
      markContacted.mutate({ id: f.id, actionType: 'ai_generate' })
    } catch {
      toast.error('Mesaj oluşturulamadı.')
    } finally {
      setGeneratingId(null)
    }
  }

  const overdue = data?.followUps.filter(f => f.isOverdue) ?? []
  const upcoming = data?.followUps.filter(f => !f.isOverdue) ?? []
  const activeMembers = data?.members.filter(m => m.activityLevel === 'active').length ?? 0
  const silentMembers = data?.members.filter(m => m.activityLevel === 'silent').length ?? 0

  return (
    <>
      {UpgradePrompt}
      <HubPageShell
        title={t('crown.sahaRadarTitle')}
        icon={Activity}
        iconClassName="bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
        backHref="/pano"
        showRefresh={false}
        asTab={asTab}
      >
        {/* Sekme çubuğu */}
        <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button
            type="button"
            onClick={() => setInnerTab('takipler')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
              innerTab === 'takipler'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {t('crown.sahaRadarTabFollowUps')}
            {overdue.length > 0 && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  innerTab === 'takipler'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500 text-white',
                )}
              >
                {overdue.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setInnerTab('aktivite')}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
              innerTab === 'aktivite'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Users className="h-3.5 w-3.5" />
            {t('crown.sahaRadarTabActivity')}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {/* TAB: Takipler */}
            {innerTab === 'takipler' && (
              <div className="space-y-4">
                {overdue.length === 0 && upcoming.length === 0 ? (
                  <HubSectionCard>
                    <p className="text-center text-sm text-[var(--text-3)]">
                      {t('crown.sahaRadarNoFollowUps')}
                    </p>
                  </HubSectionCard>
                ) : (
                  <>
                    {overdue.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                          {t('crown.sahaRadarOverdueSection')} ({overdue.length})
                        </p>
                        <ul className="space-y-2">
                          {overdue.map(f => (
                            <FollowUpCard
                              key={f.id}
                              f={f}
                              t={t}
                              lang={lang}
                              onAIClick={handleAIMessage}
                              onWaClick={id =>
                                markContacted.mutate({ id, actionType: 'whatsapp' })
                              }
                              onCallClick={id =>
                                markContacted.mutate({ id, actionType: 'call' })
                              }
                              generatingId={generatingId}
                              hasAiFieldAccess={hasAiFieldAccess}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                    {upcoming.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                          {t('crown.sahaRadarUpcomingSection')} ({upcoming.length})
                        </p>
                        <ul className="space-y-2">
                          {upcoming.map(f => (
                            <FollowUpCard
                              key={f.id}
                              f={f}
                              t={t}
                              lang={lang}
                              onAIClick={handleAIMessage}
                              onWaClick={id =>
                                markContacted.mutate({ id, actionType: 'whatsapp' })
                              }
                              onCallClick={id =>
                                markContacted.mutate({ id, actionType: 'call' })
                              }
                              generatingId={generatingId}
                              hasAiFieldAccess={hasAiFieldAccess}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <a
                  href="/pipeline"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
                >
                  <span className="text-sm font-semibold text-[var(--text-1)]">
                    {t('crown.sahaRadarPipelineCta')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
                </a>
              </div>
            )}

            {/* TAB: Aktivite */}
            {innerTab === 'aktivite' && (
              <div className="space-y-4">
                {!data?.hasTeamAccess ? (
                  <FeatureUpgradeGate feature="team" locked>
                    {null}
                  </FeatureUpgradeGate>
                ) : data.members.length === 0 ? (
                  <p className="text-center text-sm text-[var(--text-3)]">
                    {t('crown.emptyTeam')}
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          {t('crown.sahaRadarActiveCount', { count: activeMembers })}
                        </span>
                      </div>
                      {silentMembers > 0 && (
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/20">
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            {t('crown.sahaRadarSilentCount', { count: silentMembers })}
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {data.members.map(m => (
                        <MemberCard key={m.userId} m={m} t={t} />
                      ))}
                    </ul>
                  </>
                )}
                <a
                  href="/ekip"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
                >
                  <span className="text-sm font-semibold text-[var(--text-1)]">
                    {t('crown.sahaRadarTeamCta')}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
                </a>
              </div>
            )}
          </>
        )}
      </HubPageShell>

      {/* AI mesaj modalı */}
      {activeAiMessage &&
        createPortal(
          <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setActiveAiMessage(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/20 text-[#534AB7]">
                    <Sparkles className="h-4 w-4 fill-current animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-1)]">Yapay Zeka Mesajı</h2>
                    <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">
                      {activeAiMessage.candidateName} için üretildi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAiMessage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative mb-5">
                <textarea
                  value={activeAiMessage.message}
                  readOnly
                  rows={6}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] leading-relaxed outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeAiMessage.message)
                    toast.success('Mesaj kopyalandı!')
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7] active:scale-95"
                  title="Kopyala"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {activeAiMessage.phone &&
                  waHref(activeAiMessage.phone, activeAiMessage.message) && (
                    <a
                      href={waHref(activeAiMessage.phone, activeAiMessage.message)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        markContacted.mutate({
                          id: activeAiMessage.candidateId,
                          actionType: 'whatsapp',
                        })
                        setActiveAiMessage(null)
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:opacity-90 active:scale-95 shadow-[0_4px_12px_rgba(37,211,102,0.2)]"
                      title="WhatsApp ile Gönder"
                    >
                      <WhatsAppIcon className="h-4.5 w-4.5" />
                    </a>
                  )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
