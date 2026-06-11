'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, UserPlus, CheckCircle2, Link2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import { REGISTER_URL } from '@/lib/domain/constants'
import type { PlatformWorkspaceItem } from '../actions'

const AVATAR_COLORS = [
  'from-red-500 to-rose-500',
  'from-orange-500 to-amber-500',
  'from-green-500 to-emerald-500',
  'from-teal-500 to-cyan-500',
  'from-blue-500 to-indigo-500',
  'from-violet-500 to-purple-500',
  'from-fuchsia-500 to-pink-500',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type Props = {
  inviteCode: string
  independentMembers: PlatformWorkspaceItem[]
  addingId: string | null
  addedIds: Set<string>
  claimingId: string | null
  onAddAsCandidate: (workspaceId: string, email: string, name: string) => void
  onClaimToTeam: (workspaceId: string, name: string) => void
}

export function PlatformIndependentSection({
  inviteCode,
  independentMembers,
  addingId,
  addedIds,
  claimingId,
  onAddAsCandidate,
  onClaimToTeam,
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  function buildWaLink(w: PlatformWorkspaceItem) {
    if (w.isIndependent) {
      const msg = t('platformPage.inviteWaMessage', { name: w.ownerName, link: REGISTER_URL, code: inviteCode })
      return `https://wa.me/?text=${encodeURIComponent(msg)}`
    }
    return waHref(w.ownerPhone)
  }

  return (
    <section className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
        <h2 className="text-base font-bold text-[var(--text-1)]">
          {t('platformPage.independentSignupsTitle')}
          <span className="ml-2 text-purple-600 dark:text-purple-400">({independentMembers.length})</span>
        </h2>
        <span className="text-[10px] text-[var(--text-3)] font-medium ml-auto hidden sm:block">
          {t('platformPage.independentSignupsHint')}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {independentMembers.map(w => {
          const isAdded = addedIds.has(w.workspaceId)
          const detailHref = w.pipelineCandidateId ? `/pipeline/${w.pipelineCandidateId}` : null
          const waLink = buildWaLink(w)
          return (
            <div
              key={w.workspaceId}
              onClick={detailHref ? () => router.push(detailHref) : undefined}
              className={`flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm ${detailHref ? 'cursor-pointer hover:bg-[var(--bg-subtle)]/75 transition-colors' : ''}`}
            >
              {w.avatarUrl ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden shadow">
                  <Image src={w.avatarUrl} alt={w.ownerName} width={36} height={36} unoptimized className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(w.ownerName)} text-base font-black text-white shadow`}>
                  {w.ownerName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[var(--text-1)] truncate">{w.ownerName}</div>
                <div className="text-[10px] text-[var(--text-3)] truncate">{w.ownerEmail}</div>
              </div>

              <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    title={t('platformPage.shareInviteWhatsApp')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-whatsapp/10 text-[#25D366] transition hover:bg-whatsapp hover:text-white"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => onClaimToTeam(w.workspaceId, w.ownerName)}
                  disabled={claimingId === w.workspaceId}
                  title={t('platformPage.linkToTeamTitle')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 transition hover:bg-purple-600 hover:text-white disabled:opacity-50 dark:text-purple-300"
                >
                  {claimingId === w.workspaceId
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Link2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => onAddAsCandidate(w.workspaceId, w.ownerEmail, w.ownerName)}
                  disabled={addingId === w.workspaceId || isAdded}
                  title={t('platformPage.addToPipelineTitle')}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    isAdded
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                      : 'bg-brand/10 text-brand dark:text-white dark:bg-white/10 hover:bg-brand hover:text-white disabled:opacity-50'
                  }`}
                >
                  {addingId === w.workspaceId
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : isAdded
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <UserPlus className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
