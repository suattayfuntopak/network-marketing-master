'use client'

import { UpgradeGate, type UpgradeFeature } from '@/components/ui/UpgradeGate'

interface FeatureUpgradeGateProps {
  feature: 'team' | UpgradeFeature
  children: React.ReactNode
  locked: boolean
}

export function FeatureUpgradeGate({ feature, children, locked }: FeatureUpgradeGateProps) {
  return <UpgradeGate variant="overlay" feature={feature} locked={locked}>{children}</UpgradeGate>
}
