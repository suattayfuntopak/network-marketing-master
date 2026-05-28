import type { User } from '@supabase/supabase-js'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'

/** Platform owner + real NMM user (dual role per CLAUDE.md §4). */
export function isSuperAdmin(user: { email?: string | null } | null | undefined): boolean {
  return user?.email === SUPER_ADMIN_EMAIL
}

export function assertSuperAdmin(
  user: { email?: string | null; id?: string } | null | undefined
): asserts user is { email: string; id: string } {
  if (!user || !isSuperAdmin(user)) {
    throw new Error('Yetkisiz erişim: Bu işlemi sadece Süper Admin gerçekleştirebilir.')
  }
}

/** Super admin gets unlimited AI quota; everyone else uses license limits. */
export function bypassAILimits(user: { email?: string | null } | null | undefined): boolean {
  return isSuperAdmin(user)
}

export function superAdminLicenseOverride(): {
  licenseType: 'pro'
  licenseExpiresAt: null
} {
  return { licenseType: 'pro', licenseExpiresAt: null }
}

export function resolveWorkspaceLicense(
  user: User | null | undefined,
  ws: { license_type?: string | null; license_expires_at?: string | null } | null
): {
  licenseType: 'free' | 'leader' | 'master' | 'pro'
  licenseExpiresAt: string | null
  isSuperAdmin: boolean
} {
  const admin = isSuperAdmin(user)
  if (admin) {
    return { ...superAdminLicenseOverride(), isSuperAdmin: true }
  }
  return {
    licenseType: (ws?.license_type ?? 'free') as 'free' | 'leader' | 'master' | 'pro',
    licenseExpiresAt: ws?.license_expires_at ?? null,
    isSuperAdmin: false,
  }
}
