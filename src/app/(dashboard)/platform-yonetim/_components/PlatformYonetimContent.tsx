'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePlatformWorkspaces, usePlatformModeration } from '@/hooks/usePlatformAdmin'
import {
  Crown, Users, ShieldCheck, Search,
  Mail, Sparkles, UserPlus, BookOpen, MessageSquare,
  Plus, Loader2, X, ArrowUpRight, CheckCircle2, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import {
  type PlatformWorkspaceItem
} from '../actions'
import {
  addIndependentAsCandidateAction,
  deleteUserAction,
} from '../admin-actions'
import {
  approveRequestAction,
  buildBilingualRejectReasonAction,
  rejectRequestAction,
  type ModerationRequestItem
} from '@/app/(dashboard)/actions/moderation'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { REGISTER_URL } from '@/lib/domain/constants'
import {
  defaultRejectReason,
} from '@/lib/domain/moderationDefaults'

const WorkspaceLicenseModal = dynamic(
  () => import('./WorkspaceLicenseModal').then(m => ({ default: m.WorkspaceLicenseModal })),
  { loading: () => null },
)
const ModerationReviewModal = dynamic(
  () => import('./ModerationReviewModal').then(m => ({ default: m.ModerationReviewModal })),
  { loading: () => null },
)
const UnresolvedOrdersAlert = dynamic(
  () => import('./UnresolvedOrdersAlert').then(m => ({ default: m.UnresolvedOrdersAlert })),
  { loading: () => null },
)
const RejectModerationDialog = dynamic(
  () => import('./RejectModerationDialog').then(m => ({ default: m.RejectModerationDialog })),
  { loading: () => null },
)

const getAvatarColor = (name: string) => {
  const colors = [
    'from-red-500 to-rose-500',
    'from-orange-500 to-amber-500',
    'from-green-500 to-emerald-500',
    'from-teal-500 to-cyan-500',
    'from-blue-500 to-indigo-500',
    'from-violet-500 to-purple-500',
    'from-fuchsia-500 to-pink-500'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function PlatformYonetimContent() {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: wsData, isLoading: wsLoading } = useWorkspace()
  const inviteCode = wsData?.inviteCode ?? ''
  const isSuperAdmin = wsData?.isSuperAdmin ?? false

  const {
    data: workspaces = [],
    isLoading: workspacesLoading,
    isError: workspacesError,
    error: workspacesQueryError,
  } = usePlatformWorkspaces(isSuperAdmin)

  const {
    data: pendingRequests = [],
    isLoading: moderationLoading,
  } = usePlatformModeration(isSuperAdmin)

  useEffect(() => {
    if (!isSuperAdmin) return
    const timer = window.setTimeout(() => {
      void import('./WorkspaceLicenseModal')
      void import('./ModerationReviewModal')
      void import('./UnresolvedOrdersAlert')
      void import('./RejectModerationDialog')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [isSuperAdmin])

  const refreshPlatform = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['platform-workspaces'] })
    queryClient.invalidateQueries({ queryKey: ['platform-moderation'] })
  }, [queryClient])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<PlatformWorkspaceItem | null>(null)

  // Independent users — add as candidate state
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteTimerId, setDeleteTimerId] = useState<NodeJS.Timeout | null>(null)
  const [deleteCountdown, setDeleteCountdown] = useState<number>(0)

  const [navConfirm, setNavConfirm] = useState<'payment' | 'landing' | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ModerationRequestItem | null>(null)
  const [rejectRequest, setRejectRequest] = useState<ModerationRequestItem | null>(null)
  const [, startModerationTransition] = useTransition()

  useBodyScrollLock(!!selectedWorkspace || !!selectedRequest || !!rejectRequest || navConfirm !== null)

  useEffect(() => {
    if (!wsLoading && !isSuperAdmin) {
      router.push('/pano')
      toast.error(t('platformPage.unauthorizedAccess'))
    }
  }, [isSuperAdmin, wsLoading, router, t])

  useEffect(() => {
    if (workspacesError) {
      toast.error(workspacesQueryError instanceof Error ? workspacesQueryError.message : 'Veriler yüklenirken bir hata oluştu.')
    }
  }, [workspacesError, workspacesQueryError])

  function handleOpenReview(req: ModerationRequestItem) {
    setSelectedRequest(req)
  }


  function handleQuickApprove(req: ModerationRequestItem) {
    if (!confirm('Bu içeriği düzenleme yapmadan doğrudan onaylamak istediğinize emin misiniz?')) return

    startModerationTransition(async () => {
      try {
        const res = await approveRequestAction(req.id, req.contentType, req.data)
        if (res.success) {
          toast.success('İçerik hızlıca onaylandı!')
          refreshPlatform()
        }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || 'Onaylama başarısız oldu.')
      }
    })
  }

  function handleRejectRequest(req: ModerationRequestItem) {
    setRejectRequest(req)
  }

  function confirmRejectRequest(reason: string) {
    if (!rejectRequest) return
    const req = rejectRequest
    setRejectRequest(null)

    startModerationTransition(async () => {
      try {
        const bilingual = await buildBilingualRejectReasonAction(reason, lang === 'en' ? 'en' : 'tr')
        const res = await rejectRequestAction(req.id, req.contentType, bilingual)
        if (res.success) {
          toast.success(t('moderationReview.rejectedToast'))
          refreshPlatform()
        }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || 'Reddetme işlemi başarısız oldu.')
      }
    })
  }



  // Filter workspaces based on search query
  const filtered = workspaces.filter(w => {
    const q = searchQuery.toLowerCase()
    return (
      w.workspaceName.toLowerCase().includes(q) ||
      w.ownerName.toLowerCase().includes(q) ||
      w.ownerEmail.toLowerCase().includes(q) ||
      (w.sponsorName && w.sponsorName.toLowerCase().includes(q)) ||
      (w.sponsorEmail && w.sponsorEmail.toLowerCase().includes(q))
    )
  })

  function buildInviteWaLink(code: string, name: string): string {
    const msg = t('platformPage.inviteWaMessage', { name, link: REGISTER_URL, code })
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  function buildPlatformWaLink(w: PlatformWorkspaceItem, code: string): string | null {
    if (w.isIndependent) {
      return buildInviteWaLink(code, w.ownerName)
    }
    return waHref(w.ownerPhone)
  }

  async function handleAddAsCandidate(workspaceId: string, email: string, name: string) {
    setAddingId(workspaceId)
    try {
      await addIndependentAsCandidateAction(email, name)
      setAddedIds(prev => new Set(prev).add(workspaceId))
      toast.success(t('platformPage.addedToPipeline', { name }))
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || t('platformPage.operationFailed'))
    } finally {
      setAddingId(null)
    }
  }

  async function handleDeleteUser(ownerId: string, email: string) {
    if (!confirm(t('platformPage.confirmDeleteUser', { email }))) return
    
    setDeletingUserId(ownerId)
    setDeleteCountdown(5)

    const timer = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          executeDeleteUser(ownerId, email)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setDeleteTimerId(timer)
  }

  function handleCancelDeleteUser() {
    if (deleteTimerId) clearInterval(deleteTimerId)
    setDeletingUserId(null)
    setDeleteCountdown(0)
    setDeleteTimerId(null)
    toast.info(t('platformPage.userDeletionCancelled'))
  }

  async function executeDeleteUser(ownerId: string, email: string) {
    try {
      await deleteUserAction(ownerId, email)
      toast.success(t('platformPage.userDeleted'))
      refreshPlatform()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || t('platformPage.deleteFailed'))
    } finally {
      setDeletingUserId(null)
      setDeleteCountdown(0)
      setDeleteTimerId(null)
    }
  }

  // Calculations for Admin KPIs
  const totalUsersCount = workspaces.length
  const independentCount = workspaces.filter(w => w.isIndependent).length
  const totalPaidCount = workspaces.filter(w => w.licenseType !== 'free').length
  const totalCandidatesCount = workspaces.reduce((acc, w) => acc + w.candidateCount, 0)
  const independentMembers = workspaces.filter(w => w.isIndependent)

  if (wsLoading) {
    return (
      <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="w-full space-y-6">
          <Skeleton className="h-16 w-full max-w-md rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </main>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6">

        {/* Çözülemeyen ödemeler — varsa en üstte uyarı */}
        <UnresolvedOrdersAlert />

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-md">
              <Crown className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-1)] flex items-center gap-2">
                {t('platformPage.consoleTitle')}
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t('platformPage.superAdmin')}
                </span>
              </h1>
              <p className="text-base text-[var(--text-3)] font-medium">
                {t('platformPage.consoleSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setNavConfirm('payment')}
              className="rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
            >
              {t('platformPage.openPaymentPage')}
            </button>
            <button
              type="button"
              onClick={() => setNavConfirm('landing')}
              className="rounded-lg border border-violet-300/80 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-900 shadow-sm transition hover:bg-violet-100 active:scale-[0.98] dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/60"
            >
              {t('platformPage.openLandingPage')}
            </button>
          </div>
        </header>

        {/* Platform KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* KPI 1 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
              {t('platformPage.kpiTotalLeaders')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--text-1)]">{totalUsersCount}</span>
              <Users className="h-4.5 w-4.5 text-[var(--text-3)] ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {t('platformPage.kpiTotalLeadersDesc')}
            </p>
          </div>

          {/* KPI 2 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-purple-600 dark:text-purple-400">
              {t('platformPage.kpiIndependent')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{independentCount}</span>
              <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400 ml-auto animate-pulse" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {t('platformPage.kpiIndependentDesc')}
            </p>
          </div>

          {/* KPI 3 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-emerald-600 dark:text-emerald-400">
              {t('platformPage.kpiPaid')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{totalPaidCount}</span>
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {t('platformPage.kpiPaidDesc')}
            </p>
          </div>

          {/* KPI 4 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-blue-600 dark:text-blue-400">
              {t('platformPage.kpiProspects')}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalCandidatesCount}</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {t('platformPage.kpiProspectsDesc')}
            </p>
          </div>
        </div>

        {/* Bağımsız Üyeler — Independent Signups */}
        {independentMembers.length > 0 && (
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
                return (
                  <div
                    key={w.workspaceId}
                    onClick={detailHref ? () => router.push(detailHref) : undefined}
                    className={`flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm ${detailHref ? 'cursor-pointer hover:bg-[var(--bg-subtle)]/75 transition-colors' : ''}`}
                  >



                    {w.avatarUrl ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden shadow">
                        <img src={w.avatarUrl} alt={w.ownerName} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(w.ownerName)} text-base font-black text-white shadow`}>
                        {w.ownerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--text-1)] truncate">{w.ownerName}</div>
                      <div className="text-[10px] text-[var(--text-3)] truncate">{w.ownerEmail}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const waLink = buildPlatformWaLink(w, inviteCode)
                        if (!waLink) return null
                        return (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            title={t('platformPage.shareInviteWhatsApp')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </a>
                        )
                      })()}
                      <button
                        onClick={() => handleAddAsCandidate(w.workspaceId, w.ownerEmail, w.ownerName)}
                        disabled={addingId === w.workspaceId || isAdded}
                        title={t('platformPage.addToPipelineTitle')}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          isAdded
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                            : 'bg-[#534AB7]/10 text-[#534AB7] dark:text-white dark:bg-white/10 hover:bg-[#534AB7] hover:text-white disabled:opacity-50'
                        }`}
                      >
                        {addingId === w.workspaceId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAdded ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Search bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('platformPage.searchPlaceholder')}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-base text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
          />
        </div>

        {/* Workspaces Spreadsheet Grid */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] no-swipe" data-no-swipe="true">
            <table className="w-full table-fixed text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                  <th className="w-[24%] px-2 py-2 font-semibold">{t('platformPage.thLeaderName')}</th>
                  <th className="w-[12%] px-2 py-2 font-semibold">{t('platformPage.thWorkspaceName')}</th>
                  <th className="w-[9%] px-2 py-2 font-semibold">{t('platformPage.thLicensePlan')}</th>
                  <th className="w-[7%] px-2 py-2 font-semibold text-center">{t('platformPage.thCandidates')}</th>
                  <th className="w-[7%] px-2 py-2 font-semibold text-center">{t('platformPage.thDownlines')}</th>
                  <th className="w-[14%] px-2 py-2 font-semibold">{t('platformPage.thSponsor')}</th>
                  <th className="w-[11%] px-2 py-2 font-semibold text-center">{t('platformPage.thExpiry')}</th>
                  <th className="w-[10%] px-2 py-2 font-semibold text-center">{t('platformPage.thRegistration')}</th>
                  <th className="w-[6%] px-2 py-2 font-semibold text-right">{t('platformPage.thActions')}</th>
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

                    return (
                      <tr
                        key={w.workspaceId}
                        onClick={detailHref ? () => router.push(detailHref) : undefined}
                        className={`hover:bg-[var(--bg-subtle)]/75 transition-colors ${detailHref ? 'cursor-pointer' : ''}`}
                      >
                        {/* 1. Leader */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {w.avatarUrl ? (
                              <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden border border-[var(--border)] shadow-sm">
                                <img src={w.avatarUrl} alt={w.ownerName} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(w.ownerName)} text-[10px] font-black text-white shadow-sm`}>
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

                        {/* 2. Workspace name */}
                        <td className="px-2 py-2 font-medium truncate">{w.workspaceName}</td>

                        {/* 3. License type */}
                        <td className="px-2 py-2 whitespace-nowrap font-bold">
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

                        {/* 4. Candidates count */}
                        <td className="px-2 py-2 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">{w.candidateCount}</td>

                        {/* 5. Team count */}
                        <td className="px-2 py-2 text-center font-bold text-[#534AB7] tabular-nums">{w.downlineCount}</td>

                        {/* 6. Sponsor linkage */}
                        <td className="px-2 py-2 font-semibold">
                          {w.isIndependent ? (
                            <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-black text-purple-600 dark:text-purple-400 truncate">
                              💎 {t('platformPage.independentDirect')}
                            </span>
                          ) : (
                            <span className="truncate block text-[var(--text-1)]">{w.sponsorName}</span>
                          )}
                        </td>

                        {/* 7. Expiry */}
                        <td className={`px-2 py-2 text-center tabular-nums font-semibold whitespace-nowrap ${isExpired ? 'text-red-500 font-bold' : ''}`}>
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

                        {/* 8. Registration Date */}
                        <td className="px-2 py-2 text-center text-xs text-[var(--text-3)] font-semibold tabular-nums whitespace-nowrap">{regDate}</td>

                        {/* 9. Actions */}
                        <td className="px-2 py-2 whitespace-nowrap text-right">
                          <div className="inline-flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const waLink = buildPlatformWaLink(w, inviteCode)
                              if (!waLink) return null
                              return (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={
                                    w.isIndependent
                                      ? t('platformPage.shareInviteWhatsApp')
                                      : t('platformPage.openWhatsAppChat')
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                                >
                                  <WhatsAppIcon className="h-4 w-4" />
                                </a>
                              )
                            })()}

                            {/* License adjustment trigger */}
                            <button
                              onClick={() => setSelectedWorkspace(w)}
                              title={t('platformPage.manageLicenseTitle')}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#534AB7]/10 text-[#534AB7] transition hover:bg-[#534AB7] hover:text-white"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            {/* Delete User trigger */}
                            {deletingUserId === w.ownerId ? (
                              <button
                                onClick={handleCancelDeleteUser}
                                title={t('platformPage.cancelDeletion')}
                                className="flex h-7 px-2 items-center justify-center rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition min-w-[4rem]"
                              >
                                {t('platformPage.undoLabel')} ({deleteCountdown})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(w.ownerId, w.ownerEmail)}
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
          </div>
        </section>

        {/* İçerik ve İtiraz Talepleri Onay Masası */}
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-1)]">
              İçerik ve İtiraz Talepleri Onay Masası
              {pendingRequests.length > 0 && (
                <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
            <span className="text-[10px] text-[var(--text-3)] font-semibold ml-auto hidden sm:block">
              NMM ailesinden gelen özgün içerik ve itiraz ekleme taleplerini inceleyin.
            </span>
          </div>

          {moderationLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-8 text-center text-sm text-[var(--text-3)] italic">
              Bekleyen herhangi bir onay talebi bulunmamaktadır. 🎉 Ekip üyeleri içerik ekledikçe burada listelenecektir.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map(req => {
                const dateStr = new Date(req.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                const isTraining = req.contentType === 'training'
                const title = isTraining ? (req.data.baslik ?? 'İsimsiz İçerik') : (req.data.soru?.tr ?? req.data.soru ?? 'İsimsiz İtiraz')
                const category = isTraining ? (req.data.kategoriBaslik ?? 'Zihniyet') : (req.data.kategori?.tr ?? req.data.kategori ?? 'Genel')
                const preview = isTraining ? (req.data.ozet ?? 'Özet bulunmuyor.') : (req.data.kisaCevap ?? 'Kısa cevap bulunmuyor.')

                return (
                  <div key={req.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isTraining ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {isTraining ? <BookOpen className="h-2.5 w-2.5" /> : <MessageSquare className="h-2.5 w-2.5" />}
                          {isTraining ? 'Vaktin Varsa' : 'İtiraz'}
                        </span>
                        <span className="text-[9px] text-[var(--text-3)] font-bold">{dateStr}</span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-1)] line-clamp-1 flex items-center gap-1">
                          <span className="text-base shrink-0">{req.data.emoji}</span>
                          {title}
                        </h3>
                        <p className="text-[10px] text-[var(--text-3)] font-semibold mt-0.5 truncate">Kategori: {category}</p>
                      </div>

                      <p className="text-[11px] text-[var(--text-2)] line-clamp-2 leading-relaxed bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border)] font-medium">
                        {preview}
                      </p>

                      <div className="text-[10px] text-[var(--text-3)] font-semibold space-y-0.5 border-t border-[var(--border)] pt-2">
                        <div className="truncate"><strong>Gönderen:</strong> {req.userName}</div>
                        <div className="truncate"><strong>E-posta:</strong> {req.userEmail}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => handleOpenReview(req)}
                        className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--border)] text-[var(--text-2)] py-2 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                      >
                        İncele & Düzenle
                      </button>
                      <button
                        onClick={() => handleQuickApprove(req)}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-sm"
                      >
                        Hızlı Onayla
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req)}
                        className="rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 p-2 text-[10px] font-bold transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                        title="Reddet ve Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {selectedWorkspace && (
          <WorkspaceLicenseModal
            workspace={selectedWorkspace}
            onClose={() => setSelectedWorkspace(null)}
            onSuccess={refreshPlatform}
          />
        )}

        {selectedRequest && (
          <ModerationReviewModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onSuccess={refreshPlatform}
          />
        )}

      </div>

      {navConfirm === 'payment' && (
        <ConfirmDialog
          message={t('platformPage.confirmGoPayment')}
          onConfirm={() => {
            setNavConfirm(null)
            router.push('/odeme')
          }}
          onCancel={() => setNavConfirm(null)}
        />
      )}
      {navConfirm === 'landing' && (
        <ConfirmDialog
          message={t('platformPage.confirmGoLanding')}
          onConfirm={() => {
            setNavConfirm(null)
            router.push('/acilis')
          }}
          onCancel={() => setNavConfirm(null)}
        />
      )}
      {rejectRequest && (
        <RejectModerationDialog
          defaultReason={defaultRejectReason(lang === 'en' ? 'en' : 'tr')}
          onConfirm={confirmRejectRequest}
          onCancel={() => setRejectRequest(null)}
        />
      )}
    </main>
  )
}
