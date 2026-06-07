'use client'

/** Free kullanıcılar uygulamada kalır; özellik kilitleri ayrı yönetilir. */
export function AccountAccessGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
