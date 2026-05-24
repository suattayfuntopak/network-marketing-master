'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Pencil, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useUpdateCandidate } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

const STAGE_LABEL: Record<CandidateStage, string> = {
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
  kayboldu: 'bg-[var(--bg-subtle)] text-[var(--text-2)]',
}

const STAGE_ORDER: CandidateStage[] = [
  'yeni', 'iletisim', 'takip', 'sunum', 'kararsiz', 'katildi', 'kayboldu',
]

const FOLLOW_DAYS: Partial<Record<CandidateStage, number>> = {
  yeni: 2, iletisim: 3, takip: 3, sunum: 1, kararsiz: 7,
}

function followUpDate(c: NmmCandidate): string | null {
  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null
  const base = new Date(c.last_contact_at ?? c.created_at)
  base.setDate(base.getDate() + days)
  return base.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function daysSince(iso: string | null): string {
  if (!iso) return 'Hiç temas yok'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return 'Bugün'
  if (d === 1) return 'Dün'
  return `${d} gün önce`
}

interface Props {
  candidateId: string
}

export function CandidateDetail({ candidateId }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')

  const c = candidates.find(x => x.id === candidateId)

  if (wsLoading || cLoading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="space-y-4">
          <div className="h-8 w-20 animate-pulse rounded bg-[var(--bg-subtle)]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        </div>
      </main>
    )
  }

  if (!c) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-sm font-semibold text-[var(--text-1)]">Aday bulunamadı</p>
          <button
            onClick={() => router.push('/pipeline')}
            className="mt-4 rounded-xl bg-[#534AB7] px-4 py-2 text-sm font-semibold text-white"
          >
            Boru Hattı'na Dön
          </button>
        </div>
      </main>
    )
  }

  const waLink = c.phone ? `https://wa.me/90${c.phone.replace(/^0/, '')}` : null
  const nextFollow = followUpDate(c)

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: c!.id, stage })
  }

  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        {/* Geri + Düzenle */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition hover:text-[var(--text-1)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3 py-2 text-sm font-medium text-[var(--text-2)] transition hover:bg-[#EEEDFE] hover:text-[#534AB7]"
          >
            <Pencil className="h-4 w-4" />
            Düzenle
          </button>
        </div>

        {/* Profil kartı */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#EEEDFE] text-xl font-bold text-[#534AB7]">
              {c.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-[var(--text-1)]">{c.full_name}</h1>
              {c.phone && (
                <p className="text-sm text-[var(--text-2)]">{c.phone}</p>
              )}
            </div>
          </div>

          {c.note && (
            <p className="mt-4 rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-2)] leading-relaxed">
              {c.note}
            </p>
          )}
        </div>

        {/* Aksiyon butonları */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--bg-subtle)] py-4 text-sm font-medium text-[var(--text-3)]">
              WhatsApp yok
            </div>
          )}
          {c.phone ? (
            <a
              href={`tel:${c.phone}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#EEEDFE] py-4 text-sm font-semibold text-[#534AB7] transition hover:opacity-90"
            >
              <Phone className="h-5 w-5" strokeWidth={1.75} />
              Ara
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--bg-subtle)] py-4 text-sm font-medium text-[var(--text-3)]">
              Telefon yok
            </div>
          )}
        </div>

        {/* Aşama */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Aşama</p>
          <div className="relative">
            <button
              onClick={() => setStageOpen(v => !v)}
              className={clsx(
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-80',
                STAGE_COLOR[c.stage]
              )}
            >
              {STAGE_LABEL[c.stage]}
              <ChevronDown className="h-4 w-4" />
            </button>
            {stageOpen && (
              <ul className="absolute left-0 top-full z-20 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
                {STAGE_ORDER.map(s => (
                  <li key={s}>
                    <button
                      onClick={() => changeStage(s)}
                      className={clsx(
                        'w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-[var(--bg-subtle)]',
                        s === c.stage ? 'text-[#534AB7]' : 'text-[var(--text-1)]'
                      )}
                    >
                      {STAGE_LABEL[s]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Takip bilgisi */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Takip</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-3)]">Son Temas</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--text-1)]">{daysSince(c.last_contact_at)}</p>
            </div>
            {nextFollow && (
              <div>
                <p className="text-xs text-[var(--text-3)]">Sonraki Takip</p>
                <p className="mt-0.5 text-sm font-semibold text-[#534AB7]">{nextFollow}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {editOpen && ws && (
        <EditCandidateSheet
          candidate={c}
          workspaceId={ws.workspaceId}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  )
}
