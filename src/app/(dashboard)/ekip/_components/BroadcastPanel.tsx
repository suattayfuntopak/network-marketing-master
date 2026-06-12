'use client'

import { useState } from 'react'
import { Send, FileText, MessageSquare, Users, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import type { MemberRow } from './EkipPanel'
import { waHref, whatsappShareUrl } from '@/lib/utils/waLink'
import { PRO_CTA_GRADIENT_ACTIVE_DARK_SM } from '@/lib/ui/brandGradients'

interface BroadcastPanelProps {
  members: MemberRow[]
  t: (key: string, vars?: Record<string, string | number>) => string
}

export function BroadcastPanel({ members, t }: BroadcastPanelProps) {
  const [broadcastMode, setBroadcastMode] = useState<'doc' | 'motiv'>('motiv')
  const [broadcastLink, setBroadcastLink] = useState('')
  const [broadcastNote, setBroadcastNote] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState<'grup' | 'tekli'>('grup')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())

  function composeBroadcastMessage() {
    if (broadcastMode === 'doc') {
      const linkLine = broadcastLink.trim()
      const noteLine = broadcastNote.trim()
      const header = t('pagesUi.broadcastDocHeader')
      return [header, linkLine, noteLine].filter(Boolean).join('\n\n')
    }
    return broadcastMessage.trim()
  }

  function handleGroupBroadcast() {
    const text = composeBroadcastMessage()
    if (!text) { toast.error(t('team.broadcastEmpty')); return }
    window.open(whatsappShareUrl(text), '_blank')
  }

  function toggleMember(id: string) {
    setSelectedMembers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAllMembers() {
    setSelectedMembers(new Set(members.map(m => m.user_id)))
  }

  function clearMemberSelection() {
    setSelectedMembers(new Set())
  }

  const broadcastPreviewText = composeBroadcastMessage()
  const selectedCount = selectedMembers.size

  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--text-3)] flex items-center gap-2">
        <Send className="h-5 w-5" />
        {t('team.broadcastTitle')}
      </h2>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        {/* Üst başlık bantı */}
        <div className="flex items-start gap-3 border-b border-[var(--border)] bg-gradient-to-r from-brand/8 to-whatsapp/8 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand dark:bg-brand/20">
            <Send className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-[var(--text-1)]">{t('team.broadcastTitle')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-2)]">{t('team.broadcastSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-5 p-4">
          {/* İçerik türü seçici */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              {t('pagesUi.contentType')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBroadcastMode('doc')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  broadcastMode === 'doc'
                    ? `border-brand bg-brand text-white ${PRO_CTA_GRADIENT_ACTIVE_DARK_SM}`
                    : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {t('team.broadcastTypeDoc')}
              </button>
              <button
                onClick={() => setBroadcastMode('motiv')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  broadcastMode === 'motiv'
                    ? `border-brand bg-brand text-white ${PRO_CTA_GRADIENT_ACTIVE_DARK_SM}`
                    : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                {t('team.broadcastTypeMotiv')}
              </button>
            </div>
          </div>

          {/* İçerik girişi */}
          {broadcastMode === 'doc' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">
                  {t('team.broadcastLinkLabel')}
                </label>
                <input
                  type="url"
                  value={broadcastLink}
                  onChange={e => setBroadcastLink(e.target.value)}
                  placeholder={t('team.broadcastLinkPlaceholder')}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-2)]">
                  {t('team.broadcastNoteLabel')}
                </label>
                <textarea
                  rows={2}
                  value={broadcastNote}
                  onChange={e => setBroadcastNote(e.target.value)}
                  placeholder={t('team.broadcastNotePlaceholder')}
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-2)]">
                {t('team.broadcastMsgLabel')}
              </label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder={t('team.broadcastMsgPlaceholder')}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-brand transition-all"
              />
            </div>
          )}

          {/* Alıcı seçimi */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-3)]">
              {t('pagesUi.recipients')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBroadcastTarget('grup')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  broadcastTarget === 'grup'
                    ? 'border-whatsapp/35 bg-whatsapp/10 text-[#1a9e4f] dark:border-whatsapp/40 dark:text-whatsapp'
                    : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                }`}
              >
                <Users className="h-3.5 w-3.5 shrink-0" />
                {t('team.broadcastRecipientGroup')}
              </button>
              <button
                onClick={() => setBroadcastTarget('tekli')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                  broadcastTarget === 'tekli'
                    ? 'border-whatsapp/35 bg-whatsapp/10 text-[#1a9e4f] dark:border-whatsapp/40 dark:text-whatsapp'
                    : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--bg)]'
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                {t('team.broadcastRecipientSelect')}
              </button>
            </div>

            {/* Grup gönder */}
            {broadcastTarget === 'grup' && (
              <button
                onClick={handleGroupBroadcast}
                disabled={!broadcastPreviewText}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 text-sm font-bold text-white shadow-sm shadow-whatsapp/20 transition hover:bg-[#1fb85a] active:scale-[0.98] disabled:opacity-40"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {t('team.broadcastSendGroup')}
              </button>
            )}

            {/* Tekli seçim */}
            {broadcastTarget === 'tekli' && (
              <div className="space-y-2">
                {members.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-3)]">
                      {selectedCount > 0
                        ? t('team.broadcastMembersSelected', { count: String(selectedCount) })
                        : t('pagesUi.selectRecipients')}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={selectAllMembers} className="text-xs font-semibold text-brand hover:underline">
                        {t('team.broadcastSelectAll')}
                      </button>
                      <span className="text-[var(--border)]">·</span>
                      <button onClick={clearMemberSelection} className="text-xs font-semibold text-[var(--text-3)] hover:underline">
                        {t('team.broadcastClearAll')}
                      </button>
                    </div>
                  </div>
                )}
                <ul className="space-y-2">
                  {members.map(m => {
                    const selected = selectedMembers.has(m.user_id)
                    return (
                      <li key={m.user_id} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2.5 transition hover:bg-[var(--bg)]">
                        <button
                          onClick={() => toggleMember(m.user_id)}
                          className="shrink-0 text-[var(--text-3)] transition hover:text-brand"
                        >
                          {selected
                            ? <CheckSquare className="h-4 w-4 text-brand" />
                            : <Square className="h-4 w-4" />}
                        </button>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                          {(m.full_name ?? '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 truncate text-sm font-semibold text-[var(--text-1)]">
                          {m.full_name ?? 'İsimsiz Üye'}
                        </span>
                        {selected && (
                          <a
                            href={waHref(m.phone, broadcastPreviewText || '') || whatsappShareUrl(broadcastPreviewText || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => { if (!broadcastPreviewText) { e.preventDefault(); toast.error(t('team.broadcastEmpty')) } }}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-whatsapp text-white transition hover:bg-[#1fb85a] active:scale-95"
                            title={`WhatsApp: ${m.full_name ?? ''}`}
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {members.length <= 1 && (
                  <p className="rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-center text-sm text-[var(--text-2)]">
                    {t('pagesUi.noOtherMembers')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
