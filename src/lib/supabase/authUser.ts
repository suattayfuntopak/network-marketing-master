import 'server-only'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

/**
 * Request-scoped cached auth user.
 *
 * `supabase.auth.getUser()` validates the JWT against Supabase'in auth sunucusu —
 * yani bir ağ gidiş-dönüşü. Pano açılışındaki prefetch (workspace + candidates +
 * team + aiUsage) önceden HER aksiyon için ayrı bir getUser() çağırıyordu; bu da
 * giriş→pano yoluna 4-5 ardışık auth round-trip'i biniyordu. React `cache()` aynı
 * sunucu isteği boyunca sonucu hafızada tutar → tek navigasyondaki tüm server
 * action'lar TEK getUser() round-trip'i paylaşır.
 *
 * KİLİTLİ: prefetch edilen / hot-path server action'lar getUser() yerine bunu
 * çağırmalı. Prefetch edilen bir aksiyona ham `supabase.auth.getUser()` geri
 * eklemek, aksiyon-başına round-trip'i ve giriş→pano yavaşlamasını geri getirir.
 */
export const getAuthUser = cache(
  async (): Promise<{ user: User | null; error: Error | null }> => {
    const supabase = await createClient()

    // getClaims(): proje ASİMETRİK JWT signing key kullanıyorsa imza YEREL
    // doğrulanır (WebCrypto + cache'li JWKS) — ağ round-trip'i YOK (~0ms).
    // Proje hâlâ SİMETRİK (HS256, eski varsayılan) ise getClaims otomatik olarak
    // getUser()'a (ağ ~230ms) düşer → davranış birebir aynı, regresyon yok.
    // Dashboard'dan asimetrik anahtara geçilince HER server action'dan ~230ms
    // auth doğrulaması kalkar. Kod yalnızca id/email/user_metadata okuduğu için
    // (doğrulanmış) claims'ten güvenle minimal User kurulur.
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data?.claims) {
      return { user: null, error: (error as Error | null) ?? null }
    }
    const c = data.claims
    const user = {
      id: c.sub,
      email: c.email ?? undefined,
      user_metadata: c.user_metadata ?? {},
      app_metadata: c.app_metadata ?? {},
      aud: typeof c.aud === 'string' ? c.aud : '',
      created_at: '',
    } as unknown as User
    return { user, error: null }
  }
)
