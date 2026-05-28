import { Wrench } from 'lucide-react'

export function MaintenanceNotice() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
          <Wrench className="h-8 w-8 text-amber-400" strokeWidth={1.75} />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-1)]">
            Ödeme sistemi geçici olarak bakımda
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            Sistem güncellemesi sebebiyle yeni lisans satın alımı kısa süreliğine devre dışı.
            Lütfen birkaç dakika sonra tekrar deneyin. Mevcut lisansınız etkilenmedi.
          </p>
        </div>

        <div className="w-full border-t border-amber-500/20" />

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-1)]">
            Payment system temporarily under maintenance
          </h2>
          <p className="text-sm text-[var(--text-3)]">
            New license purchases are briefly disabled for a system update.
            Please try again in a few minutes. Your existing license is unaffected.
          </p>
        </div>
      </div>
    </main>
  )
}
