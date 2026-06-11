'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Mail, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import { REGISTER_URL } from '@/lib/domain/constants'
import { HorizontalScrollLock } from '@/components/ui/HorizontalScrollLock'
import { Skeleton } from '@/components/ui/Skeleton'
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
  filtered: PlatformWorkspaceItem[]
  workspacesLoading: boolean
  deletingUserId: string | null
  deleteCountdown: number
  onOpenLicense: (w: PlatformWorkspaceItem) => void
  onDeleteUser: (ownerId: string, email: string) => void
  onCancelDelete: () => void
}

export function PlatformWorkspacesTable({
  inviteCode,
  filtered,
  workspacesLoading,
  deletingUserId,
  deleteCountdown,
  onOpenLicense,
  onDeleteUser,
  onCancelDelete,
}: Props) {
  const { t } = useTranslation()
  const router = useRouter()

  function buildWaLink(w: PlatformWorkspaceItem): string | null {
    if (w.isIndependent) {
      const msg = t('platformPage.inviteWaMessage', { name: w.ownerName, link: REGISTER_URL, code: inviteCode })
      return `https://wa.me/?text=${encodeURIComponent(msg)}`
    }
    return waHref(w.ownerPhone)
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
      <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
        <Users className="h-4 w-4 text-brand" />
        {t('platformPage.workspacesTableTitle')}
      </h2>
      <HorizontalScrollLock className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] md:overflow-x-visible">
        <table className="w-full max-md:min-w-[920px] text-left border-collapse text-sm">
          <colgroup>
            <col className="md:w-[18%]" />
            <col className="md:w-[14%]" />
            <col className="md:w-[8%]" />
            <col className="md:w-[6%]" />
            <col className="md:w-[6%]" />
            <col className="md:w-[14%]" />
            <col className="md:w-[10%]" />
            <col className="md:w-[10%]" />
            <col className="md:w-[14%]" />
          </colgroup>
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] text-xs font-bold select-none">
              <th className="px-2 py-2 font-semibold align-middle">{t('platformPage.thLeaderName')}</th>
              <th className="px-2 py-2 font-semibold align-middle">{t('platformPage.thWorkspaceName')}</th>
              <th className="px-2 py-2 font-semibold align-middle">{t('platformPage.thLicensePlan')}</th>
              <th className="px-1 py-2 font-semibold text-center align-middle">{t('platformPage.thCandidates')}</th>
              <th className="px-1 py-2 font-semibold text-center align-middle">{t('platformPage.thDownlines')}</th>
              <th className="px-2 py-2 font-semibold align-middle">{t('platformPage.thSponsor')}</th>
              <th className="px-2 py-2 font-semibold text-center align-middle">{t('platformPage.thExpiry')}</th>
              <th className="px-2 py-2 font-semibold text-center align-middle">{t('platformPage.thRegistration')}</th>
              <th className="px-2 py-2 font-semibold text-right align-middle">{t('platformPage.thActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
            {workspacesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="p-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-base text-[var(--text-3)] italic">
                  {t('platformPage.noLeadersFound')}
                </td>
              </tr>
            ) : (
              filtered.map(w => {
                const regDate = new Date(w.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                const isPaidUnlimited = w.licenseType !== 'free' && !w.licenseExpiresAt
                const expDate = isPaidUnlimited
                  ? null
                  : w.licenseExpiresAt
                    ? new Date(w.licenseExpiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'
                const isExpired = !isPaidUnlimited && w.licenseExpiresAt ? new Date(w.licenseExpiresAt) < new Date() : false
                const detailHref = w.pipelineCandidateId ? `/pipeline/${w.pipelineCandidateId}` : null
                const waLink = buildWaLink(w)

                return (
                  <tr
                    key={w.workspaceId}
                    onClick={detailHref ? () => router.push(detailHref) : undefined}
                    className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''}`}
                  >
                    <td className="px-2 py-2 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2 min-w-0">
                        {w.avatarUrl ? (
                          <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden border border-[var(--border)] shadow-sm">
                            <Image src={w.avatarUrl} alt={w.ownerName} width={28} height={28} unoptimized className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(w.ownerName)} text-[10px] font-black text-white shadow-sm`}>
                            {w.ownerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--text-1)] truncate">{w.ownerName}</div>
                          <div className="text-xs text-[var(--text-3)] font-semibold flex items-center gap-1 min-w-0">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{w.ownerEmail}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2 align-middle font-medium whitespace-normal break-words">{w.workspaceName}</td>

                    <td className="px-2 py-2 align-middle font-bold shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-sm font-black uppercase tracking-wider ${
                        w.licenseType === 'pro'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : w.licenseType === 'plus'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                            : w.licenseType === 'basic'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {w.licenseType === 'pro'
                          ? t('platformPage.planPro')
                          : w.licenseType === 'plus'
                            ? t('platformPage.planPlus')
                            : w.licenseType === 'basic'
                              ? t('platformPage.planBasic')
                              : t('platformPage.planFree')}
                      </span>
                    </td>

                    <td className="px-1 py-2 text-center align-middle font-bold text-blue-600 dark:text-blue-300 tabular-nums whitespace-nowrap">{w.candidateCount}</td>
                    <td className="px-1 py-2 text-center align-middle font-bold text-brand tabular-nums whitespace-nowrap">{w.downlineCount}</td>

                    <td className="px-2 py-2 align-middle font-semibold whitespace-normal break-words">
                      {w.isIndependent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-black text-purple-600 dark:text-purple-400">
                          💎 {t('platformPage.independentDirect')}
                        </span>
                      ) : (
                        <span className="block text-[var(--text-1)]">{w.sponsorName}</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center align-middle tabular-nums font-semibold whitespace-nowrap ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                      {isPaidUnlimited ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          ♾ {t('platformPage.unlimited')}
                        </span>
                      ) : (
                        <>
                          {expDate}
                          {isExpired && (
                            <span className="ml-1 text-[9px] font-black bg-red-500/10 text-red-500 px-1 py-0.5 rounded uppercase">
                              {t('platformPage.expired')}
                            </span>
                          )}
                        </>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center align-middle text-xs text-[var(--text-3)] font-semibold tabular-nums whitespace-nowrap">{regDate}</td>

                    <td className="px-2 py-2 align-middle whitespace-nowrap text-right">
                      <div className="inline-flex gap-2.5" onClick={e => e.stopPropagation()}>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            title={w.isIndependent ? t('platformPage.shareInviteWhatsApp') : t('platformPage.openWhatsAppChat')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-whatsapp/10 text-[#25D366] transition hover:bg-whatsapp hover:text-white"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => onOpenLicense(w)}
                          title={t('platformPage.manageLicenseTitle')}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand transition hover:bg-brand hover:text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {deletingUserId === w.ownerId ? (
                          <button
                            onClick={onCancelDelete}
                            title={t('platformPage.cancelDeletion')}
                            className="flex h-7 px-2 items-center justify-center rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition min-w-[4rem]"
                          >
                            {t('platformPage.undoLabel')} ({deleteCountdown})
                          </button>
                        ) : (
                          <button
                            onClick={() => onDeleteUser(w.ownerId, w.ownerEmail)}
                            disabled={deletingUserId !== null}
                            title={t('platformPage.deleteUserTitle')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </HorizontalScrollLock>
    </section>
  )
}
