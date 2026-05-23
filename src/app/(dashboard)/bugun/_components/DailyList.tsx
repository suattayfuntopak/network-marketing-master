'use client'

import { Phone, Bell } from 'lucide-react'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useDailyActions } from '@/hooks/useDailyActions'
import type { NmmCandidate } from '@/types/database.types'

const STAGE_LABEL: Record<NmmCandidate['stage'], string> = {
  yeni:     'Yeni Aday',
  iletisim: 'İletişim Kuruldu',
  takip:    'Takip Bekliyor',
  sunum:    'Sunum Yapıldı',
  kararsiz: 'Kararsız',
  katildi:  'Katıldı',
  kayboldu: 'Kayboldu',
}

const STAGE_COLOR: Record<NmmCandidate['stage'], string> = {
  yeni:     'bg-[#E8F0FE] text-[#1A56DB]',
  iletisim: 'bg-[#EEEDFE] text-[#534AB7]',
  takip:    'bg-[#FAEEDA] text-[#854F0B]',
  sunum:    'bg-[#E1F5EE] text-[#0F6E56]',
  kararsiz: 'bg-[#FBEAF0] text-[#72243E]',
  katildi:  'bg-[#E1F5EE] text-[#0F6E56]',
  kayboldu: 'bg-gray-100 text-gray-500',
}

function formatDaysAgo(days: number): string {
  if (!isFinite(days)) return 'Hiç aranmadı'
  if (days < 1) return 'Bugün'
  if (days < 2) return '1 gün önce'
  return `${Math.floor(days)} gün önce`
}

interface DailyListProps {
  candidates: NmmCandidate[]
}

export function DailyList({ candidates }: DailyListProps) {
  const daily = useDailyActions(candidates)

  if (daily.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
        Bugün için bekleyen eylem yok 🎉
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {daily.map(candidate => (
        <li
          key={candidate.id}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
            {candidate.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Bilgi */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{candidate.full_name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLOR[candidate.stage]}`}>
                {STAGE_LABEL[candidate.stage]}
              </span>
              <span className="text-xs text-gray-400">{formatDaysAgo(candidate.daysSinceContact)}</span>
            </div>
          </div>

          {/* Eylem butonları */}
          <div className="flex shrink-0 gap-2">
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEEDFE] text-[#534AB7] transition-all hover:scale-105 hover:shadow-md"
                aria-label="Ara"
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
              </a>
            )}
            {candidate.phone && (
              <a
                href={`https://wa.me/90${candidate.phone.replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white transition-all hover:scale-105 hover:shadow-md"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAEEDA] text-[#854F0B] transition-all hover:scale-105 hover:shadow-md"
              aria-label="Hatırlat"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
