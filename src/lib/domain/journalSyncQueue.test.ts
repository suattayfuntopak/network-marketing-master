import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dequeueJournalSync,
  enqueueJournalSync,
  readJournalSyncQueue,
} from './journalSyncQueue'

const QUEUE_KEY = 'nmm_journal_sync_queue'

describe('journalSyncQueue', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem(key: string) {
        return store[key] ?? null
      },
      setItem(key: string, value: string) {
        store[key] = value
      },
      removeItem(key: string) {
        delete store[key]
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('enqueue and dequeue by user/date', () => {
    enqueueJournalSync({
      userId: 'u1',
      journalDate: '2026-06-06',
      text: 'not',
      lang: 'tr',
    })
    expect(readJournalSyncQueue()).toHaveLength(1)

    dequeueJournalSync('u1', '2026-06-06')
    expect(readJournalSyncQueue()).toHaveLength(0)
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull()
  })

  it('replaces existing queue item for same user/date', () => {
    enqueueJournalSync({ userId: 'u1', journalDate: '2026-06-06', text: 'a', lang: 'tr' })
    enqueueJournalSync({ userId: 'u1', journalDate: '2026-06-06', text: 'b', lang: 'tr' })
    expect(readJournalSyncQueue()[0]?.text).toBe('b')
  })
})
