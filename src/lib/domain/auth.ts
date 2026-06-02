import type { User } from '@supabase/supabase-js'
import { SUPER_ADMIN_EMAIL } from '@/lib/domain/constants'
import { normalizeLicenseType, type LicenseTier } from '@/lib/domain/aiUsage'

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
  licenseType: LicenseTier
  licenseExpiresAt: string | null
  isSuperAdmin: boolean
} {
  const admin = isSuperAdmin(user)
  if (admin) {
    return { ...superAdminLicenseOverride(), isSuperAdmin: true }
  }
  return {
    // normalizeLicenseType: legacy leader/master DB değerlerini basic/plus'a indirger.
    licenseType: normalizeLicenseType(ws?.license_type),
    licenseExpiresAt: ws?.license_expires_at ?? null,
    isSuperAdmin: false,
  }
}
