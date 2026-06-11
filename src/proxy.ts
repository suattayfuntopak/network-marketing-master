import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import {
  resolveIlgilenRedirect,
  resolveLegacySummaryRedirect,
} from '@/lib/domain/legacyRouteRedirects'

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

function redirectTo(request: NextRequest, destination: string) {
  const target = new URL(destination, request.url)
  return NextResponse.redirect(target, 308)
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  const legacySummary = resolveLegacySummaryRedirect(
    pathname,
    request.nextUrl.searchParams.get('offset'),
  )
  if (legacySummary) {
    return redirectTo(request, legacySummary)
  }

  if (pathname === '/bugun/ilgilen') {
    return redirectTo(
      request,
      resolveIlgilenRedirect(request.nextUrl.searchParams.get('tab')),
    )
  }

  // 1. If on the old vercel domain, client-side redirect to the official domain, mapping wildcards to /sifre-guncelle
  if (hostname === 'network-marketing-master.vercel.app') {
    let targetPath = pathname
    if (pathname === '/**' || pathname === '/**/' || pathname.includes('%2A%2A') || pathname.includes('**')) {
      targetPath = '/sifre-guncelle'
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Yönlendiriliyorsunuz...</title>
          <script>
            var hash = window.location.hash || '';
            var search = window.location.search || '';
            window.location.href = 'https://nmm.suattayfuntopak.com' + '${targetPath}' + search + hash;
          </script>
        </head>
        <body style="background:#0a0b10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <div style="border:3px solid #534AB7;border-top-color:transparent;border-radius:50%;width:24px;height:24px;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
            <p style="font-size:14px;opacity:0.8;">Yönlendiriliyorsunuz...</p>
          </div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  // 2. Client-side redirect for wildcard path on official domain too
  if (pathname === '/**' || pathname === '/**/' || pathname.includes('%2A%2A') || pathname.includes('**')) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Yönlendiriliyorsunuz...</title>
          <script>
            var hash = window.location.hash || '';
            var search = window.location.search || '';
            window.location.href = 'https://nmm.suattayfuntopak.com/sifre-guncelle' + search + hash;
          </script>
        </head>
        <body style="background:#0a0b10;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <div style="border:3px solid #534AB7;border-top-color:transparent;border-radius:50%;width:24px;height:24px;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
            <p style="font-size:14px;opacity:0.8;">Yönlendiriliyorsunuz...</p>
          </div>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }

  const isShopierWebhook =
    pathname === '/api/payment/shopier' || pathname === '/api/payment/shopier/'
  const isCronRoute = pathname.startsWith('/api/cron/')
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/d/') ||
    isShopierWebhook ||
    isCronRoute ||
    PUBLIC_PATHS.some(p => p !== '/api/payment/shopier' && pathname.startsWith(p))

  // Supabase SSR oturum cookie'si yoksa kullanıcı KESİN çıkış yapmış demektir.
  // Bu durumda `getUser()` (Supabase auth sunucusuna ~230ms'lik ağ doğrulaması)
  // gereksizdir — landing/giriş/kayıt gibi public sayfaların her açılışına
  // boşuna bir round-trip biniyordu. Cookie yoksa: public ise doğrudan geç,
  // değilse girişe yönlendir. Tek bir auth gidiş-dönüşü bile yapma.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

  if (!hasAuthCookie) {
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/giris'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
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

  // getClaims(): asimetrik signing key'de JWT YEREL doğrulanır (ağ yok); simetrik
  // anahtarda getUser()'a düşer. Her giriş yapmış navigasyondaki ~230ms'lik auth
  // round-trip'ini asimetrik anahtara geçilince sıfırlar. user truthy = geçerli oturum.
  const { data: claimsData } = await supabase.auth.getClaims()
  const user = claimsData?.claims ?? null

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
