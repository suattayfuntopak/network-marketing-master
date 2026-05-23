import { BottomNav } from './_components/BottomNav'
import { Sidebar } from './_components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Masaüstü sidebar */}
      <Sidebar />

      {/* Ana içerik */}
      <div className="flex-1 md:ml-64">
        {children}
      </div>

      {/* Mobil bottom nav */}
      <BottomNav />
    </div>
  )
}
