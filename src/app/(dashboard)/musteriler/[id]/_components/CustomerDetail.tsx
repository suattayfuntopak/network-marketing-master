'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '@/providers/LanguageProvider'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { queryKeys } from '@/lib/query/keys'
import { useCustomerDetail } from '@/hooks/useCustomerDetail'
import { surfaceAiQuotaError } from '@/lib/ui/aiQuotaError'
import {
  addOrderAction,
  deleteCustomerAction,
  generateCustomerOutreachAction,
} from '../../actions'
import { CustomerAiMessageModal } from '../../_components/CustomerAiMessageModal'
import { CustomerContactActions } from '../../_components/CustomerContactActions'
import { EditCustomerSheet } from '../../_components/EditCustomerSheet'
import { customerInputClass, formatCustomerDate, formatTry } from '../../_components/customerFormat'

type AiModalState = {
  customerName: string
  phone: string | null
  message: string
  loading: boolean
  error: string | null
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const { t, lang } = useTranslation()
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading } = useCustomerDetail(customerId)
  const { hasAiFieldAccess, openUpgrade, UpgradePrompt } = useUpgradePrompt()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addingOrder, setAddingOrder] = useState(false)
  const [orderAmount, setOrderAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [aiModal, setAiModal] = useState<AiModalState | null>(null)

  useBodyScrollLock(confirmDelete || !!aiModal)

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.customers() }),
      qc.invalidateQueries({ queryKey: queryKeys.customerDetail(customerId) }),
    ])
  }

  async function handleAddOrder() {
    const amount = Number(orderAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount < 0 || busy) return
    setBusy(true)
    try {
      await addOrderAction({ customerId, amount })
      toast.success(t('musteriler.orderAddedToast'))
      setOrderAmount('')
      setAddingOrder(false)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteCustomer() {
    setBusy(true)
    try {
      await deleteCustomerAction(customerId)
      toast.success(t('musteriler.deletedToast'))
      await qc.invalidateQueries({ queryKey: queryKeys.customers() })
      router.push('/musteriler')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  async function handleCustomerAi() {
    if (!data?.customer) return
    if (!hasAiFieldAccess) {
      openUpgrade('ai_field')
      return
    }
    const c = data.customer
    setGeneratingId(c.id)
    setAiModal({
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

  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="w-full space-y-4">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <p className="text-sm text-[var(--text-3)]">{t('musteriler.detailNotFound')}</p>
          <Link href="/musteriler" className="mt-4 inline-flex text-sm font-semibold text-brand">
            {t('musteriler.detailBack')}
          </Link>
        </div>
      </main>
    )
  }

  const { customer, orders } = data

  return (
    <>
      <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
        <div className="w-full space-y-5">
          <div className="flex items-center gap-3">
            <Link
              href="/musteriler"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-[var(--bg-subtle)]"
              aria-label={t('musteriler.detailBack')}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-[var(--text-1)]">{customer.full_name}</h1>
              <p className="text-xs text-[var(--text-3)]">{t('musteriler.detailSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-2)] transition hover:bg-brand-subtle hover:text-brand"
              aria-label={t('musteriler.detailEditCta')}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('musteriler.statRevenue'), value: formatTry(customer.totalAmount, lang) },
              { label: t('musteriler.statOrders'), value: customer.orderCount },
              { label: t('musteriler.detailRegistered'), value: formatCustomerDate(customer.created_at, lang) },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center shadow-sm">
                <div className="text-sm font-black text-[var(--text-1)] sm:text-base">{item.value}</div>
                <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-3)]">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <CustomerContactActions
              phone={customer.phone}
              customerId={customer.id}
              t={t}
              generatingId={generatingId}
              hasAiFieldAccess={hasAiFieldAccess}
              onAiClick={() => { void handleCustomerAi() }}
              className="mt-0"
            />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[var(--text-3)]">{t('musteriler.detailPhone')}</dt>
                <dd className="text-right font-medium text-[var(--text-1)]">{customer.phone ?? '—'}</dd>
              </div>
              {customer.note && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[var(--text-3)]">{t('musteriler.detailNote')}</dt>
                  <dd className="text-right text-[var(--text-2)]">{customer.note}</dd>
                </div>
              )}
              {customer.lastOrderAt && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[var(--text-3)]">{t('musteriler.detailLastOrder')}</dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCustomerDate(customer.lastOrderAt, lang)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-3)]">
                {t('musteriler.detailOrdersTitle')}
              </h2>
              {!addingOrder && (
                <button
                  type="button"
                  onClick={() => setAddingOrder(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('musteriler.addOrderCta')}
                </button>
              )}
            </div>

            {addingOrder && (
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
                <input
                  className={`${customerInputClass} flex-1`}
                  placeholder={t('musteriler.amountPlaceholder')}
                  value={orderAmount}
                  onChange={e => setOrderAmount(e.target.value)}
                  inputMode="decimal"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { void handleAddOrder() }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingOrder(false); setOrderAmount('') }}
                  className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-3)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-4 py-8 text-center text-sm text-[var(--text-3)]">
                {t('musteriler.detailNoOrders')}
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatTry(order.amount, lang)}
                      </p>
                      <p className="shrink-0 text-xs font-medium text-[var(--text-3)]">
                        {formatCustomerDate(order.ordered_at, lang)}
                      </p>
                    </div>
                    {order.note && (
                      <p className="mt-2 text-sm text-[var(--text-2)]">{order.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/60 bg-rose-50/50 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
            {t('musteriler.deleteCustomerCta')}
          </button>
        </div>
      </main>

      {editOpen && (
        <EditCustomerSheet
          customerId={customerId}
          onClose={() => setEditOpen(false)}
        />
      )}

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

      {confirmDelete && (
        <ConfirmDeleteModal
          message={t('musteriler.deleteConfirm')}
          onConfirm={() => { void handleDeleteCustomer() }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {UpgradePrompt}
    </>
  )
}
