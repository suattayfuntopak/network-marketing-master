import { Users } from 'lucide-react'

export default function EkipPage() {
  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAEEDA]">
          <Users className="h-5 w-5 text-[#854F0B]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ekibim</h1>
          <p className="text-sm text-gray-400">Ekip performans paneli</p>
        </div>
      </header>
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        Yakında burada ekip aktivitelerini takip edebileceksin.
      </div>
    </main>
  )
}
