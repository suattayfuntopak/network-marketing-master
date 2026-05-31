'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  Crown, Users, ShieldCheck, Search,
  Mail, Sparkles, UserPlus, BookOpen, MessageSquare,
  Plus, Loader2, X, ArrowUpRight, CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { Z } from '@/lib/ui/zIndex'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { waHref } from '@/lib/utils/waLink'
import {
  getPlatformWorkspacesAction,
  adminExtendLicenseAction,
  addIndependentAsCandidateAction,
  deleteUserAction,
  type PlatformWorkspaceItem
} from '../actions'
import {
  getPendingRequestsAction,
  approveRequestAction,
  rejectRequestAction,
  type ModerationRequestItem
} from '@/app/(dashboard)/actions/moderation'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { REGISTER_URL } from '@/lib/domain/constants'

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

  // Moderation state
  const [pendingRequests, setPendingRequests] = useState<ModerationRequestItem[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ModerationRequestItem | null>(null)
  
  // Fields for editing submissions
  const [editTitle, setEditTitle] = useState('')
  const [editOzet, setEditOzet] = useState('')
  const [editIcerik, setEditIcerik] = useState('')
  const [editKisaCevap, setEditKisaCevap] = useState('')
  const [editDetayliCevap, setEditDetayliCevap] = useState('')
  const [editYaklasim, setEditYaklasim] = useState('')
  const [editOrnekDiyalog, setEditOrnekDiyalog] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const [isModerating, startModerationTransition] = useTransition()

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

      const requests = await getPendingRequestsAction()
      setPendingRequests(requests)
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

  function handleOpenReview(req: ModerationRequestItem) {
    setSelectedRequest(req)
    const d = req.data
    if (req.contentType === 'training') {
      setEditTitle(d.baslik ?? '')
      setEditOzet(d.ozet ?? '')
      setEditIcerik(Array.isArray(d.maddeler) ? d.maddeler.join('\n') : '')
      setEditCategory(d.kategoriBaslik ?? 'Zihniyet')
      setEditEmoji(d.emoji ?? '📖')
      setEditTags(Array.isArray(d.tags) ? d.tags.join(', ') : '')
    } else {
      setEditTitle(d.soru?.tr ?? d.soru ?? '')
      setEditCategory(d.kategori?.tr ?? d.kategori ?? 'Genel')
      setEditKisaCevap(d.kisaCevap ?? '')
      setEditDetayliCevap(d.detayliCevap ?? '')
      setEditYaklasim(d.yaklasim ?? '')
      setEditOrnekDiyalog(d.ornekDiyalog ?? '')
      setEditEmoji(d.emoji ?? '🛡️')
      setEditTags(Array.isArray(d.tags) ? d.tags.join(', ') : '')
    }
  }

  function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRequest) return

    startModerationTransition(async () => {
      try {
        let edited: Record<string, any> = {}
        const d = selectedRequest.data

        if (selectedRequest.contentType === 'training') {
          edited = {
            ...d,
            baslik: editTitle,
            ozet: editOzet || editIcerik.slice(0, 100) + '...',
            maddeler: editIcerik.split('\n').map(l => l.trim()).filter(Boolean),
            kategoriBaslik: editCategory,
            kategoriId: editCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-'),
            emoji: editEmoji,
            tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          }
        } else {
          edited = {
            ...d,
            kategori: { tr: editCategory, en: editCategory },
            soru: { tr: editTitle, en: editTitle },
            emoji: editEmoji,
            kisaCevap: editKisaCevap,
            detayliCevap: editDetayliCevap,
            yaklasim: editYaklasim,
            ornekDiyalog: editOrnekDiyalog,
            tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          }
        }

        const res = await approveRequestAction(selectedRequest.id, selectedRequest.contentType, edited)
        if (res.success) {
          toast.success('İçerik başarıyla onaylandı ve yayına alındı!')
          setSelectedRequest(null)
          loadData()
        }
      } catch (err: any) {
        toast.error(err.message || 'Onaylama başarısız oldu.')
      }
    })
  }

  function handleQuickApprove(req: ModerationRequestItem) {
    if (!confirm('Bu içeriği düzenleme yapmadan doğrudan onaylamak istediğinize emin misiniz?')) return

    startModerationTransition(async () => {
      try {
        const res = await approveRequestAction(req.id, req.contentType, req.data)
        if (res.success) {
          toast.success('İçerik hızlıca onaylandı!')
          loadData()
        }
      } catch (err: any) {
        toast.error(err.message || 'Onaylama başarısız oldu.')
      }
    })
  }

  async function handleRejectRequest(req: ModerationRequestItem) {
    if (!confirm('Bu talebi reddetmek ve silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)')) return

    startModerationTransition(async () => {
      try {
        const res = await rejectRequestAction(req.id, req.contentType)
        if (res.success) {
          toast.success('Talep reddedildi ve silindi.')
          loadData()
        }
      } catch (err: any) {
        toast.error(err.message || 'Reddetme işlemi başarısız oldu.')
      }
    })
  }

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

        {/* İçerik ve İtiraz Talepleri Onay Masası */}
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text-1)]">
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

          {pendingRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] py-8 text-center text-xs text-[var(--text-3)] italic">
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
                        <h3 className="text-xs font-bold text-[var(--text-1)] line-clamp-1 flex items-center gap-1">
                          <span className="text-sm shrink-0">{req.data.emoji}</span>
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

        {/* Moderasyon Talebi İnceleme Modal */}
        {selectedRequest && (
          <>
            <div 
              className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/60 backdrop-blur-sm`} 
              onClick={() => setSelectedRequest(null)} 
            />
            <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden my-auto max-h-[85vh] overflow-y-auto`}>
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
              
              <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--text-1)]">
                    Talebi İncele & Onayla
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setSelectedRequest(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-[var(--bg-subtle)] p-3 text-xs leading-relaxed text-[var(--text-2)] font-semibold border border-[var(--border)] space-y-0.5">
                  <div><strong>Gönderen:</strong> {selectedRequest.userName} ({selectedRequest.userEmail})</div>
                  <div><strong>Tür:</strong> {selectedRequest.contentType === 'training' ? 'Vaktin Varsa (Eğitim)' : 'İtirazlara Cevap'}</div>
                </div>

                {/* Edit Title/Soru */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-1)]">
                    {selectedRequest.contentType === 'training' ? 'Eğitim Başlığı' : 'İtiraz Sorusu'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                  />
                </div>

                {/* Edit Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-1)]">Kategori</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                  />
                </div>

                {selectedRequest.contentType === 'training' ? (
                  <>
                    {/* Training Ozet */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">Özet</label>
                      <input
                        type="text"
                        required
                        value={editOzet}
                        onChange={e => setEditOzet(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                      />
                    </div>

                    {/* Training Icerik (Maddeler) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">İçerik Maddeleri (Her satır yeni madde)</label>
                      <textarea
                        rows={4}
                        required
                        value={editIcerik}
                        onChange={e => setEditIcerik(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Objection Kisa Cevap */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">Kısa Cevap</label>
                      <textarea
                        rows={2}
                        value={editKisaCevap}
                        onChange={e => setEditKisaCevap(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-1)] outline-none focus:border-[#9B1D47] transition resize-none"
                      />
                    </div>

                    {/* Objection Detayli Cevap */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">Detaylı Cevap</label>
                      <textarea
                        rows={3}
                        value={editDetayliCevap}
                        onChange={e => setEditDetayliCevap(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-1)] outline-none focus:border-[#9B1D47] transition resize-none"
                      />
                    </div>

                    {/* Objection Yaklasim */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">Yaklaşım</label>
                      <textarea
                        rows={2}
                        value={editYaklasim}
                        onChange={e => setEditYaklasim(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-1)] outline-none focus:border-[#9B1D47] transition resize-none"
                      />
                    </div>

                    {/* Objection Ornek Diyalog */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--text-1)]">Örnek Diyalog</label>
                      <textarea
                        rows={2}
                        value={editOrnekDiyalog}
                        onChange={e => setEditOrnekDiyalog(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-xs text-[var(--text-1)] outline-none focus:border-[#9B1D47] transition resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields: Emoji & Tags */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-1)]">Emoji</label>
                    <input
                      type="text"
                      required
                      value={editEmoji}
                      onChange={e => setEditEmoji(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-1)]">Etiketler (Virgülle Ayır)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={e => setEditTags(e.target.value)}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(selectedRequest)}
                    className="flex-1 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 py-3 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                    disabled={isModerating}
                  >
                    Reddet / Sil
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                    disabled={isModerating}
                  >
                    {isModerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Onaylanıyor...</span>
                      </>
                    ) : (
                      <span>Onayla & Yayınla</span>
                    )}
                  </button>
                </div>
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
            router.push('/acilis')
          }}
          onCancel={() => setNavConfirm(null)}
        />
      )}
    </main>
  )
}
