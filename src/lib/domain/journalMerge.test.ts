import { describe, expect, it } from 'vitest'
import { mergeJournalConflictTexts } from './journalMerge'

describe('mergeJournalConflictTexts', () => {
  it('joins distinct local and remote with separator', () => {
    expect(mergeJournalConflictTexts('Local note', 'Remote note')).toBe(
      'Local note\n\n---\n\nRemote note',
    )
  })

  it('returns single side when other is empty', () => {
    expect(mergeJournalConflictTexts('Only local', '')).toBe('Only local')
    expect(mergeJournalConflictTexts('', 'Only remote')).toBe('Only remote')
  })

  it('dedupes identical text', () => {
    expect(mergeJournalConflictTexts('Same', 'Same')).toBe('Same')
  })
})
