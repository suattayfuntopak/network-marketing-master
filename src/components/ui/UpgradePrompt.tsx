'use client'

import { UpgradeGate, type UpgradeFeature } from '@/components/ui/UpgradeGate'

export type { UpgradeFeature }

interface UpgradePromptProps {
  feature: UpgradeFeature
  open: boolean
  onClose: () => void
}

export function UpgradePrompt({ feature, open, onClose }: UpgradePromptProps) {
  return <UpgradeGate variant="modal" feature={feature} open={open} onClose={onClose} />
}
