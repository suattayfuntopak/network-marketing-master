import { NextResponse, type NextRequest } from 'next/server'

// Eski proje email şablonları bu path'e yönlendiriyor.
// code veya token varsa /auth/callback'e, yoksa /sifre-sifirla'ya at.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')

  if (code) {
    return NextResponse.redirect(`${origin}/auth/callback?code=${code}&next=/sifre-guncelle`)
  }

  if (token) {
    return NextResponse.redirect(`${origin}/auth/callback?token=${token}&next=/sifre-guncelle`)
  }

  return NextResponse.redirect(`${origin}/sifre-sifirla`)
}
