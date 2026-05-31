import { NextResponse, type NextRequest } from 'next/server'

/** Eski e-posta şablonları ve Supabase verify sonrası query param'ları buraya düşebilir. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const next = '/sifre-guncelle'
  const passthrough = new URLSearchParams()
  for (const key of ['code', 'token_hash', 'token', 'type', 'error_description']) {
    const val = searchParams.get(key)
    if (val) passthrough.set(key, val)
  }

  if (passthrough.has('code') || passthrough.has('token_hash') || passthrough.has('token')) {
    passthrough.set('next', next)
    return NextResponse.redirect(`${origin}/auth/callback?${passthrough.toString()}`)
  }

  return NextResponse.redirect(`${origin}/sifre-sifirla`)
}
