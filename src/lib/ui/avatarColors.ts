/** Deterministic pastel avatar palette — distinct per name, readable in light & dark. */
const PASTEL_AVATARS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-950/45 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950/45 dark:text-rose-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/45 dark:text-teal-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/45 dark:text-fuchsia-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-300',
] as const

function hashName(name: string): number {
  let hash = 0
  const s = name.trim() || '?'
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getPastelAvatarClasses(name: string): string {
  return PASTEL_AVATARS[hashName(name) % PASTEL_AVATARS.length]
}
