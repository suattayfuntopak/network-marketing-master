'use client'

import { Trophy } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates } from '@/hooks/useCandidates'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function KazanimlarPage() {
  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)

  const kazananlar = candidates.filter(c => c.stage === 'katildi')

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF0EC]">
          <Trophy className="h-5 w-5 text-[#C03E1F]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Kazanımlar</h1>
          <p className="text-sm text-[var(--text-2)]">Ekibine katılan adaylar</p>
        </div>
      </header>

      {wsLoading || cLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      ) : kazananlar.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
          <p className="mb-2 text-3xl">🏆</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">Henüz kazanım yok</p>
          <p className="mt-1 text-xs text-[var(--text-2)]">Adayların aşamalarını güncelle</p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-[#FEF0EC] p-4 text-center">
            <p className="text-3xl font-bold text-[#C03E1F]">{kazananlar.length}</p>
            <p className="text-sm text-[#C03E1F]">Ekibindeki kişi</p>
          </div>
          <ul className="space-y-3">
            {kazananlar.map(c => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF0EC] text-sm font-bold text-[#C03E1F]">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-1)]">{c.full_name}</p>
                  {c.last_contact_at && (
                    <p className="text-xs text-[var(--text-3)]">Katıldı: {formatDate(c.last_contact_at)}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-[#E1F5EE] px-2.5 py-1 text-[10px] font-semibold text-[#0F6E56]">
                  Katıldı ✅
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}
