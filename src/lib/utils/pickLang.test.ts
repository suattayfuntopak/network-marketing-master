import { describe, it, expect } from 'vitest'
import { pickBilingual } from './pickLang'

describe('pickBilingual', () => {
  it('returns Turkish by default', () => {
    expect(pickBilingual({ tr: 'Merhaba', en: 'Hello' }, 'tr')).toBe('Merhaba')
  })

  it('falls back to Turkish when English missing', () => {
    expect(pickBilingual({ tr: 'Merhaba' }, 'en')).toBe('Merhaba')
  })
})
