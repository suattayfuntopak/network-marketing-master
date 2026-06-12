'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePlatformWorkspaces, usePlatformModeration } from '@/hooks/usePlatformAdmin'
import { Crown, CreditCard, LayoutTemplate, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import {
  type PlatformWorkspaceItem
} from '../actions'
import {
  addIndependentAsCandidateAction,
  claimIndependentSignupToTeamAction,
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
import { PageHelp } from '@/components/ui/PageHelp'
import {
  defaultRejectReason,
} from '@/lib/domain/moderationDefaults'
import { PlatformKpiCards } from './PlatformKpiCards'
import { PlatformIndependentSection } from './PlatformIndependentSection'
import { PlatformWorkspacesTable } from './PlatformWorkspacesTable'
import { PlatformModerationDesk } from './PlatformModerationDesk'

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

  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [claimingId, setClaimingId] = useState<string | null>(null)
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

  function handleOpenReview(req: ModerationRequestItem) { setSelectedRequest(req) }

  function handleQuickApprove(req: ModerationRequestItem) {
    if (!confirm('Bu içeriği düzenleme yapmadan doğrudan onaylamak istediğinize emin misiniz?')) return
    startModerationTransition(async () => {
      try {
        const res = await approveRequestAction(req.id, req.contentType, req.data)
        if (res.success) { toast.success('İçerik hızlıca onaylandı!'); refreshPlatform() }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || 'Onaylama başarısız oldu.')
      }
    })
  }

  function handleRejectRequest(req: ModerationRequestItem) { setRejectRequest(req) }

  function confirmRejectRequest(reason: string) {
    if (!rejectRequest) return
    const req = rejectRequest
    setRejectRequest(null)
    startModerationTransition(async () => {
      try {
        const bilingual = await buildBilingualRejectReasonAction(reason, lang === 'en' ? 'en' : 'tr')
        const res = await rejectRequestAction(req.id, req.contentType, bilingual)
        if (res.success) { toast.success(t('moderationReview.rejectedToast')); refreshPlatform() }
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : '') || 'Reddetme işlemi başarısız oldu.')
      }
    })
  }

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

  async function handleAddAsCandidate(workspaceId: string, email: string, name: string) {
    setAddingId(workspaceId)
    try {
      await addIndependentAsCandidateAction(email, name)
      setAddedIds(prev => new Set(prev).add(workspaceId))
      toast.success(t('platformPage.addedToPipeline', { name }))
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || t('platformPage.operationFailed'))
    } finally { setAddingId(null) }
  }

  async function handleClaimToTeam(workspaceId: string, name: string) {
    setClaimingId(workspaceId)
    try {
      await claimIndependentSignupToTeamAction(workspaceId)
      toast.success(t('platformPage.linkedToTeam', { name }))
      refreshPlatform()
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : '') || t('platformPage.operationFailed'))
    } finally { setClaimingId(null) }
  }

  async function handleDeleteUser(ownerId: string, email: string) {
    if (!confirm(t('platformPage.confirmDeleteUser', { email }))) return
    setDeletingUserId(ownerId)
    setDeleteCountdown(5)
    const timer = setInterval(() => {
      setDeleteCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); executeDeleteUser(ownerId); return 0 }
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

  async function executeDeleteUser(ownerId: string) {
    try {
      await deleteUserAction(ownerId)
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

  const totalUsersCount = workspaces.length
  const independentCount = workspaces.filter(w => w.isIndependent).length
  const totalPaidCount = workspaces.filter(w => w.licenseType !== 'free').length
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

        <UnresolvedOrdersAlert />

        <header className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-md">
              <Crown className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] flex flex-wrap items-center gap-2">
                <span className="truncate">{t('platformPage.consoleTitle')}</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0">
                  {t('platformPage.superAdmin')}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 flex-row gap-1.5 sm:gap-2 items-center">
            <PageHelp />
            <button
              type="button"
              onClick={() => setNavConfirm('payment')}
              aria-label={t('platformPage.openPaymentPage')}
              title={t('platformPage.openPaymentPage')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/80 bg-emerald-50 text-emerald-900 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60 md:hidden"
            >
              <CreditCard className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setNavConfirm('landing')}
              aria-label={t('platformPage.openLandingPage')}
              title={t('platformPage.openLandingPage')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-300/80 bg-violet-50 text-violet-900 shadow-sm transition hover:bg-violet-100 active:scale-[0.98] dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/60 md:hidden"
            >
              <LayoutTemplate className="h-4.5 w-4.5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setNavConfirm('payment')}
              className="hidden rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-100 active:scale-[0.98] dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60 whitespace-nowrap md:inline-flex"
            >
              {t('platformPage.openPaymentPage')}
            </button>
            <button
              type="button"
              onClick={() => setNavConfirm('landing')}
              className="hidden rounded-lg border border-violet-300/80 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-900 shadow-sm transition hover:bg-violet-100 active:scale-[0.98] dark:border-violet-700/60 dark:bg-violet-950/40 dark:text-violet-100 dark:hover:bg-violet-950/60 whitespace-nowrap md:inline-flex"
            >
              {t('platformPage.openLandingPage')}
            </button>
          </div>
        </header>

        <PlatformKpiCards
          totalUsersCount={totalUsersCount}
          independentCount={independentCount}
          totalPaidCount={totalPaidCount}
          pendingCount={pendingRequests.length}
        />

        {independentMembers.length > 0 && (
          <PlatformIndependentSection
            inviteCode={inviteCode}
            independentMembers={independentMembers}
            addingId={addingId}
            addedIds={addedIds}
            claimingId={claimingId}
            onAddAsCandidate={handleAddAsCandidate}
            onClaimToTeam={handleClaimToTeam}
          />
        )}

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('platformPage.searchPlaceholder')}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-base text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand focus:ring-1 focus:ring-[#534AB7] transition-all"
          />
        </div>

        <PlatformWorkspacesTable
          inviteCode={inviteCode}
          filtered={filtered}
          workspacesLoading={workspacesLoading}
          deletingUserId={deletingUserId}
          deleteCountdown={deleteCountdown}
          onOpenLicense={setSelectedWorkspace}
          onDeleteUser={handleDeleteUser}
          onCancelDelete={handleCancelDeleteUser}
        />

        <PlatformModerationDesk
          pendingRequests={pendingRequests}
          moderationLoading={moderationLoading}
          onOpenReview={handleOpenReview}
          onQuickApprove={handleQuickApprove}
          onRejectRequest={handleRejectRequest}
        />


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
          onConfirm={() => { setNavConfirm(null); router.push('/odeme') }}
          onCancel={() => setNavConfirm(null)}
        />
      )}
      {navConfirm === 'landing' && (
        <ConfirmDialog
          message={t('platformPage.confirmGoLanding')}
          onConfirm={() => { setNavConfirm(null); router.push('/acilis') }}
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
