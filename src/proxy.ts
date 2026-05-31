import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PUBLIC_PATHS = [
  '/giris', 
  '/kayit', 
  '/sifre-sifirla', 
  '/sifre-guncelle', 
  '/auth/callback', 
  '/auth/reset-password',
  '/api/payment/shopier', // Shopier webhook is whitelisted so it is fully public
  '/acilis',
  '/kvkk',
  '/kullanim-kosullari',
  '/guvenlik'
]

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // 1. If on the old vercel domain, redirect to the official domain, mapping wildcards to /sifre-guncelle
  if (hostname === 'network-marketing-master.vercel.app') {
    const url = request.nextUrl.clone()
    url.host = 'nmm.suattayfuntopak.com'
    url.protocol = 'https:'
    if (url.pathname === '/**' || url.pathname === '/**/' || url.pathname.includes('%2A%2A') || url.pathname.includes('**')) {
      url.pathname = '/sifre-guncelle'
    }
    return NextResponse.redirect(url)
  }

  // 2. Wildcard path check on official domain (fallback from Supabase)
  if (pathname === '/**' || pathname === '/**/' || pathname.includes('%2A%2A') || pathname.includes('**')) {
    const url = request.nextUrl.clone()
    url.pathname = '/sifre-guncelle'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isShopierWebhook =
    pathname === '/api/payment/shopier' || pathname === '/api/payment/shopier/'
  const isCronRoute = pathname.startsWith('/api/cron/')
  const isPublic =
    pathname === '/' ||
    isShopierWebhook ||
    isCronRoute ||
    PUBLIC_PATHS.some(p => p !== '/api/payment/shopier' && pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    return NextResponse.redirect(url)
  }

  const isPasswordReset = pathname.startsWith('/sifre-guncelle')
  const isAuthSystem = pathname.startsWith('/auth')
  const isLandingLegal =
    pathname === '/acilis' ||
    pathname === '/kvkk' ||
    pathname === '/kullanim-kosullari' ||
    pathname === '/guvenlik'

  if (user && isPublic && !isPasswordReset && !isAuthSystem && !isLandingLegal) {
    const url = request.nextUrl.clone()
    url.pathname = '/pano'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
