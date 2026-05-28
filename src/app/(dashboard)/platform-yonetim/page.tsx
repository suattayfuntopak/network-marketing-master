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
import { Z } from '@/lib/zIndex'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import {
  getPlatformWorkspacesAction,
  adminExtendLicenseAction,
  addIndependentAsCandidateAction,
  type PlatformWorkspaceItem
} from './actions'

export default function PlatformAdminPage() {
  const { lang } = useTranslation()
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

  // Extension Modal states
  const [licenseType, setLicenseType] = useState<'free' | 'leader' | 'master' | 'pro'>('master')
  const [extensionDays, setExtensionDays] = useState(30)
  const [isUpdating, startUpdateTransition] = useTransition()

  const isSuperAdmin = usage?.isSuperAdmin ?? false

  useEffect(() => {
    // If loading finishes and user is not super admin, bounce them out!
    if (!usageLoading && !isSuperAdmin) {
      router.push('/pano')
      toast.error(lang === 'en' ? 'Unauthorized access.' : 'Yetkisiz erişim denemesi engellendi.')
    }
  }, [isSuperAdmin, usageLoading, router, lang])

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
          Number(extensionDays)
        )
        if (res.success) {
          toast.success(lang === 'en' ? 'License updated successfully!' : 'Lisans başarıyla güncellendi!')
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

  function buildInviteWaLink(code: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nmm.app'
    const inviteUrl = `${appUrl}/kayit?ref=${code}`
    const msg = lang === 'en'
      ? `Hi! I'd like to invite you to join my team on Network Marketing Master. Click here to register: ${inviteUrl}`
      : `Merhaba! Network Marketing Master'da ekibime katılmana vesile olmak istiyorum. Kayıt olmak için: ${inviteUrl}`
    return `https://wa.me/?text=${encodeURIComponent(msg)}`
  }

  async function handleAddAsCandidate(workspaceId: string, email: string, name: string) {
    setAddingId(workspaceId)
    try {
      await addIndependentAsCandidateAction(email, name)
      setAddedIds(prev => new Set(prev).add(workspaceId))
      toast.success(lang === 'en' ? `${name} added to your pipeline!` : `${name} pipeline'ına eklendi!`)
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Operation failed.' : 'İşlem başarısız.'))
    } finally {
      setAddingId(null)
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
          {lang === 'en' ? 'Loading Platform Admin Grid...' : 'Platform Yönetim Masası Yükleniyor...'}
        </p>
      </div>
    )
  }

  if (!isSuperAdmin) return null

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-md">
              <Crown className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-1)] flex items-center gap-2">
                {lang === 'en' ? 'Platform Management Console' : 'Platform Yönetim Masası'}
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {lang === 'en' ? 'Super Admin' : 'Süper Admin'}
                </span>
              </h1>
              <p className="text-sm text-[var(--text-3)] font-medium">
                {lang === 'en' 
                  ? 'Audit independent signups, team sizes, manage billing limits and manual extensions.' 
                  : 'Dış kayıtları izleyin, lisans tiplerini denetleyin ve manuel süre uzatımlarını yönetin.'}
              </p>
            </div>
          </div>
        </header>

        {/* Platform KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* KPI 1 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
              {lang === 'en' ? 'TOTAL LEADERS' : 'TOPLAM LİDER / ÜYE'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[var(--text-1)]">{totalUsersCount}</span>
              <Users className="h-4.5 w-4.5 text-[var(--text-3)] ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {lang === 'en' ? 'Total workspaces on NMM' : 'Kayıtlı toplam bağımsız çalışma alanı'}
            </p>
          </div>

          {/* KPI 2 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-purple-600 dark:text-purple-400">
              {lang === 'en' ? 'INDEPENDENT SIGNUPS' : 'DIŞ KAYIT / BAĞIMSIZLAR'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{independentCount}</span>
              <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400 ml-auto animate-pulse" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {lang === 'en' ? 'Registered directly from web' : 'Doğrudan Landing Page ile gelenler'}
            </p>
          </div>

          {/* KPI 3 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-emerald-600 dark:text-emerald-400">
              {lang === 'en' ? 'PAID LICENSES' : 'AKTİF LİSANSLAR (PAID)'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{totalPaidCount}</span>
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {lang === 'en' ? 'Leader/Master/Pro plans active' : 'Basic, Plus ve Pro paket sahipleri'}
            </p>
          </div>

          {/* KPI 4 */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-blue-600 dark:text-blue-400">
              {lang === 'en' ? 'TOTAL PROSPECTS' : 'TOPLAM ADAY HACMİ'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalCandidatesCount}</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 ml-auto" />
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-1 font-semibold">
              {lang === 'en' ? 'Leads tracked by entire platform' : 'Sistem genelinde takip edilen adaylar'}
            </p>
          </div>
        </div>

        {/* Bağımsız Üyeler — Independent Signups */}
        {independentMembers.length > 0 && (
          <section className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <h2 className="text-sm font-bold text-[var(--text-1)]">
                {lang === 'en' ? 'Independent Signups' : 'Bağımsız Kayıtlar'}
                <span className="ml-2 text-purple-600 dark:text-purple-400">({independentMembers.length})</span>
              </h2>
              <span className="text-[10px] text-[var(--text-3)] font-medium ml-auto hidden sm:block">
                {lang === 'en'
                  ? 'Discovered your platform organically — reach out to recruit them.'
                  : 'Platformu bağımsız keşfettiler — iletişime geçip ekibine davet edebilirsin.'}
              </span>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {independentMembers.map(w => {
                const isAdded = addedIds.has(w.workspaceId)
                return (
                  <div key={w.workspaceId} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-sm font-black text-white shadow">
                      {w.ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[var(--text-1)] truncate">{w.ownerName}</div>
                      <div className="text-[10px] text-[var(--text-3)] truncate">{w.ownerEmail}</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <a
                        href={buildInviteWaLink(inviteCode)}
                        target="_blank"
                        rel="noreferrer"
                        title={lang === 'en' ? 'Send Invite via WhatsApp' : 'WhatsApp ile Davet Gönder'}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleAddAsCandidate(w.workspaceId, w.ownerEmail, w.ownerName)}
                        disabled={addingId === w.workspaceId || isAdded}
                        title={lang === 'en' ? 'Add to My Pipeline as Prospect' : "Pipeline'ıma Aday Olarak Ekle"}
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
            placeholder={lang === 'en' ? 'Search by name, email, sponsor...' : 'İsim, e-posta ya da sponsor ile ara...'}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
          />
        </div>

        {/* Workspaces Spreadsheet Grid */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none bg-[var(--bg-card)] shadow-[0_1px_3px_rgba(0,0,0,0.01)] no-swipe" data-no-swipe="true">
            <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border)] text-[var(--text-2)] font-bold select-none">
                  <th className="p-3 font-semibold">{lang === 'en' ? 'Leader Name' : 'Kullanıcı / Lider'}</th>
                  <th className="p-3 font-semibold">{lang === 'en' ? 'Workspace Name' : 'Grup / Çalışma Alanı'}</th>
                  <th className="p-3 font-semibold">{lang === 'en' ? 'License Plan' : 'Lisans Paketi'}</th>
                  <th className="p-3 font-semibold text-center">{lang === 'en' ? 'Candidates' : 'Aday Sayısı'}</th>
                  <th className="p-3 font-semibold text-center">{lang === 'en' ? 'Downlines' : 'Ekip Boyutu'}</th>
                  <th className="p-3 font-semibold">{lang === 'en' ? 'Sponsor / Parent' : 'Sponsorluk Bağı'}</th>
                  <th className="p-3 font-semibold text-center">{lang === 'en' ? 'Expiry Date' : 'Lisans Bitiş Tarihi'}</th>
                  <th className="p-3 font-semibold text-center">{lang === 'en' ? 'Registration' : 'Kayıt Tarihi'}</th>
                  <th className="p-3 font-semibold text-right">{lang === 'en' ? 'Actions' : 'Yönetim'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-1)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-[var(--text-3)] italic">
                      {lang === 'en' ? 'No registered leaders found.' : 'Kayıtlı hiçbir kullanıcı bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(w => {
                    const regDate = new Date(w.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                    const expDate = w.licenseExpiresAt
                      ? new Date(w.licenseExpiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-'

                    const isExpired = w.licenseExpiresAt ? new Date(w.licenseExpiresAt) < new Date() : false

                    return (
                      <tr key={w.workspaceId} className="hover:bg-[var(--bg-subtle)]/75 transition-colors">
                        {/* 1. Leader */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-[var(--text-1)]">{w.ownerName}</div>
                          <div className="text-xs text-[var(--text-3)] font-semibold flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {w.ownerEmail}
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
                              💎 {lang === 'en' ? 'Independent / Direct' : 'Dış Kayıt / Bağımsız'}
                            </span>
                          ) : (
                            <div className="max-w-[160px] truncate">
                              <span className="text-[var(--text-3)]">{lang === 'en' ? 'Sponsor:' : 'Sponsor:'} </span>
                              <span className="text-[var(--text-1)]">{w.sponsorName}</span>
                            </div>
                          )}
                        </td>

                        {/* 7. Expiry */}
                        <td className={`p-3 text-center tabular-nums font-semibold whitespace-nowrap ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                          {expDate}
                          {isExpired && (
                            <span className="ml-1 text-[9px] font-black bg-red-500/10 text-red-500 px-1 py-0.5 rounded uppercase">
                              {lang === 'en' ? 'Expired' : 'Süresi Doldu'}
                            </span>
                          )}
                        </td>

                        {/* 8. Registration Date */}
                        <td className="p-3 text-center text-xs text-[var(--text-3)] font-semibold tabular-nums whitespace-nowrap">{regDate}</td>

                        {/* 9. Actions */}
                        <td className="p-3 whitespace-nowrap text-right">
                          <div className="inline-flex gap-2.5">
                            {/* WhatsApp — share invite link */}
                            <a
                              href={buildInviteWaLink(inviteCode)}
                              target="_blank"
                              rel="noreferrer"
                              title={lang === 'en' ? 'Share Invite Link via WhatsApp' : 'WhatsApp ile Davet Linki Gönder'}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>

                            {/* License adjustment trigger */}
                            <button
                              onClick={() => {
                                setSelectedWorkspace(w)
                                setLicenseType(w.licenseType as any)
                              }}
                              title={lang === 'en' ? 'Manage License & Trial' : 'Lisans ve Süre Ayarla'}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#534AB7]/10 text-[#534AB7] transition hover:bg-[#534AB7] hover:text-white"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
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
                    {lang === 'en' ? 'Manage Workspace License' : 'Çalışma Alanı Lisans Yönetimi'}
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
                  <div><strong>{lang === 'en' ? 'User:' : 'Kullanıcı:'}</strong> {selectedWorkspace.ownerName}</div>
                  <div className="mt-1"><strong>{lang === 'en' ? 'Email:' : 'E-posta:'}</strong> {selectedWorkspace.ownerEmail}</div>
                  <div className="mt-1"><strong>{lang === 'en' ? 'Current Expiry:' : 'Mevcut Son Kullanım:'}</strong> {
                    selectedWorkspace.licenseExpiresAt 
                      ? new Date(selectedWorkspace.licenseExpiresAt).toLocaleString() 
                      : '-'
                  }</div>
                </div>

                {/* Plan select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-1)]">
                    {lang === 'en' ? 'License Level' : 'Lisans Paketi Seviyesi'}
                  </label>
                  <select
                    value={licenseType}
                    onChange={e => setLicenseType(e.target.value as any)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                  >
                    <option value="free">free</option>
                    <option value="leader">leader</option>
                    <option value="master">master</option>
                    <option value="pro">pro (Süper Lider)</option>
                  </select>
                </div>

                {/* Extend Days */}
                {licenseType !== 'free' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--text-1)]">
                      {lang === 'en' ? 'Extend Trial / Access (Days)' : 'Süre Uzatımı (Gün Sayısı)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={365}
                      value={extensionDays}
                      onChange={e => setExtensionDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {lang === 'en' ? 'Saving...' : 'Kaydediliyor...'}</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {lang === 'en' ? 'Upgrade & Save' : 'Lisansı Güncelle & Kaydet'}</>
                  )}
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
