'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Zap, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAddCandidate } from '@/hooks/useCandidates'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { playNotificationSound } from '@/lib/ui/notificationSound'
import {
  isNotificationPushEnabled,
  isNotificationSoundEnabled,
} from '@/lib/ui/notificationPrefsStorage'
import { buildCandidateContentFields } from '@/lib/domain/candidateFields'

interface QuickAddModalProps {
  onClose: () => void
}

export function QuickAddModal({ onClose }: QuickAddModalProps) {
  const [mounted] = useState(() => typeof window !== 'undefined')
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const addCandidate = useAddCandidate(ws?.workspaceId || '')
  
  const [fullName, setFullName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useBodyScrollLock()

  useEffect(() => {
    const originalScrollY = window.scrollY
    
    // Focus the input automatically on mount without scrolling viewport Y
    inputRef.current?.focus({ preventScroll: true })

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Restore scroll Y position to prevent keyboard / focus shifting on mobile
      window.scrollTo(window.scrollX, originalScrollY)
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ws?.workspaceId || !fullName.trim()) return

    setLoading(true)
    try {
      await addCandidate.mutateAsync({
        full_name: fullName.trim(),
        stage: 'yeni',
        ...buildCandidateContentFields({ noteTr: notes.trim() }),
      })

      // Trigger user alerts based on preferences
      if (isNotificationSoundEnabled()) {
        playNotificationSound()
      }

      if (isNotificationPushEnabled() && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Yeni Aday Eklendi!', {
          body: `${fullName.trim()} ekibinize yeni aday olarak başarıyla eklendi.`,
          icon: '/logo.png'
        })
      }

      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className={`fixed inset-0 ${Z.sheet} flex items-center justify-center p-4`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] transition-all animate-in fade-in zoom-in-95 duration-200" style={{ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500">
              <Zap className="h-4.5 w-4.5 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-1)]">{t('common.quickAddTitle')}</h2>
              <p className="text-[11px] text-[var(--text-3)] font-medium mt-0.5">{t('common.quickAddSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]" htmlFor="fullName">
              {t('pipeline.fullName')} *
            </label>
            <input
              ref={inputRef}
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('common.quickAddNamePlaceholder')}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EEEDFE] dark:focus:ring-[#534AB7]/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]" htmlFor="notes">
              {t('pipeline.notes')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('common.quickAddInfoPlaceholder')}
              rows={3}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EEEDFE] dark:focus:ring-[#534AB7]/10 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-semibold text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)] active:scale-95 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-[0_4px_15px_rgba(6,182,212,0.2)]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 fill-current" />
                  {t('common.add')}
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
