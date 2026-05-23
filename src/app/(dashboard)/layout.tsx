import { BottomNav } from './_components/BottomNav'
import { Sidebar } from './_components/Sidebar'
import { MobileHeader } from './_components/MobileHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Masaüstü sidebar */}
      <Sidebar />

      {/* Ana içerik */}
      <div className="flex-1 md:ml-64">
        {/* Mobil header */}
        <MobileHeader />
        {children}
      </div>

      {/* Mobil bottom nav */}
      <BottomNav />
    </div>
  )
}
