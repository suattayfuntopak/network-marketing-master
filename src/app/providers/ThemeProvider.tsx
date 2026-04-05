import type { ReactNode } from 'react'

// Apply theme before first render to avoid flash
function applyTheme() {
  const stored = localStorage.getItem('nmm-theme')
  // Only 'light' or 'dark'; default to 'dark'
  const isDark = stored !== 'light'
  document.documentElement.classList.toggle('dark', isDark)
}

// Run immediately (outside component lifecycle)
applyTheme()

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
