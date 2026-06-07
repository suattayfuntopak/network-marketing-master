'use client'

import { useCallback, useState } from 'react'
import { UpgradePrompt, type UpgradeFeature } from '@/components/ui/UpgradePrompt'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

export function useUpgradePrompt() {
  const { hasAiCoachAccess, hasAiFieldAccess } = useFeatureAccess()
  const [gate, setGate] = useState<{ open: boolean; feature: UpgradeFeature }>({
    open: false,
    feature: 'ai_coach',
  })

  const openUpgrade = useCallback((feature: UpgradeFeature = 'ai_coach') => {
    setGate({ open: true, feature })
  }, [])

  const closeUpgrade = useCallback(() => {
    setGate(prev => ({ ...prev, open: false }))
  }, [])

  const prompt = (
    <UpgradePrompt feature={gate.feature} open={gate.open} onClose={closeUpgrade} />
  )

  return {
    hasAiCoachAccess,
    hasAiFieldAccess,
    openUpgrade,
    closeUpgrade,
    UpgradePrompt: prompt,
  }
}
