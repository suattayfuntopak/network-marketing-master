'use client'

import { useState } from 'react'
import { UpgradePrompt, type UpgradeFeature } from '@/components/ui/UpgradePrompt'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

interface FeatureUpgradeGateProps {
  feature: 'team' | UpgradeFeature
  children: React.ReactNode
  locked: boolean
}

function mapFeature(feature: FeatureUpgradeGateProps['feature']): UpgradeFeature {
  return feature === 'team' ? 'team_full' : feature
}

/** Tam sayfa overlay — Plus/Pro gerektiren modüller için (ör. Crown alt sayfalar). */
export function FeatureUpgradeGate({ feature, children, locked }: FeatureUpgradeGateProps) {
  const [dismissed, setDismissed] = useState(false)

  useBodyScrollLock(locked && !dismissed)

  if (!locked) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <UpgradePrompt
        feature={mapFeature(feature)}
        open={!dismissed}
        onClose={() => setDismissed(true)}
      />
    </>
  )
}
