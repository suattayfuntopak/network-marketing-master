'use client'

import { Smartphone } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Z } from '@/lib/ui/zIndex'

/**
 * Telefon ve tabletlerde YATAY konumda tam-ekran "dik konuma getirin" yönlendirmesi.
 * Görünürlük tamamen CSS ile yönetilir (`.orientation-lock` + globals.css media query);
 * burada yalnızca markup + i18n metni var. Masaüstü/laptop etkilenmez (pointer: coarse).
 */
export function OrientationLock() {
  const { t } = useTranslation()
  return (
    <div
      className={`orientation-lock fixed inset-0 ${Z.orientationLock} flex-col items-center justify-center gap-5 bg-[var(--bg)] px-8 text-center`}
      role="alertdialog"
      aria-label={t('common.rotateTitle')}
    >
      <div className="flex h-16 w-16 rotate-90 items-center justify-center rounded-2xl bg-brand-subtle text-brand dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
        <Smartphone className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <div className="max-w-xs space-y-2">
        <p className="text-lg font-bold text-[var(--text-1)]">{t('common.rotateTitle')}</p>
        <p className="text-sm leading-relaxed text-[var(--text-3)]">{t('common.rotateDesc')}</p>
      </div>
    </div>
  )
}
