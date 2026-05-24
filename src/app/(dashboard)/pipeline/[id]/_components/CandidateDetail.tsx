'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Pencil, ChevronDown, MessageSquare, Trash2, X, Bot } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCandidates, useUpdateCandidate, useDeleteCandidate } from '@/hooks/useCandidates'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { EditCandidateSheet } from '../../_components/EditCandidateSheet'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { STAGE_LABEL, STAGE_COLOR, STAGE_ORDER, FOLLOW_DAYS } from '@/lib/stages'
import { deleteWithUndo } from '@/lib/deleteWithUndo'
import { waHref } from '@/lib/waLink'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'
import { Z } from '@/lib/zIndex'


function suggestedFollowUp(c: NmmCandidate): string | null {
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

function toInputDate(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

interface Props {
  candidateId: string
}

export function CandidateDetail({ candidateId }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: ws, isLoading: wsLoading } = useWorkspace()
  const { candidates, isLoading: cLoading } = useCandidates(ws?.workspaceId)
  const update = useUpdateCandidate(ws?.workspaceId ?? '')
  const del = useDeleteCandidate(ws?.workspaceId ?? '')

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

  const waLink = waHref(c.phone)
  const nextFollow = c.next_follow_up_at
    ? new Date(c.next_follow_up_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    : suggestedFollowUp(c)

  function changeStage(stage: CandidateStage) {
    setStageOpen(false)
    update.mutate({ id: c!.id, stage })
  }

  function saveFollowUpDate(dateStr: string) {
    setEditingFollowUp(false)
    if (!dateStr) {
      update.mutate({ id: c!.id, next_follow_up_at: null })
      return
    }
    update.mutate({ id: c!.id, next_follow_up_at: new Date(dateStr).toISOString() })
  }

  function handleDelete() {
    setConfirmOpen(true)
  }

  function handleDeleteConfirmed() {
    setConfirmOpen(false)
    deleteWithUndo(
      c!.full_name,
      () => del.mutate(c!.id),
      () => router.push('/pipeline'),
    )
    router.push('/pipeline')
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

        {/* Aksiyon butonları: YZ Mesajı | WhatsApp | Ara */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push(`/yazar?name=${encodeURIComponent(c.full_name)}&note=${encodeURIComponent(c.note ?? '')}`)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#EEEDFE] py-4 text-sm font-semibold text-[#534AB7] transition hover:opacity-90"
          >
            <Bot className="h-4 w-4" strokeWidth={1.75} />
            YZ Mesajı
          </button>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)] py-4 text-xs font-medium text-[var(--text-3)]">
              WA yok
            </div>
          )}
          {c.phone ? (
            <a
              href={`tel:${c.phone}`}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#E8F0FE] py-4 text-sm font-semibold text-[#1A56DB] transition hover:opacity-90"
            >
              <Phone className="h-4 w-4" strokeWidth={1.75} />
              Ara
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-2xl bg-[var(--bg-subtle)] py-4 text-xs font-medium text-[var(--text-3)]">
              Tel yok
            </div>
          )}
        </div>

        {/* Aşama */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Aşama</p>
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
        </div>

        {/* Takip bilgisi */}
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">Takip</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-3)]">Son Temas</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--text-1)]">{daysSince(c.last_contact_at)}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-3)]">Sonraki Takip</p>
                <button
                  onClick={() => setEditingFollowUp(v => !v)}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--text-3)] transition hover:text-[#534AB7]"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              {editingFollowUp ? (
                <input
                  type="date"
                  defaultValue={toInputDate(c.next_follow_up_at)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-2 py-1 text-xs text-[var(--text-1)] outline-none focus:border-[#534AB7]"
                  onChange={e => saveFollowUpDate(e.target.value)}
                  onBlur={e => saveFollowUpDate(e.target.value)}
                  autoFocus
                />
              ) : (
                <p className="mt-0.5 text-sm font-semibold text-[#534AB7]">
                  {nextFollow ?? '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sil */}
        <button
          onClick={handleDelete}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FBEAF0] bg-[#FBEAF0] py-3.5 text-sm font-semibold text-[#72243E] transition hover:bg-[#f5d4e0]"
        >
          <Trash2 className="h-4 w-4" />
          Kişiyi Sil
        </button>
      </main>

      {editOpen && ws && (
        <EditCandidateSheet
          candidate={c}
          workspaceId={ws.workspaceId}
          onClose={() => setEditOpen(false)}
        />
      )}

      {confirmOpen && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {stageOpen && (
        <>
          <div className={`fixed inset-0 ${Z.sheetBackdrop} bg-black/30 backdrop-blur-sm`} onClick={() => setStageOpen(false)} />
          <div className={`fixed bottom-0 left-0 right-0 ${Z.sheet} rounded-t-3xl bg-[var(--bg-card)] pb-8 shadow-2xl md:left-1/2 md:top-1/2 md:bottom-auto md:w-72 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-0`}>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-bold text-[var(--text-1)]">Aşama Seç</p>
              <button onClick={() => setStageOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="overflow-y-auto py-1" style={{ maxHeight: '60vh' }}>
              {STAGE_ORDER.map(s => (
                <li key={s}>
                  <button
                    onClick={() => changeStage(s)}
                    className={clsx(
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition hover:bg-[var(--bg-subtle)]',
                      s === c.stage ? 'text-[#534AB7]' : 'text-[var(--text-1)]'
                    )}
                  >
                    <span className={clsx('inline-block h-2 w-2 shrink-0 rounded-full', STAGE_COLOR[s].split(' ')[0])} />
                    {STAGE_LABEL[s]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
