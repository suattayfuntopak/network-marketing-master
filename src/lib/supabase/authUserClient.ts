import { createClient } from './client'

/**
 * Browser: doğrulanmış kullanıcı id'si.
 *
 * `supabase.auth.getUser()` her çağrıda Supabase auth sunucusuna bir ağ
 * gidiş-dönüşü (~230ms) yapar. `getClaims()` ise proje ASİMETRİK JWT signing
 * key kullanıyorsa imzayı YEREL doğrular (WebCrypto + cache'li JWKS, ~0ms);
 * simetrik (HS256) anahtarda otomatik olarak getUser'a düşer → davranış birebir
 * aynı, regresyon yok. Client hook/yardımcılar kimlik için bunu çağırmalı; ham
 * `supabase.auth.getUser()` (her tıklamada/sorguda auth round-trip) yerine.
 */
export async function getClientUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims?.sub ?? null
}
