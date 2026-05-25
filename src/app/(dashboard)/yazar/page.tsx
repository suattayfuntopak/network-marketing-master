import { Bot } from 'lucide-react'
import { YazarForm } from './_components/YazarForm'

interface PageProps {
  searchParams: Promise<{ name?: string; note?: string; warmth?: string }>
}

export default async function YazarPage({ searchParams }: PageProps) {
  const { name, note, warmth } = await searchParams

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1F5EE]">
          <Bot className="h-5 w-5 text-[#0F6E56]" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">YZ Mesajı Üret</h1>
          <p className="text-sm text-[var(--text-2)]">AI destekli WhatsApp mesajları</p>
        </div>
      </header>
      <YazarForm initialName={name ?? ''} initialNote={note ?? ''} initialWarmth={warmth ?? 'ilik'} />
    </main>
  )
}
