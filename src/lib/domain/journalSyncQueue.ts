/** Başarısız günlük Supabase kayıtları — online olunca retry. */

export type JournalSyncQueueItem = {
  userId: string
  journalDate: string
  text: string
  lang: 'tr' | 'en'
  failedAt: number
}

const QUEUE_KEY = 'nmm_journal_sync_queue'

function readRaw(): JournalSyncQueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as JournalSyncQueueItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(items: JournalSyncQueueItem[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(QUEUE_KEY)
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function enqueueJournalSync(item: Omit<JournalSyncQueueItem, 'failedAt'>): void {
  const queue = readRaw().filter(
    q => !(q.userId === item.userId && q.journalDate === item.journalDate),
  )
  queue.push({ ...item, failedAt: Date.now() })
  writeRaw(queue)
}

export function dequeueJournalSync(userId: string, journalDate: string): void {
  writeRaw(readRaw().filter(q => !(q.userId === userId && q.journalDate === journalDate)))
}

export function readJournalSyncQueue(): JournalSyncQueueItem[] {
  return readRaw()
}
