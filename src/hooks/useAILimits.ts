'use client'

import { useMemo } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAIUsage } from '@/hooks/useAIUsage'
import { getLimitsForLicense, isTrialPeriodActive } from '@/lib/domain/aiUsage'

export function useAILimits() {
  const { data: ws } = useWorkspace()
  const { data: usage } = useAIUsage()

  return useMemo(() => {
    const isSuperAdmin = ws?.isSuperAdmin ?? usage?.isSuperAdmin ?? false
    const limits = getLimitsForLicense(
      ws?.licenseType,
      isSuperAdmin,
      ws?.licenseExpiresAt,
      ws?.workspaceCreatedAt
    )
    const messageUsed = usage?.messageUsed ?? 0
    const roleplayUsed = usage?.roleplayUsed ?? 0
    const complianceUsed = usage?.complianceUsed ?? 0

    return {
      limits,
      isSuperAdmin,
      messageUsed,
      roleplayUsed,
      complianceUsed,
      messageRemaining: Math.max(0, limits.messageLimit - messageUsed),
      roleplayRemaining: Math.max(0, limits.roleplayLimit - roleplayUsed),
      complianceRemaining: Math.max(0, limits.complianceLimit - complianceUsed),
      isTrialActive: isTrialPeriodActive(
        ws?.licenseType,
        ws?.licenseExpiresAt,
        ws?.workspaceCreatedAt
      ),
      effectiveLicenseType: ws?.effectiveLicenseType ?? ws?.licenseType ?? 'free',
    }
  }, [ws, usage])
}
