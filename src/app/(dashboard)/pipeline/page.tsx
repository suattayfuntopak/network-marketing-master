'use client'

import { useState } from 'react'
import { Plus, BarChart2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, type CandidateFilter } from '@/hooks/useCandidates'
import { StageFilter } from './_components/StageFilter'
import { CandidateCard } from './_components/CandidateCard'
import { AddCandidateSheet } from './_components/AddCandidateSheet'

export default function PipelinePage() {
  const [filter, setFilter] = useState<CandidateFilter>('tumü')
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: ws, isLoading: wsLoading, error: wsError } = useWorkspace()
  const { candidates, isLoading, error } = useCandidates(ws?.workspaceId, filter)

  // Filtre sayaçları için tüm adayları ayrıca çek
  const { candidates: all }      = useCandidates(ws?.workspaceId, 'tumü')
  const { candidates: aktif }    = useCandidates(ws?.workspaceId, 'aktif')
  const { candidates: sicak }    = useCandidates(ws?.workspaceId, 'sicak')
  const { candidates: kayb }     = useCandidates(ws?.workspaceId, 'kaybolanlar')

  const counts: Record<CandidateFilter, number> = {
    tumü:        all.length,
    aktif:       aktif.length,
    sicak:       sicak.length,
    kaybolanlar: kayb.length,
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
          <h1 className="text-xl font-bold text-gray-900">Boru Hattı</h1>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#453DA0]"
        >
          <Plus className="h-4 w-4" />
          Aday Ekle
        </button>
      </div>

      {/* Stat bar */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gray-50 p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{all.length}</p>
          <p className="text-xs text-gray-400">Toplam</p>
        </div>
        <div className="rounded-2xl bg-[#FAEEDA] p-3 text-center">
          <p className="text-xl font-bold text-[#854F0B]">{aktif.length}</p>
          <p className="text-xs text-[#854F0B]">Aktif</p>
        </div>
        <div className="rounded-2xl bg-[#E1F5EE] p-3 text-center">
          <p className="text-xl font-bold text-[#0F6E56]">{sicak.length}</p>
          <p className="text-xs text-[#0F6E56]">Sıcak</p>
        </div>
      </div>

      <StageFilter active={filter} onChange={setFilter} counts={counts} />

      <div className="mt-4">
        {isLoading && <Spinner />}
        {error && <ErrorMsg msg="Adaylar yüklenemedi." />}
        {!isLoading && !error && candidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm font-semibold text-gray-700">
              {filter === 'tumü' ? 'Henüz aday yok' : 'Bu filtrede aday yok'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {filter === 'tumü' ? '"Aday Ekle" butonuyla başla' : 'Filtreyi değiştirmeyi dene'}
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
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
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
