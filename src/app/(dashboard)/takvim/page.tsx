import { CalendarDays } from 'lucide-react'

export default function TakvimPage() {
  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBEAF0]">
          <CalendarDays className="h-5 w-5 text-[#72243E]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-400">Planlı takip günleri</p>
        </div>
      </header>
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        Yakında burada takip planını görebileceksin.
      </div>
    </main>
  )
}
