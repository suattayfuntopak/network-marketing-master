import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import type { EmailOtpType } from '@supabase/supabase-js'

const RECOVERY_NEXT = '/sifre-guncelle'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash') ?? searchParams.get('token')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? RECOVERY_NEXT
  const errorDesc = searchParams.get('error_description')

  if (errorDesc) {
    return NextResponse.redirect(
      `${origin}/sifre-sifirla?error=${encodeURIComponent(errorDesc)}`,
    )
  }

  const redirectResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            redirectResponse.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirectResponse
    console.error('[auth/callback] exchangeCodeForSession:', error.message)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return redirectResponse
    console.error('[auth/callback] verifyOtp:', error.message)
  }

  return NextResponse.redirect(`${origin}/sifre-sifirla?error=link_gecersiz`)
}
