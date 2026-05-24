import { Zap } from 'lucide-react'
import { IlgilenContent } from './_components/IlgilenContent'

export default function IlgilenPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEEDFE]">
          <Zap className="h-5 w-5 text-[#534AB7]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Bugün İlgilen</h1>
          <p className="text-sm text-[var(--text-2)]">Takip edilmesi gereken adaylar</p>
        </div>
      </header>
      <IlgilenContent />
    </main>
  )
}
