'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Search, X } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, type CandidateFilter } from '@/hooks/useCandidates'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import { StageFilter } from './_components/StageFilter'
import { CandidateCard } from './_components/CandidateCard'
import { AddCandidateSheet } from './_components/AddCandidateSheet'
import { useTranslation } from '@/providers/LanguageProvider'
import { clsx } from 'clsx'

function getFollowUpStatus(iso: string | null): 'past' | 'today' | 'future' | null {
  if (!iso) return null
  const followDate = new Date(iso)
  if (isNaN(followDate.getTime())) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const followDateZero = new Date(followDate)
  followDateZero.setHours(0, 0, 0, 0)
  
  if (followDateZero.getTime() < today.getTime()) {
    return 'past'
  } else if (followDateZero.getTime() === today.getTime()) {
    return 'today'
  }
  return 'future'
}

export default function PipelinePage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<CandidateFilter>('tumü')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: ws, isLoading: wsLoading, error: wsError } = useWorkspace()
  const { candidates: all, isLoading, error } = useCandidates(ws?.workspaceId)

  const followUpAlertCount = all.filter(c => {
    const status = getFollowUpStatus(c.next_follow_up_at)
    return status === 'past' || status === 'today'
  }).length

  const filtered = filter === 'tumü'        ? all
    : filter === 'aktif'       ? all.filter(c => ACTIVE_STAGES.includes(c.stage))
    : filter === 'sicak'       ? all.filter(c => HOT_STAGES.includes(c.stage))
    : filter === 'takip_zamani'? all.filter(c => {
        const status = getFollowUpStatus(c.next_follow_up_at)
        return status === 'past' || status === 'today'
      })
    : filter === 'kaybolanlar' ? all.filter(c => c.stage === 'kayboldu')
    : all.filter(c => c.stage === filter)

  const candidates = searchQuery.trim()
    ? filtered.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filtered

  const counts: Record<CandidateFilter, number> = {
    tumü:        all.length,
    aktif:       all.filter(c => ACTIVE_STAGES.includes(c.stage)).length,
    sicak:       all.filter(c => HOT_STAGES.includes(c.stage)).length,
    takip_zamani: followUpAlertCount,
    kaybolanlar: all.filter(c => c.stage === 'kayboldu').length,
    // Stage-specific counts
    yeni:        all.filter(c => c.stage === 'yeni').length,
    iletisim:    all.filter(c => c.stage === 'iletisim').length,
    davetli:     all.filter(c => c.stage === 'davetli').length,
    sunum:       all.filter(c => c.stage === 'sunum').length,
    takip:       all.filter(c => c.stage === 'takip').length,
    kararsiz:    all.filter(c => c.stage === 'kararsiz').length,
    katildi:     all.filter(c => c.stage === 'katildi').length,
    ilgilenmedi: all.filter(c => c.stage === 'ilgilenmedi').length,
    pasif:       all.filter(c => c.stage === 'pasif').length,
    kayboldu:    all.filter(c => c.stage === 'kayboldu').length,
  }

  if (wsLoading) return <PageShell><Spinner /></PageShell>
  if (wsError)   return <PageShell><ErrorMsg msg={`${t('common.error')}: ${(wsError as Error).message}`} /></PageShell>

  return (
    <PageShell>
      <div className="mb-5 flex items-center gap-3 animate-in fade-in duration-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FE] dark:bg-[#0a1f4d]">
          <TrendingUp className="h-5 w-5 text-[#1A56DB] dark:text-[#93c5fd]" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--text-1)]">{t('nav.pipeline')}</h1>
          <p className="text-xs text-[var(--text-3)]">
            {t('pipelinePage.pipelineSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#453DA0] active:scale-95 shadow-md"
        >
          <Plus className="h-4 w-4" />
          {t('pipeline.addCandidate')}
        </button>
      </div>

      {/* Stat bar — clickable */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-300 delay-100">
        <button
          onClick={() => setFilter('tumü')}
          className={`rounded-2xl p-3 text-center border transition-all hover:scale-[1.02] active:scale-95 ${
            filter === 'tumü'
              ? 'bg-[var(--bg-subtle)] border-[#534AB7] ring-2 ring-[#534AB7]/20 shadow-md shadow-[#534AB7]/5'
              : 'bg-[var(--bg-subtle)] border-[var(--border)] hover:border-[#534AB7]/40'
          }`}
        >
          <p className="text-xl font-bold text-[var(--text-1)]">{counts.tumü}</p>
          <p className="text-xs text-[var(--text-3)]">{t('pipeline.total')}</p>
        </button>
        {/* Aktif — was orange, now gets green */}
        <button
          onClick={() => setFilter('aktif')}
          className={`rounded-2xl p-3 text-center border transition-all hover:scale-[1.02] active:scale-95 ${
            filter === 'aktif'
              ? 'bg-[#E1F5EE] border-[#0F6E56] ring-2 ring-[#0F6E56]/20 shadow-md shadow-[#0F6E56]/5 dark:bg-[#E1F5EE]/5'
              : 'bg-[#E1F5EE] border-[#E1F5EE]/50 hover:border-[#0F6E56]/40 dark:bg-[#E1F5EE]/5'
          }`}
        >
          <p className="text-xl font-bold text-[#0F6E56]">{counts.aktif}</p>
          <p className="text-xs text-[#0F6E56] dark:text-[#6ee7b7]">{t('pipeline.active')}</p>
        </button>
        {/* Sıcak — was green, now gets orange */}
        <button
          onClick={() => setFilter('sicak')}
          className={`rounded-2xl p-3 text-center border transition-all hover:scale-[1.02] active:scale-95 ${
            filter === 'sicak'
              ? 'bg-[#FAEEDA] border-[#854F0B] ring-2 ring-[#854F0B]/20 shadow-md shadow-[#854F0B]/5 dark:bg-[#FAEEDA]/5'
              : 'bg-[#FAEEDA] border-[#FAEEDA]/50 hover:border-[#854F0B]/40 dark:bg-[#FAEEDA]/5'
          }`}
        >
          <p className="text-xl font-bold text-[#854F0B]">{counts.sicak}</p>
          <p className="text-xs text-[#854F0B] dark:text-[#fcd34d]">{t('pipeline.hot')}</p>
        </button>
        {/* Takip Zamanı (4. Kutu) — Pastel Kırmızı */}
        <button
          onClick={() => setFilter('takip_zamani')}
          className={`rounded-2xl p-3 text-center border transition-all hover:scale-[1.02] active:scale-95 ${
            filter === 'takip_zamani'
              ? 'bg-red-500 border-red-500 text-white ring-2 ring-red-500/20 shadow-lg shadow-red-500/10 dark:bg-red-600'
              : 'bg-red-50 border-red-200 hover:border-red-500/40 dark:bg-red-950/20 dark:border-red-900/50'
          }`}
        >
          <p className={clsx('text-xl font-bold transition-colors', filter === 'takip_zamani' ? 'text-white' : 'text-red-500 dark:text-red-400')}>{counts.takip_zamani}</p>
          <p className={clsx('text-xs transition-colors font-semibold', filter === 'takip_zamani' ? 'text-white' : 'text-red-600 dark:text-red-400')}>{t('pipelinePage.followUpDue')}</p>
        </button>
      </div>

      {/* İsim arama kutusu */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('pipeline.searchCandidate')}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-9 pr-9 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:focus:ring-[#534AB7]/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-1)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <StageFilter active={filter} onChange={setFilter} counts={counts} />

      <div className="mt-4">
        {isLoading && <Spinner />}
        {error && <ErrorMsg msg={t('common.error')} />}
        {!isLoading && !error && candidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center bg-[var(--bg-card)]">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {searchQuery ? t('common.searchNoResults') : filter === 'tumü' ? t('pipeline.noCandidatesTitle') : t('common.searchNoResults')}
            </p>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              {searchQuery ? t('pipeline.noCandidatesDesc') : filter === 'tumü' ? t('pipeline.noCandidatesDesc') : t('pipeline.noCandidatesDesc')}
            </p>
          </div>
        )}
        {!isLoading && candidates.length > 0 && (
          <ul className="space-y-3">
            {candidates.map(c => (
              <CandidateCard key={c.id} candidate={c} workspaceId={ws!.workspaceId} />
            ))}
          </ul>
        )}
      </div>

      {sheetOpen && ws && (
        <AddCandidateSheet
          workspaceId={ws.workspaceId}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      {children}
    </main>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl bg-[#FBEAF0] px-4 py-3 text-sm text-[#72243E]">{msg}</div>
  )
}
