import { CalendarDays } from 'lucide-react'
import { TakvimClient } from './_components/TakvimClient'

export default function TakvimPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBEAF0]">
          <CalendarDays className="h-5 w-5 text-[#72243E]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Takvim</h1>
          <p className="text-sm text-[var(--text-2)]">Planlı takip günleri</p>
        </div>
      </header>
      <TakvimClient />
    </main>
  )
}
