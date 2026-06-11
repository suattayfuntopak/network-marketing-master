import { describe, it, expect } from 'vitest'
import { tr } from './tr'
import { en } from './en'
import { platformSection } from './sections/platform'
import { shellSection } from './sections/shell'
import { trainingSection } from './sections/training'
import { landingSection } from './sections/landing'
import { pipelineSection } from './sections/pipeline'
import { statsSection } from './sections/stats'
import { paymentSection } from './sections/payment'
import { coachSection } from './sections/coach'
import { pagesSection } from './sections/pages'
import { errorsSection } from './sections/errors'
import { pulseSection } from './sections/pulse'
import { videoTrainingSection } from './sections/videoTraining'
import { crownSection } from './sections/crown'

function getDeepKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return []
  let keys: string[] = []
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key]
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys = keys.concat(getDeepKeys(val, newPrefix))
    } else {
      keys.push(newPrefix)
    }
  }
  return keys
}

describe('i18n translation key consistency', () => {
  it('core tr and en dictionaries have matching keys', () => {
    const trKeys = getDeepKeys(tr).sort()
    const enKeys = getDeepKeys(en).sort()
    expect(trKeys).toEqual(enKeys)
  })

  const sections = [
    { name: 'platform', bundle: platformSection },
    { name: 'shell', bundle: shellSection },
    { name: 'training', bundle: trainingSection },
    { name: 'landing', bundle: landingSection },
    { name: 'pipeline', bundle: pipelineSection },
    { name: 'stats', bundle: statsSection },
    { name: 'payment', bundle: paymentSection },
    { name: 'coach', bundle: coachSection },
    { name: 'pages', bundle: pagesSection },
    { name: 'errors', bundle: errorsSection },
    { name: 'pulse', bundle: pulseSection },
    { name: 'videoTraining', bundle: videoTrainingSection },
    { name: 'crown', bundle: crownSection },
  ]

  sections.forEach(({ name, bundle }) => {
    it(`section '${name}' tr and en bundles have matching keys`, () => {
      const trKeys = getDeepKeys(bundle.tr).sort()
      const enKeys = getDeepKeys(bundle.en).sort()
      expect(trKeys).toEqual(enKeys)
    })
  })
})
