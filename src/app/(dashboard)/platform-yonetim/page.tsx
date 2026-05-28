'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  Crown, Users, ShieldCheck, Search,
  Mail, Sparkles, UserPlus,
  Plus, Loader2, X, ArrowUpRight, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import {
  getPlatformWorkspacesAction,
  adminExtendLicenseAction,
  addIndependentAsCandidateAction,
  deleteUserAction,
  type PlatformWorkspaceItem
} from './actions'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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

export default function PlatformAdminPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: usage, isLoading: usageLoading } = useAIUsage()
  
  const { data: wsData } = useWorkspace()
  const inviteCode = wsData?.inviteCode ?? ''

  const [workspaces, setWorkspaces] = useState<PlatformWorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<PlatformWorkspaceItem | null>(null)

  // Independent users — add as candidate state
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteTimerId, setDeleteTimerId] = useState<NodeJS.Timeout | null>(null)
  const [deleteCountdown, setDeleteCountdown] = useState<number>(0)

  // Extension Modal states
  const [licenseType, setLicenseType] = useState<'free' | 'leader' | 'master' | 'pro'>('master')
  const [extensionDays, setExtensionDays] = useState(30)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [isUpdating, startUpdateTransition] = useTransition()
  const [navConfirm, setNavConfirm] = useState<'payment' | 'landing' | null>(null)

  const isSuperAdmin = usage?.isSuperAdmin ?? false

  useEffect(() => {
    // If loading finishes and user is not super admin, bounce them out!
    if (!usageLoading && !isSuperAdmin) {
      router.push('/pano')
      toast.error(t('platformPage.unauthorizedAccess'))
    }
  }, [isSuperAdmin, usageLoading, router, t])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPlatformWorkspacesAction()
      setWorkspaces(data)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Veriler yüklenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      loadData()
    }
  }, [isSuperAdmin, loadData])

  function handleSaveLicense(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedWorkspace) return

    startUpdateTransition(async () => {
      try {
        const res = await adminExtendLicenseAction(
          selectedWorkspace.workspaceId,
          licenseType,
          Number(extensionDays),
          isUnlimited
        )
        if (res.success) {
          toast.success(t('platformPage.licenseUpdated'))
          setSelectedWorkspace(null)
          loadData() // Reload table
        }
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || 'İşlem başarısız.')
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nmm.app'
    const inviteUrl = `${appUrl}/kayit?ref=${code}`
    const msg = t('platformPage.inviteWaMessage', { name, link: inviteUrl })
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  async function handleAddAsCandidate(workspaceId: string, email: string, name: string) {
    setAddingId(workspaceId)
    try {
      await addIndependentAsCandidateAction(email, name)
      setAddedIds(prev => new Set(prev).add(workspaceId))
      toast.success(t('platformPage.addedToPipeline', { name }))
    } catch (err: any) {
      toast.error(err.message || t('platformPage.operationFailed'))
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
      loadData()
    } catch (err: any) {
      toast.error(err.message || t('platformPage.deleteFailed'))
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

  if (usageLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] text-[var(--text-1)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#534AB7]" />
        <p className="mt-3 text-sm text-[var(--text-2)] font-semibold animate-pulse">
          {t('platformPage.loadingGrid')}
        </p>
      </div>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-md">
              <Crown className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-1)] flex items-center gap-2">
                {t('platformPage.consoleTitle')}
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t('platformPage.superAdmin')}
                </span>
              </h1>
              <p className="text-sm text-[var(--text-3)] font-medium">
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
              <span className="text-2xl font-black text-[var(--text-1)]">{totalUsersCount}</span>
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
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{independentCount}</span>
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
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{totalPaidCount}</span>
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
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalCandidatesCount}</span>
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
              <h2 className="text-sm font-bold text-[var(--text-1)]">
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
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(w.ownerName)} text-sm font-black text-white shadow`}>
                        {w.ownerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[var(--text-1)] truncate">{w.ownerName}</div>
                      <div className="text-[10px] text-[var(--text-3)] truncate">{w.ownerEmail}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={buildInviteWaLink(inviteCode, w.ownerName)}
                        target="_blank"
                        rel="noreferrer"
                        title={t('platformPage.sendInviteWhatsApp')}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleAddAsCandidate(w.workspaceId, w.ownerEmail, w.ownerName)}
                        disabled={addingId === w.workspaceId || isAdded}
                        title={t('platformPage.addToPipelineTitle')}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                          isAdded
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                            : 'bg-[#534AB7]/10 text-[#534AB7] hover:bg-[#534AB7] hover:text-white disabled:opacity-50'
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
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
          />
        </div>

        {/* Workspaces Spreadsheet Grid */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] no-swipe" data-no-swipe="true">
            <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                  <th className="p-3 font-semibold">{t('platformPage.thLeaderName')}</th>
                  <th className="p-3 font-semibold">{t('platformPage.thWorkspaceName')}</th>
                  <th className="p-3 font-semibold">{t('platformPage.thLicensePlan')}</th>
                  <th className="p-3 font-semibold text-center">{t('platformPage.thCandidates')}</th>
                  <th className="p-3 font-semibold text-center">{t('platformPage.thDownlines')}</th>
                  <th className="p-3 font-semibold">{t('platformPage.thSponsor')}</th>
                  <th className="p-3 font-semibold text-center">{t('platformPage.thExpiry')}</th>
                  <th className="p-3 font-semibold text-center">{t('platformPage.thRegistration')}</th>
                  <th className="p-3 font-semibold text-right">{t('platformPage.thActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-[var(--text-3)] italic">
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
                        <td className="p-3 whitespace-nowrap">




                          <div className="flex items-center gap-3">
                            {w.avatarUrl ? (
                              <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden border border-[var(--border)] shadow-sm">
                                <img src={w.avatarUrl} alt={w.ownerName} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarColor(w.ownerName)} text-[10px] font-black text-white shadow-sm`}>
                                {w.ownerName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[var(--text-1)]">{w.ownerName}</div>
                              <div className="text-xs text-[var(--text-3)] font-semibold flex items-center gap-1">
                                <Mail className="h-3 w-3 shrink-0" />
                                {w.ownerEmail}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Workspace name */}
                        <td className="p-3 font-medium whitespace-nowrap">{w.workspaceName}</td>

                        {/* 3. License type */}
                        <td className="p-3 whitespace-nowrap font-bold">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                            w.licenseType === 'pro'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : w.licenseType === 'master'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                : w.licenseType === 'leader'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                  : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {w.licenseType}
                          </span>
                        </td>

                        {/* 4. Candidates count */}
                        <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400 tabular-nums">{w.candidateCount}</td>

                        {/* 5. Team count */}
                        <td className="p-3 text-center font-bold text-[#534AB7] tabular-nums">{w.downlineCount}</td>

                        {/* 6. Sponsor linkage */}
                        <td className="p-3 whitespace-nowrap font-semibold">
                          {w.isIndependent ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-600 dark:text-purple-400">
                              💎 {t('platformPage.independentDirect')}
                            </span>
                          ) : (
                            <span className="max-w-[160px] truncate block text-[var(--text-1)]">{w.sponsorName}</span>
                          )}
                        </td>

                        {/* 7. Expiry */}
                        <td className={`p-3 text-center tabular-nums font-semibold whitespace-nowrap ${isExpired ? 'text-red-500 font-bold' : ''}`}>
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
                        <td className="p-3 text-center text-xs text-[var(--text-3)] font-semibold tabular-nums whitespace-nowrap">{regDate}</td>

                        {/* 9. Actions */}
                        <td className="p-3 whitespace-nowrap text-right">
                          <div className="inline-flex gap-2.5" onClick={(e) => e.stopPropagation()}>
                            {/* WhatsApp — share invite link */}
                            <a
                              href={buildInviteWaLink(inviteCode, w.ownerName)}
                              target="_blank"
                              rel="noreferrer"
                              title={t('platformPage.shareInviteWhatsApp')}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>

                            {/* License adjustment trigger */}
                            <button
                              onClick={() => {
                                setSelectedWorkspace(w)
                                setLicenseType(
                                  w.licenseType === 'free' ||
                                    w.licenseType === 'leader' ||
                                    w.licenseType === 'master' ||
                                    w.licenseType === 'pro'
                                    ? w.licenseType
                                    : 'free'
                                )
                                setIsUnlimited(w.licenseType !== 'free' && w.licenseExpiresAt === null)
                                setExtensionDays(30)
                              }}
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
                                className="flex h-7 px-2 items-center justify-center rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition min-w-[4rem]"
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

        {/* Lisans Yönetim Modal */}
        {selectedWorkspace && (
          <>
            <div 
              className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/60 backdrop-blur-sm`} 
              onClick={() => setSelectedWorkspace(null)} 
            />
            <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden`}>
              {/* Header bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#534AB7] to-amber-500" />
              
              <form onSubmit={handleSaveLicense} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-1)]">
                    {t('platformPage.manageWorkspaceLicense')}
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setSelectedWorkspace(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-2)] font-semibold border border-[var(--border)]">
                  <div><strong>{t('platformPage.userLabel')}</strong> {selectedWorkspace.ownerName}</div>
                  <div className="mt-1"><strong>{t('platformPage.emailLabel')}</strong> {selectedWorkspace.ownerEmail}</div>
                  <div className="mt-1"><strong>{t('platformPage.currentExpiryLabel')}</strong> {
                    selectedWorkspace.licenseType !== 'free' && !selectedWorkspace.licenseExpiresAt
                      ? t('platformPage.unlimitedWithIcon')
                      : selectedWorkspace.licenseExpiresAt
                        ? new Date(selectedWorkspace.licenseExpiresAt).toLocaleString()
                        : '-'
                  }</div>
                </div>

                {/* Plan select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-1)]">
                    {t('platformPage.licenseLevel')}
                  </label>
                  <select
                    value={licenseType}
                    onChange={e => {
                      const v = e.target.value as typeof licenseType
                      setLicenseType(v)
                      if (v === 'free') setIsUnlimited(false)
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                  >
                    <option value="free">{t('platformPage.freeRevoke')}</option>
                    <option value="leader">Leader</option>
                    <option value="master">Master</option>
                    <option value="pro">Pro (Süper Lider)</option>
                  </select>
                </div>

                {/* Süresiz toggle + Gün girişi */}
                {licenseType !== 'free' && (
                  <>
                    {/* Süresiz toggle */}
                    <button
                      type="button"
                      onClick={() => setIsUnlimited(v => !v)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                        isUnlimited
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]'
                      }`}
                    >
                      <span>{t('platformPage.unlimitedAccess')}</span>
                      <span className={`h-4 w-8 rounded-full transition-colors ${isUnlimited ? 'bg-emerald-500' : 'bg-[var(--border)]'} relative`}>
                        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${isUnlimited ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </span>
                    </button>

                    {/* Gün girişi — sadece süreli seçiliyse */}
                    {!isUnlimited && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--text-1)]">
                          {t('platformPage.extendAccessDays')}
                          <span className="ml-1 font-normal text-[var(--text-3)]">
                            {t('platformPage.extendAccessHint')}
                          </span>
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={extensionDays}
                          onChange={e => setExtensionDays(Number(e.target.value))}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t('platformPage.saving')}</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {t('platformPage.upgradeSave')}</>
                  )}
                </button>
              </form>
            </div>
          </>
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
            router.push('/')
          }}
          onCancel={() => setNavConfirm(null)}
        />
      )}
    </main>
  )
}
