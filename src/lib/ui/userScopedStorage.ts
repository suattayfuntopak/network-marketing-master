/**
 * Kullanıcıya özel CİHAZ-YEREL state için tek tip yardımcılar.
 *
 * Kural: kişiye özel hiçbir şey global anahtara yazılmaz — her zaman
 * `<base>_<userId>`. Aksi halde aynı tarayıcıda kullanıcı değişince önceki
 * kişinin verisi sızar. (Kalıcı/önemli veriler Supabase'de tutulur; burası
 * yalnız hızlı, cihaz-yerel önbellek/scratchpad içindir.)
 */

const NMM_PREFIX = 'nmm_'

// Çıkış süpürmesinde KORUNAN anahtarlar — cihaz tercihi, kullanıcı verisi değil.
const LOGOUT_KEEP = new Set<string>(['nmm_lang'])

export function scopedKey(base: string, userId: string): string {
  return `${base}_${userId}`
}

export function readUserScopedJSON<T>(
  base: string,
  userId: string | undefined | null,
  fallback: T,
): T {
  if (typeof window === 'undefined' || !userId) return fallback
  try {
    const raw = localStorage.getItem(scopedKey(base, userId))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeUserScopedJSON<T>(
  base: string,
  userId: string | undefined | null,
  value: T,
): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    localStorage.setItem(scopedKey(base, userId), JSON.stringify(value))
  } catch {
    /* kota dolu — yoksay */
  }
}

/**
 * Çıkışta çağrılır: paylaşılan bir tarayıcıda önceki kullanıcının izini bırakma.
 * `nmm_` ile başlayan tüm anahtarları siler (dil tercihi hariç). Tüm kalıcı
 * veriler zaten Supabase'de olduğundan bir sonraki girişte yeniden yüklenir.
 */
export function clearNmmLocalStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(NMM_PREFIX) && !LOGOUT_KEEP.has(k)) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
