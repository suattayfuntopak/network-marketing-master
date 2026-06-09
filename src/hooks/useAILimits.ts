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
    const aiUsed = usage?.aiUsed ?? 0
    const dailyLimit = limits.dailyLimit

    return {
      limits,
      dailyLimit,
      isSuperAdmin,
      aiUsed,
      aiRemaining: Number.isFinite(dailyLimit)
        ? Math.max(0, dailyLimit - aiUsed)
        : Infinity,
      isTrialActive: isTrialPeriodActive(
        ws?.licenseType,
        ws?.licenseExpiresAt,
        ws?.workspaceCreatedAt
      ),
      effectiveLicenseType: ws?.effectiveLicenseType ?? ws?.licenseType ?? 'free',
    }
  }, [ws, usage])
}
