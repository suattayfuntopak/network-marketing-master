import { describe, it, expect } from 'vitest'
import {
  parseRoleplayDifficulty,
  roleplayDifficultyInstruction,
} from '@/lib/domain/roleplayDifficulty'

describe('parseRoleplayDifficulty', () => {
  it('geçerli değerleri korur', () => {
    expect(parseRoleplayDifficulty('kolay')).toBe('kolay')
    expect(parseRoleplayDifficulty('zor')).toBe('zor')
    expect(parseRoleplayDifficulty('orta')).toBe('orta')
  })
  it('geçersiz/boş → orta (varsayılan)', () => {
    expect(parseRoleplayDifficulty(null)).toBe('orta')
    expect(parseRoleplayDifficulty(undefined)).toBe('orta')
    expect(parseRoleplayDifficulty('xyz')).toBe('orta')
  })
})

describe('roleplayDifficultyInstruction', () => {
  it('her seviye + dil için boş olmayan, seviyeye özgü talimat', () => {
    expect(roleplayDifficultyInstruction('kolay', 'tr')).toContain('KOLAY')
    expect(roleplayDifficultyInstruction('zor', 'tr')).toContain('ZOR')
    expect(roleplayDifficultyInstruction('zor', 'en')).toContain('HARD')
    expect(roleplayDifficultyInstruction('orta', 'en')).toContain('MEDIUM')
  })
  it('zor seviye daha katı puanlama içerir', () => {
    expect(roleplayDifficultyInstruction('zor', 'tr')).toMatch(/katı/)
    expect(roleplayDifficultyInstruction('zor', 'en')).toMatch(/strict/)
  })
})
