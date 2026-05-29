'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getAccountLifecycle } from '@/lib/domain/accountLifecycle'

/** Free users past grace period may only use /odeme until they upgrade. */
export function AccountAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: ws, isLoading } = useWorkspace()

  const blocked = useMemo(() => {
    if (!ws || ws.isSuperAdmin) return false
    return getAccountLifecycle({
      licenseType: ws.licenseType,
      licenseExpiresAt: ws.licenseExpiresAt,
      workspaceCreatedAt: ws.workspaceCreatedAt,
    }).isAccessBlocked
  }, [ws])

  useEffect(() => {
    if (isLoading || !blocked) return
    if (!pathname.startsWith('/odeme')) {
      router.replace('/odeme?reason=access_expired')
    }
  }, [blocked, isLoading, pathname, router])

  if (blocked && !pathname.startsWith('/odeme')) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-3)]">
        …
      </div>
    )
  }

  return <>{children}</>
}
