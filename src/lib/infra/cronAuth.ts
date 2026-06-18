import { NextRequest, NextResponse } from 'next/server'

/**
 * Ortak cron yetkilendirme guard'ı.
 *
 * `CRON_SECRET` tanımsız ya da boş string ise ve `Authorization: Bearer ` başlığı
 * gönderilirse `Bearer ${''} === 'Bearer '` eşleşip endpoint herkese açılırdı.
 * Bu yüzden secret'in varlığı ayrıca kontrol edilir.
 *
 * D-8: Secret eksikliği bir yapılandırma hatasıdır (500), yetkisiz istek değil (401) —
 * Shopier webhook'uyla tutarlı dürüst sınıflandırma.
 *
 * @returns Secret yoksa 500, yetkisizse 401, yetkiliyse `null`.
 */
export function cronAuthError(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cronAuth] CRON_SECRET tanımsız — endpoint yapılandırılmamış.')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
