'use client'

import { useMemo } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  hasAiCoachAccess,
  hasAiFieldAccess,
  hasStatsAdvancedAccess,
  isPaidLicense,
} from '@/lib/domain/featureAccess'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'

export function useFeatureAccess() {
  const { data: ws } = useWorkspace()

  return useMemo(() => {
    const licenseType = ws?.licenseType
    const isSuperAdmin = ws?.isSuperAdmin ?? false

    return {
      licenseType,
      isSuperAdmin,
      isPaid: isPaidLicense(licenseType, isSuperAdmin),
      hasAiCoachAccess: hasAiCoachAccess(licenseType, isSuperAdmin),
      hasAiFieldAccess: hasAiFieldAccess(licenseType, isSuperAdmin),
      hasTeamFullAccess: hasTeamPageAccess(licenseType, isSuperAdmin),
      hasTeamPulseAccess: hasTeamPulseAccess(licenseType, isSuperAdmin),
      hasStatsAdvancedAccess: hasStatsAdvancedAccess(licenseType, isSuperAdmin),
    }
  }, [ws])
}
