'use client'

import { useState } from 'react'
import { ShoppingBag, Plus, Trash2, Phone, X, Bot, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { pageHeaderIconClass } from '@/lib/ui/pageHeaderIcon'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { Skeleton } from '@/components/ui/Skeleton'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useCustomers } from '@/hooks/useCustomers'
import { queryKeys } from '@/lib/query/keys'
import { waHref } from '@/lib/utils/waLink'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { surfaceAiQuotaError } from '@/lib/ui/aiQuotaError'
import { addCustomerAction, addOrderAction, deleteCustomerAction, generateCustomerOutreachAction } from '../actions'
import type { CustomerWithStats } from '@/lib/domain/customerStats'
import { CustomerAiMessageModal } from './CustomerAiMessageModal'

function formatTry(amount: number, lang: string): string {
  return `₺${amount.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 2 })}`
}

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-brand'

type AiModalState = {
  customerId: string
  customerName: string
  phone: string | null
  message: string
  loading: boolean
  error: string | null
}

function CustomerContactActions({
  c,
  t,
  generatingId,
  hasAiFieldAccess,
  onAiClick,
}: {
  c: CustomerWithStats
  t: ReturnType<typeof useTranslation>['t']
  generatingId: string | null
  hasAiFieldAccess: boolean
  onAiClick: () => void
}) {
  const waLink = c.phone ? waHref(c.phone) : null
  const generating = generatingId === c.id

  return (
    <div className="mt-2 flex items-center gap-1.5">
      {c.phone && (
        <a
          href={`tel:${c.phone}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A56DB] transition-all hover:scale-105 hover:shadow-md sm:hidden"
          aria-label={t('pipeline.call')}
          title={t('pipeline.call')}
        >
          <Phone className="h-4 w-4" strokeWidth={1.75} />
        </a>
      )}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-whatsapp text-white transition-all hover:scale-105 hover:shadow-md"
          aria-label="WhatsApp"
          title="WhatsApp"
        >
          <WhatsAppIcon className="h-4 w-4" />
        </a>
      ) : (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-3)]"
          title={t('pipeline.noWhatsApp')}
          aria-hidden
        >
          <WhatsAppIcon className="h-4 w-4 opacity-40" />
        </div>
      )}
      <button
        type="button"
        onClick={onAiClick}
        disabled={generating}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand transition-all hover:scale-105 hover:shadow-md disabled:opacity-50"
        aria-label={t('musteriler.aiMessageCta')}
        title={t('musteriler.aiMessageCta')}
      >
        {generating ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        ) : (
          <Bot className="h-4 w-4" strokeWidth={1.75} />
        )}
        {!hasAiFieldAccess && (
          <Lock className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-[var(--text-3)]" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </div>
  )
}

export function MusterilerContent() {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading } = useCustomers()
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [orderFor, setOrderFor] = useState<string | null>(null)
  const [orderAmount, setOrderAmount] = useState('')
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [aiModal, setAiModal] = useState<AiModalState | null>(null)

  useBodyScrollLock(!!aiModal)

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.customers() })

  async function submitCustomer() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await addCustomerAction({ fullName: name, phone, note })
      toast.success(t('musteriler.addedToast'))
      setName(''); setPhone(''); setNote(''); setAdding(false)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function submitOrder(customerId: string) {
    const amount = Number(orderAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount < 0 || busy) return
    setBusy(true)
    try {
      await addOrderAction({ customerId, amount })
      toast.success(t('musteriler.orderAddedToast'))
      setOrderAmount(''); setOrderFor(null)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function removeCustomer(c: CustomerWithStats) {
    if (!confirm(t('musteriler.deleteConfirm'))) return
    try {
      await deleteCustomerAction(c.id)
      toast.success(t('musteriler.deletedToast'))
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleCustomerAi(c: CustomerWithStats) {
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    setGeneratingId(c.id)
    setAiModal({
      customerId: c.id,
      customerName: c.full_name,
      phone: c.phone,
      message: '',
      loading: true,
      error: null,
    })
    try {
      const result = await generateCustomerOutreachAction(c.id, lang === 'en' ? 'en' : 'tr')
      if (result.error || !result.message) {
        setAiModal(prev => prev ? {
          ...prev,
          loading: false,
          error: result.error ?? t('musteriler.aiMessageError'),
        } : null)
        if (result.quotaError) {
          surfaceAiQuotaError(result, {
            openUpgrade,
            toastError: msg => toast.error(msg),
            feature: 'ai_field',
            fallbackMessage: result.error ?? t('musteriler.aiMessageError'),
          })
        }
        return
      }
      setAiModal(prev => prev ? {
        ...prev,
        loading: false,
        message: result.message ?? '',
      } : null)
    } catch (err) {
      setAiModal(prev => prev ? {
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      } : null)
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <>
      <HubPageShell
        title={t('musteriler.title')}
        icon={ShoppingBag}
        iconClassName={pageHeaderIconClass('/musteriler')}
        backHref="/pano"
        showRefresh={false}
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('musteriler.statRevenue'), value: data ? formatTry(data.totalRevenue, lang) : '—' },
            { label: t('musteriler.statCustomers'), value: data?.customerCount ?? 0 },
            { label: t('musteriler.statOrders'), value: data?.totalOrders ?? 0 },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center shadow-sm">
              <div className="text-lg font-black text-[var(--text-1)]">{s.value}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          {adding ? (
            <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <input className={inputClass} placeholder={t('musteriler.namePlaceholder')} value={name} onChange={e => setName(e.target.value)} autoFocus />
              <input className={inputClass} placeholder={t('musteriler.phonePlaceholder')} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" />
              <input className={inputClass} placeholder={t('musteriler.notePlaceholder')} value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
              <div className="flex gap-2">
                <button type="button" disabled={busy || !name.trim()} onClick={submitCustomer} className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                  {t('common.save')}
                </button>
                <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-2)]">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-subtle/20 px-3 py-3 text-sm font-bold text-brand transition hover:bg-brand-subtle/40">
              <Plus className="h-4 w-4" />
              {t('musteriler.addCustomerCta')}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
          ) : !data || data.customers.length === 0 ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-3)]">
              {t('musteriler.empty')}
            </p>
          ) : (
            data.customers.map(c => (
              <div key={c.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[var(--text-1)]">{c.full_name}</div>
                    <CustomerContactActions
                      c={c}
                      t={t}
                      generatingId={generatingId}
                      hasAiFieldAccess={hasAiFieldAccess}
                      onAiClick={() => { void handleCustomerAi(c) }}
                    />
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatTry(c.totalAmount, lang)}</div>
                    <div className="text-[10px] text-[var(--text-3)]">
                      {c.orderCount > 0
                        ? t('musteriler.orderCountLabel', { count: c.orderCount })
                        : t('musteriler.noOrdersLabel')}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {orderFor === c.id ? (
                    <>
                      <input
                        className={`${inputClass} flex-1`}
                        placeholder={t('musteriler.amountPlaceholder')}
                        value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value)}
                        inputMode="decimal"
                        autoFocus
                      />
                      <button type="button" disabled={busy} onClick={() => submitOrder(c.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {t('common.add')}
                      </button>
                      <button type="button" onClick={() => { setOrderFor(null); setOrderAmount('') }} className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-3)]">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setOrderFor(c.id); setOrderAmount('') }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Plus className="h-3.5 w-3.5" /> {t('musteriler.addOrderCta')}
                      </button>
                      <button type="button" onClick={() => removeCustomer(c)} className="ml-auto rounded-lg p-1.5 text-[var(--text-3)] transition hover:text-rose-500" aria-label={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </HubPageShell>

      {aiModal && (
        <CustomerAiMessageModal
          t={t}
          customerName={aiModal.customerName}
          phone={aiModal.phone}
          message={aiModal.message}
          loading={aiModal.loading}
          error={aiModal.error}
          onClose={() => setAiModal(null)}
        />
      )}
      {UpgradePrompt}
    </>
  )
}
