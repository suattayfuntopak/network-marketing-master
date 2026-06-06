'use client'

import { useState, useTransition } from 'react'
import { X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'
import { adminExtendLicenseAction } from '../admin-actions'
import type { PlatformWorkspaceItem } from '../actions'

interface Props {
  workspace: PlatformWorkspaceItem
  onClose: () => void
  onSuccess: () => void
}

export function WorkspaceLicenseModal({ workspace, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [licenseType, setLicenseType] = useState<'free' | 'basic' | 'plus' | 'pro'>(
    (workspace.licenseType as 'free' | 'basic' | 'plus' | 'pro') ?? 'plus'
  )
  const [extensionDays, setExtensionDays] = useState(30)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [isUpdating, startUpdateTransition] = useTransition()

  function handleSaveLicense(e: React.FormEvent) {
    e.preventDefault()
    startUpdateTransition(async () => {
      try {
        const res = await adminExtendLicenseAction(
          workspace.workspaceId,
          licenseType,
          Number(extensionDays),
          isUnlimited
        )
        if (res.success) {
          toast.success(t('platformPage.licenseUpdated'))
          onClose()
          onSuccess()
        }
      } catch (err: unknown) {
        console.error(err)
        toast.error((err instanceof Error ? err.message : '') || 'İşlem başarısız.')
      }
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 ${Z.confirmBackdrop} bg-black/60 backdrop-blur-sm`}
        onClick={onClose}
      />
      <div className={`fixed left-1/2 top-1/2 ${Z.confirm} w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] overflow-hidden`}>
        <div className="h-1.5 w-full bg-gradient-to-r from-[#534AB7] to-amber-500" />

        <form onSubmit={handleSaveLicense} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-1)]">
              {t('platformPage.manageWorkspaceLicense')}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl bg-[var(--bg-subtle)] p-3 text-sm leading-relaxed text-[var(--text-2)] font-semibold border border-[var(--border)]">
            <div><strong>{t('platformPage.userLabel')}</strong> {workspace.ownerName}</div>
            <div className="mt-1"><strong>{t('platformPage.emailLabel')}</strong> {workspace.ownerEmail}</div>
            <div className="mt-1"><strong>{t('platformPage.currentExpiryLabel')}</strong> {
              workspace.licenseType !== 'free' && !workspace.licenseExpiresAt
                ? t('platformPage.unlimitedWithIcon')
                : workspace.licenseExpiresAt
                  ? new Date(workspace.licenseExpiresAt).toLocaleString()
                  : '-'
            }</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-[var(--text-1)]">
              {t('platformPage.licenseLevel')}
            </label>
            <select
              value={licenseType}
              onChange={e => {
                const v = e.target.value as typeof licenseType
                setLicenseType(v)
                if (v === 'free') setIsUnlimited(false)
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
            >
              <option value="free">{t('platformPage.freeRevoke')}</option>
              <option value="basic">Basic Plan</option>
              <option value="plus">Plus Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>

          {licenseType !== 'free' && (
            <>
              <button
                type="button"
                onClick={() => setIsUnlimited(v => !v)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors duration-300 ease-out ${
                  isUnlimited
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]'
                }`}
              >
                <span>{t('platformPage.unlimitedAccess')}</span>
                <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${isUnlimited ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out will-change-transform ${isUnlimited ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isUnlimited ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                }`}
                aria-hidden={isUnlimited}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1.5 pt-2">
                    <label className="text-sm font-bold text-[var(--text-1)]">
                      {t('platformPage.extendAccessDays')}
                      <span className="ml-1 font-normal text-[var(--text-3)]">
                        {t('platformPage.extendAccessHint')}
                      </span>
                    </label>
                    <input
                      type="number"
                      required={!isUnlimited}
                      disabled={isUnlimited}
                      min={1}
                      value={extensionDays}
                      onChange={e => setExtensionDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[#534AB7] transition"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-base font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t('platformPage.saving')}</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {t('platformPage.upgradeSave')}</>
            )}
          </button>
        </form>
      </div>
    </>
  )
}
