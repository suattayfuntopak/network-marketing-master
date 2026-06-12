/**
 * Kişiyi diğerlerinden AYIRMAK için stabil renk (user_id'den türetilir → aynı
 * kişi her tabloda aynı renk). Dark + light temada rahat görünen tonlar.
 * - `icon`: ikon (ör. adam) metin rengi
 * - `bg`: satır/kutu için hafif pastel arka plan
 *
 * NOT: Tailwind JIT bu sınıfları kaynak literal'lerinden tarar; tam string
 * tutulmalı (dinamik birleştirme yapma).
 */
const PERSON_ACCENTS: { icon: string; bg: string }[] = [
  { icon: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  { icon: 'text-sky-500 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  { icon: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { icon: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { icon: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  { icon: 'text-fuchsia-500 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
  { icon: 'text-teal-500 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  { icon: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { icon: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export type PersonAccent = { icon: string; bg: string }

export function personAccent(seed: string): PersonAccent {
  return PERSON_ACCENTS[hashString(seed) % PERSON_ACCENTS.length]
}
