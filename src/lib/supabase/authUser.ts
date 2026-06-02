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
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error: (error as Error | null) ?? null }
  }
)
