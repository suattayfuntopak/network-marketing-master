import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/sifre-guncelle'
  const errorDesc = searchParams.get('error_description')

  if (errorDesc) {
    return NextResponse.redirect(
      `${origin}/sifre-sifirla?error=${encodeURIComponent(errorDesc)}`
    )
  }

  if (code) {
    // Cookie'leri doğrudan redirect response'a yaz
    const redirectResponse = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              redirectResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return redirectResponse
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
  }

  return NextResponse.redirect(`${origin}/sifre-sifirla?error=link_gecersiz`)
}
