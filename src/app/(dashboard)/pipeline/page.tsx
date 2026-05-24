'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Search, X } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, type CandidateFilter } from '@/hooks/useCandidates'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/stages'
import { StageFilter } from './_components/StageFilter'
import { CandidateCard } from './_components/CandidateCard'
import { AddCandidateSheet } from './_components/AddCandidateSheet'
import { useTranslation } from '@/providers/LanguageProvider'

export default function PipelinePage() {
  const { lang, t } = useTranslation()
  const [filter, setFilter] = useState<CandidateFilter>('tumü')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: ws, isLoading: wsLoading, error: wsError } = useWorkspace()
  const { candidates: all, isLoading, error } = useCandidates(ws?.workspaceId)

  const filtered = filter === 'tumü'        ? all
    : filter === 'aktif'       ? all.filter(c => ACTIVE_STAGES.includes(c.stage))
    : filter === 'sicak'       ? all.filter(c => HOT_STAGES.includes(c.stage))
    : all.filter(c => c.stage === 'kayboldu')

  const candidates = searchQuery.trim()
    ? filtered.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filtered

  const counts: Record<CandidateFilter, number> = {
    tumü:        all.length,
    aktif:       all.filter(c => ACTIVE_STAGES.includes(c.stage)).length,
    sicak:       all.filter(c => HOT_STAGES.includes(c.stage)).length,
    kaybolanlar: all.filter(c => c.stage === 'kayboldu').length,
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
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#453DA0] active:scale-95 shadow-md"
        >
          <Plus className="h-4 w-4" />
          {t('pipeline.addCandidate')}
        </button>
      </div>

      {/* Stat bar */}
      <div className="mb-5 grid grid-cols-3 gap-3 animate-in fade-in duration-300 delay-100">
        <div className="rounded-2xl bg-[var(--bg-subtle)] p-3 text-center border border-[var(--border)]">
          <p className="text-xl font-bold text-[var(--text-1)]">{counts.tumü}</p>
          <p className="text-xs text-[var(--text-3)]">{lang === 'en' ? 'Total' : 'Toplam'}</p>
        </div>
        <div className="rounded-2xl bg-[#FAEEDA] p-3 text-center border border-[#FAEEDA]/50 dark:bg-[#FAEEDA]/5">
          <p className="text-xl font-bold text-[#854F0B]">{counts.aktif}</p>
          <p className="text-xs text-[#854F0B] dark:text-[#fcd34d]">{lang === 'en' ? 'Active' : 'Aktif'}</p>
        </div>
        <div className="rounded-2xl bg-[#E1F5EE] p-3 text-center border border-[#E1F5EE]/50 dark:bg-[#E1F5EE]/5">
          <p className="text-xl font-bold text-[#0F6E56]">{counts.sicak}</p>
          <p className="text-xs text-[#0F6E56] dark:text-[#6ee7b7]">{lang === 'en' ? 'Hot' : 'Sıcak'}</p>
        </div>
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

