import { BugunContent } from './_components/BugunContent'
import { QuickAccess } from './_components/QuickAccess'

export default function BugunPage() {
  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
      <BugunContent />
      <QuickAccess />
    </main>
  )
}
