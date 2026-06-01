/** Shared theme-aware classes for (auth) routes — respects `next-themes` / `.dark`. */

export const authShellClass =
  'relative flex min-h-screen flex-col items-center justify-center px-4 text-[var(--text-1)] bg-gradient-to-b from-slate-50 via-[var(--bg)] to-slate-100 dark:bg-[#0a0b10] dark:bg-radial-[circle_at_top,_var(--tw-gradient-stops)] dark:from-[#1a1c2e] dark:via-[#0a0b10] dark:to-[#050508]'

export const authToolbarBtnClass =
  'flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-3)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]'

export const authLogoRingClass =
  'mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/30 bg-[var(--bg-card)] p-1 shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all group-hover:border-cyan-400/50 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.25)] group-hover:scale-105 dark:bg-slate-900/50 dark:shadow-[0_0_25px_rgba(6,182,212,0.25)]'

export const authTitleClass =
  'text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-600 via-indigo-700 to-purple-700 bg-clip-text text-transparent drop-shadow-sm dark:from-cyan-400 dark:via-indigo-200 dark:to-purple-400'

export const authLabelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-2)]'

export const authInputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'

export const authLinkAccentClass =
  'font-semibold text-cyan-600 hover:text-cyan-500 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300'

export const authLinkSecondaryClass =
  'font-semibold text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300'

export const authMutedClass = 'text-[var(--text-3)]'

export const authErrorClass =
  'rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700 dark:border-[#72243E]/20 dark:bg-[#FBEAF0]/10 dark:text-rose-300'

export const authSuccessClass =
  'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 dark:border-[#0F6E56]/20 dark:bg-[#E1F5EE]/10 dark:text-emerald-300'

export const authPrimaryBtnClass =
  'w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_20px_rgba(6,182,212,0.2)] dark:shadow-[0_4px_20px_rgba(6,182,212,0.25)]'
