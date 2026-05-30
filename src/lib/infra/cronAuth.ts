import { NextRequest, NextResponse } from 'next/server'

/**
 * Ortak cron yetkilendirme guard'ı.
 *
 * `CRON_SECRET` tanımsız ya da boş string ise ve `Authorization: Bearer ` başlığı
 * gönderilirse `Bearer ${''} === 'Bearer '` eşleşip endpoint herkese açılırdı.
 * Bu yüzden secret'in varlığı ayrıca kontrol edilir.
 *
 * @returns Yetkisizse 401 yanıtı, yetkiliyse `null`.
 */
export function cronAuthError(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
