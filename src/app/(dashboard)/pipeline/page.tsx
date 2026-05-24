'use client'

import { useState } from 'react'
import { Plus, BarChart2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, type CandidateFilter } from '@/hooks/useCandidates'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/stages'
import { StageFilter } from './_components/StageFilter'
import { CandidateCard } from './_components/CandidateCard'
import { AddCandidateSheet } from './_components/AddCandidateSheet'

export default function PipelinePage() {
  const [filter, setFilter] = useState<CandidateFilter>('tumü')
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: ws, isLoading: wsLoading, error: wsError } = useWorkspace()
  const { candidates: all, isLoading, error } = useCandidates(ws?.workspaceId)

  const candidates = filter === 'tumü'        ? all
    : filter === 'aktif'       ? all.filter(c => ACTIVE_STAGES.includes(c.stage))
    : filter === 'sicak'       ? all.filter(c => HOT_STAGES.includes(c.stage))
    : all.filter(c => c.stage === 'kayboldu')

  const counts: Record<CandidateFilter, number> = {
    tumü:        all.length,
    aktif:       all.filter(c => ACTIVE_STAGES.includes(c.stage)).length,
    sicak:       all.filter(c => HOT_STAGES.includes(c.stage)).length,
    kaybolanlar: all.filter(c => c.stage === 'kayboldu').length,
  }

  if (wsLoading) return <PageShell><Spinner /></PageShell>
  if (wsError)   return <PageShell><ErrorMsg msg={`Workspace yüklenemedi: ${(wsError as Error).message}`} /></PageShell>

  return (
    <PageShell>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEEDFE]">
          <BarChart2 className="h-5 w-5 text-[#534AB7]" strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--text-1)]">Boru Hattı</h1>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#453DA0]"
        >
          <Plus className="h-4 w-4" />
          Kişi Ekle
        </button>
      </div>

      {/* Stat bar */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-[var(--bg-subtle)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--text-1)]">{counts.tumü}</p>
          <p className="text-xs text-[var(--text-3)]">Toplam</p>
        </div>
        <div className="rounded-2xl bg-[#FAEEDA] p-3 text-center">
          <p className="text-xl font-bold text-[#854F0B]">{counts.aktif}</p>
          <p className="text-xs text-[#854F0B]">Aktif</p>
        </div>
        <div className="rounded-2xl bg-[#E1F5EE] p-3 text-center">
          <p className="text-xl font-bold text-[#0F6E56]">{counts.sicak}</p>
          <p className="text-xs text-[#0F6E56]">Sıcak</p>
        </div>
      </div>

      <StageFilter active={filter} onChange={setFilter} counts={counts} />

      <div className="mt-4">
        {isLoading && <Spinner />}
        {error && <ErrorMsg msg="Adaylar yüklenemedi." />}
        {!isLoading && !error && candidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {filter === 'tumü' ? 'Henüz aday yok' : 'Bu filtrede aday yok'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-3)]">
              {filter === 'tumü' ? '"Kişi Ekle" butonuyla başla' : 'Filtreyi değiştirmeyi dene'}
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
