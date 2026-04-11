const ACADEMY_FAVORITES_KEY = 'nmm-system-academy-favorites'
const OBJECTION_FAVORITES_KEY = 'nmm-system-objection-favorites'

type FavoriteKind = 'academy' | 'objection'

function getStorageKey(kind: FavoriteKind) {
  return kind === 'academy' ? ACADEMY_FAVORITES_KEY : OBJECTION_FAVORITES_KEY
}

function readIds(kind: FavoriteKind) {
  if (typeof window === 'undefined') return [] as string[]

  try {
    const raw = window.localStorage.getItem(getStorageKey(kind))
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeIds(kind: FavoriteKind, ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getStorageKey(kind), JSON.stringify(ids))
}

export function isSystemFavorite(kind: FavoriteKind, id: string) {
  return readIds(kind).includes(id)
}

export function setSystemFavorite(kind: FavoriteKind, id: string, isFavorite: boolean) {
  const current = new Set(readIds(kind))

  if (isFavorite) current.add(id)
  else current.delete(id)

  writeIds(kind, Array.from(current))
}

