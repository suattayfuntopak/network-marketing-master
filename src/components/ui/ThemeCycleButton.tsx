'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { ThemeIcon, useThemeCycle, type ThemeMode } from '@/lib/ui/themeToggle'

type Props = {
  buttonClassName?: string
  iconClassName?: string
  /** Override tooltip; defaults to common.theme* keys for the *next* mode after click. */
  titleForMode?: (mode: ThemeMode) => string
}

export function ThemeCycleButton({
  buttonClassName = 'flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]',
  iconClassName = 'h-4 w-4',
  titleForMode,
}: Props) {
  const { t } = useTranslation()
  const { mounted, displayMode, cycle } = useThemeCycle()

  if (!mounted) {
    return <div className={buttonClassName} aria-hidden />
  }

  const defaultTitle: Record<ThemeMode, string> = {
    dark: t('common.themeLight'),
    light: t('common.themeSystem'),
    system: t('common.themeDark'),
  }

  const title = titleForMode ? titleForMode(displayMode) : defaultTitle[displayMode]

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className={buttonClassName}
    >
      <ThemeIcon mode={displayMode} className={iconClassName} />
    </button>
  )
}
