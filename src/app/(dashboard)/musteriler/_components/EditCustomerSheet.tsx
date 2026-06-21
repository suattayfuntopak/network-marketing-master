'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useHistoryBackClose } from '@/hooks/useHistoryBackClose'
import { Z } from '@/lib/ui/zIndex'
import { Skeleton } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/query/keys'
import {
  deleteOrderAction,
  getCustomerDetailAction,
  updateCustomerAction,
  updateOrderAction,
} from '../actions'
import { customerInputClass } from './customerFormat'

type OrderDraft = {
  id: string
  amount: string
  orderedAt: string
  note: string
}

interface Props {
  customerId: string
  onClose: () => void
  onSaved?: () => void
}

export function EditCustomerSheet({ customerId, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [orders, setOrders] = useState<OrderDraft[]>([])
  const [syncedKey, setSyncedKey] = useState<string | null>(null)

  useBodyScrollLock()
  useHistoryBackClose(true, onClose)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customerDetail(customerId),
    queryFn: () => getCustomerDetailAction(customerId),
    staleTime: 15_000,
  })

  const draftKey = data
    ? `${customerId}:${data.orders.map(o => o.id).join(',')}:${data.customer.full_name}`
    : null

  if (draftKey && draftKey !== syncedKey && data) {
    setSyncedKey(draftKey)
    setFullName(data.customer.full_name)
    setPhone(data.customer.phone ?? '')
    setNote(data.customer.note ?? '')
    setOrders(data.orders.map(o => ({
      id: o.id,
      amount: String(o.amount),
      orderedAt: o.ordered_at.slice(0, 10),
      note: o.note ?? '',
    })))
  }

  async function invalidateAll() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.customers() }),
      qc.invalidateQueries({ queryKey: queryKeys.customerDetail(customerId) }),
    ])
  }

  async function handleSave() {
    if (!fullName.trim() || busy) return
    setBusy(true)
    try {
      await updateCustomerAction({
        customerId,
        fullName,
        phone,
        note,
      })

      for (const order of orders) {
        const amount = Number(order.amount.replace(',', '.'))
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error(t('musteriler.editInvalidAmount'))
        }
        await updateOrderAction({
          orderId: order.id,
          amount,
          orderedAt: order.orderedAt,
          note: order.note,
        })
      }

      toast.success(t('musteriler.customerUpdatedToast'))
      await invalidateAll()
      onSaved?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function removeOrder(orderId: string) {
    if (!confirm(t('musteriler.editOrderDeleteConfirm'))) return
    setBusy(true)
    try {
      await deleteOrderAction(orderId)
      setOrders(prev => prev.filter(o => o.id !== orderId))
      toast.success(t('musteriler.orderDeletedToast'))
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className={`fixed inset-0 ${Z.confirmBackdrop} flex items-center justify-center p-4`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg max-h-[min(85dvh,calc(100dvh-2rem))] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${Z.confirm}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text-1)]">{t('musteriler.editTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">{t('musteriler.namePlaceholder')}</label>
              <input className={customerInputClass} value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">{t('musteriler.phonePlaceholder')}</label>
              <input className={customerInputClass} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">{t('musteriler.notePlaceholder')}</label>
              <input className={customerInputClass} value={note} onChange={e => setNote(e.target.value)} maxLength={200} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">
                {t('musteriler.editOrdersSection')}
              </p>
              {orders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--text-3)]">
                  {t('musteriler.detailNoOrders')}
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--text-3)]">
                            {t('musteriler.editOrderDate')}
                          </label>
                          <input
                            type="date"
                            className={customerInputClass}
                            value={order.orderedAt}
                            onChange={e => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, orderedAt: e.target.value } : o))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--text-3)]">
                            {t('musteriler.amountPlaceholder')}
                          </label>
                          <input
                            className={customerInputClass}
                            value={order.amount}
                            onChange={e => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, amount: e.target.value } : o))}
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--text-3)]">
                          {t('musteriler.editOrderNote')}
                        </label>
                        <input
                          className={customerInputClass}
                          value={order.note}
                          onChange={e => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, note: e.target.value } : o))}
                          maxLength={200}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { void removeOrder(order.id) }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-500 transition hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('musteriler.editOrderDelete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={busy || !fullName.trim()}
                onClick={() => { void handleSave() }}
                className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-2)]"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
