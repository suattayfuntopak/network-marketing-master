'use client'

import { ChevronDown, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { useUpdateCandidate } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from './EditCandidateSheet'

export const STAGE_LABEL: Record<CandidateStage, string> = {
  yeni:     'Yeni Aday',
  iletisim: 'İletişim Kuruldu',
  takip:    'Takip Bekliyor',
  sunum:    'Sunum Yapıldı',
  kararsiz: 'Kararsız',
  katildi:  'Katıldı ✅',
  kayboldu: 'Kayboldu ❌',
}

const STAGE_COLOR: Record<CandidateStage, string> = {
  yeni:     'bg-[#E8F0FE] text-[#1A56DB]',
  iletisim: 'bg-[#EEEDFE] text-[#534AB7]',
  takip:    'bg-[#FAEEDA] text-[#854F0B]',
  sunum:    'bg-[#E1F5EE] text-[#0F6E56]',
  kararsiz: 'bg-[#FBEAF0] text-[#72243E]',
  katildi:  'bg-[#E1F5EE] text-[#0F6E56]',
  kayboldu: 'bg-gray-100 text-gray-500',
}

const STAGE_ORDER: CandidateStage[] = [
  'yeni', 'iletisim', 'takip', 'sunum', 'kararsiz', 'katildi', 'kayboldu',
]

function daysSince(iso: string | null): string {
  if (!iso) return 'Hiç aranmadı'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'Bugün'
  if (d === 1) return 'Dün'
  return `${d} gün önce`
}

interface CandidateCardProps {
  candidate: NmmCandidate
  workspaceId: string
}

export function CandidateCard({ candidate, workspaceId }: CandidateCardProps) {
  const [stageOpen, setStageOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const update = useUpdateCandidate(workspaceId)

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: candidate.id, stage })
  }

  const waLink = candidate.phone
    ? `https://wa.me/90${candidate.phone.replace(/^0/, '')}`
    : null

  return (
    <>
      <li className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-sm font-bold text-[#534AB7]">
            {candidate.full_name.charAt(0).toUpperCase()}
          </div>

          {/* Bilgi */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-1)]">{candidate.full_name}</p>
            {candidate.phone && (
              <p className="text-xs text-[var(--text-2)]">{candidate.phone}</p>
            )}
            {candidate.note && (
              <p className="mt-1 line-clamp-2 break-words text-xs text-[var(--text-2)]">{candidate.note}</p>
            )}
          </div>

          {/* Eylemler */}
          <div className="flex shrink-0 items-center gap-1.5">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white transition-all hover:scale-105 hover:shadow-md"
                aria-label="WhatsApp">
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            )}
            <button onClick={() => setEditOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-all hover:scale-105 hover:bg-[#EEEDFE] hover:text-[#534AB7] hover:shadow-md"
              aria-label="Düzenle">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Alt satır: aşama + son temas */}
        <div className="mt-3 flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setStageOpen(v => !v)}
              className={clsx(
                'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80',
                STAGE_COLOR[candidate.stage]
              )}
            >
              {STAGE_LABEL[candidate.stage]}
              <ChevronDown className="h-3 w-3" />
            </button>

            {stageOpen && (
              <ul className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
                {STAGE_ORDER.map(s => (
                  <li key={s}>
                    <button
                      onClick={() => changeStage(s)}
                      className={clsx(
                        'w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-[var(--bg-subtle)]',
                        s === candidate.stage ? 'text-[#534AB7]' : 'text-[var(--text-1)]'
                      )}
                    >
                      {STAGE_LABEL[s]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <span className="text-xs text-gray-400">{daysSince(candidate.last_contact_at)}</span>
        </div>
      </li>

      {editOpen && (
        <EditCandidateSheet
          candidate={candidate}
          workspaceId={workspaceId}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  )
}
