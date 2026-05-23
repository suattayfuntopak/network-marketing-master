import { BugunContent } from './_components/BugunContent'
import { QuickAccess } from './_components/QuickAccess'

export default function BugunPage() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-gray-400">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900">NM Master 👋</h1>
      </header>

      <BugunContent />

      <QuickAccess />
    </main>
  )
}
