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
    const aiRemaining = Number.isFinite(dailyLimit)
      ? Math.max(0, dailyLimit - aiUsed)
      : Infinity

    return {
      limits,
      dailyLimit,
      isSuperAdmin,
      aiUsed,
      aiRemaining,
      // Günlük kota dolu mu? (süper admin asla dolmaz.) Tek kaynak — bileşenler
      // `!isSuperAdmin && aiRemaining <= 0` hesabını tekrar etmesin.
      limitReached: !isSuperAdmin && aiRemaining <= 0,
      isTrialActive: isTrialPeriodActive(
        ws?.licenseType,
        ws?.licenseExpiresAt,
        ws?.workspaceCreatedAt
      ),
      effectiveLicenseType: ws?.effectiveLicenseType ?? ws?.licenseType ?? 'free',
    }
  }, [ws, usage])
}
