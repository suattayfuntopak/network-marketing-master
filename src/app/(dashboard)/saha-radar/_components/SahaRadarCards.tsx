'use client'

import { useRouter } from 'next/navigation'
import { Bot, Clock, Lock, Phone } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import type { useTranslation } from '@/providers/LanguageProvider'
import type { SahaRadarMember, SahaRadarFollowUp } from '@/app/(dashboard)/saha-radar/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'

type TranslateFn = ReturnType<typeof useTranslation>['t']

export function ActivityDot({ level }: { level: 'active' | 'recent' | 'silent' }) {
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

export function FollowUpCard({
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
  t: TranslateFn
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
          {dateStr}
          {f.isOverdue && (
            <span className="ml-1 font-bold text-rose-500">
              {t('crown.sahaRadarOverdue')}
            </span>
          )}
        </p>
      </div>
      <div
        className="ml-auto flex shrink-0 items-center gap-1.5"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onAIClick(f)}
          disabled={generatingId === f.id}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 active:scale-95"
          aria-label="AI Mesaj Üret"
          title="AI Mesaj Üret"
        >
          {generatingId === f.id ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-whatsapp text-white transition-all hover:scale-105 hover:shadow-md"
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
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md sm:hidden"
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

export function SahaRadarMemberCard({
  m,
  t,
  onCoachAI,
  coachingId,
  hasAiFieldAccess,
}: {
  m: SahaRadarMember
  t: TranslateFn
  onCoachAI: (m: SahaRadarMember) => void
  coachingId: string | null
  hasAiFieldAccess: boolean
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
      data-testid="saha-radar-member-card"
      data-pipeline-id={m.pipelineId ?? ''}
      onClick={() => {
        if (m.pipelineId) {
          router.push(`/pipeline/${m.pipelineId}`)
          return
        }
        toast.info(t('crown.sahaRadarNoPipelineMatch'))
      }}
    >
      <PersonAvatar name={m.fullName} imageUrl={m.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-1)]">
          {m.fullName}
        </p>
        <p className="text-xs text-[var(--text-3)]">{daysBadge}</p>
      </div>
      <span
        className={clsx(
          'ml-auto hidden text-[10px] font-bold rounded-full px-2 py-0.5 sm:inline',
            m.activityLevel === 'active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : m.activityLevel === 'recent'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
        )}
      >
        {t(labelKey)}
      </span>
      <span className="sm:hidden">
        <ActivityDot level={m.activityLevel} />
      </span>
      <div
        className="flex shrink-0 items-center gap-1.5 sm:ml-0"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onCoachAI(m)}
          disabled={coachingId === m.userId}
          className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 active:scale-95"
          aria-label="Koçluk Mesajı Üret"
          title="Koçluk Mesajı Üret"
        >
          {coachingId === m.userId ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          ) : (
            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          {m.lastCoachedAt && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[var(--bg-card)]"
              aria-label="Son 3 gün içinde koçluk yapıldı"
            />
          )}
          {!hasAiFieldAccess && !m.lastCoachedAt && (
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
            onClick={e => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-whatsapp text-white transition-all hover:scale-105 hover:shadow-md"
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
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md sm:hidden"
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
