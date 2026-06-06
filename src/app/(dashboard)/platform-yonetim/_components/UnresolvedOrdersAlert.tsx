'use client'

import { useState, useEffect, useTransition } from 'react'
import { AlertTriangle, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getUnresolvedOrdersAction,
  markOrderResolvedAction,
  type UnresolvedOrderItem,
} from '../admin-actions'

/**
 * Çözülemeyen Shopier siparişleri (müşteri ödedi ama note/productId eşleşmedi →
 * lisans tanımlanamadı). Süper admin burada görür; lisansı el ile tanımladıktan
 * sonra "Çözüldü" der. Hiç yoksa hiçbir şey göstermez.
 */
export function UnresolvedOrdersAlert() {
  const [orders, setOrders] = useState<UnresolvedOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    getUnresolvedOrdersAction()
      .then((d) => { if (active) setOrders(d) })
      .catch(() => { /* sessiz — panel kritik değil */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function handleResolve(orderId: string) {
    startTransition(async () => {
      try {
        await markOrderResolvedAction(orderId)
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
        toast.success('Sipariş çözüldü olarak işaretlendi')
      } catch {
        toast.error('İşlem başarısız oldu')
      }
    })
  }

  if (loading || orders.length === 0) return null

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            Çözülemeyen Ödeme ({orders.length})
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70">
            Müşteri ödemiş olabilir; lisansı el ile tanımlayıp çözüldü işaretleyin.
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-amber-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="space-y-2 px-4 pb-4">
          {orders.map((o) => (
            <li
              key={o.orderId}
              className="rounded-xl border border-amber-200/70 bg-[var(--bg-card)] p-3 dark:border-amber-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-xs font-semibold text-[var(--text-1)]">
                    Sipariş #{o.orderId}
                  </p>
                  <p className="truncate text-[11px] text-[var(--text-3)]">
                    <span className="font-medium">note:</span> {o.note ?? '—'}
                  </p>
                  <p className="truncate text-[11px] text-[var(--text-3)]">
                    <span className="font-medium">ürün:</span> {o.productId ?? '—'} ·{' '}
                    {new Date(o.processedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(o.orderId)}
                  disabled={pending}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F6E56] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Çözüldü
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
