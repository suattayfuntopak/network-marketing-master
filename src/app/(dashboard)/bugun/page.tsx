import { DailyList } from './_components/DailyList'
import { QuickAccess } from './_components/QuickAccess'
import type { NmmCandidate } from '@/types/database.types'

// Mock veri — Supabase entegrasyonu gelince kaldırılacak
const MOCK_CANDIDATES: NmmCandidate[] = [
  {
    id: '1',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Ayşe Kaya',
    phone: '05321234567',
    stage: 'takip',
    last_contact_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Pazartesi tekrar aramayı istedi',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Mehmet Demir',
    phone: '05339876543',
    stage: 'sunum',
    last_contact_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Sunum beğendi, ailesiyle konuşacak',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Fatma Şahin',
    phone: '05415556677',
    stage: 'iletisim',
    last_contact_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Ali Yıldız',
    phone: '05301112233',
    stage: 'kararsiz',
    last_contact_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    note: 'Fiyat konusunda çekimser',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Zeynep Arslan',
    phone: '05527778899',
    stage: 'yeni',
    last_contact_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const MOCK_USER_NAME = 'Suat'

export default function BugunPage() {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <main className="min-h-screen bg-white px-4 pb-28 pt-6 md:pb-8">
      {/* Başlık */}
      <header className="mb-6">
        <p className="text-sm font-medium text-gray-400">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900">{MOCK_USER_NAME} 👋</h1>
      </header>

      {/* Badge özet */}
      <div className="mb-5 flex gap-2">
        <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-xs font-semibold text-[#854F0B]">
          5 aksiyon bekliyor
        </span>
        <span className="rounded-full bg-[#E1F5EE] px-3 py-1 text-xs font-semibold text-[#0F6E56]">
          2 sıcak aday
        </span>
      </div>

      {/* Bugün listesi */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-gray-700">Bugün bunlarla ilgilen</h2>
        <DailyList candidates={MOCK_CANDIDATES} />
      </section>

      {/* 2x2 hızlı erişim grid */}
      <QuickAccess />
    </main>
  )
}
