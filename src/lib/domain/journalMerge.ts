/** Yerel ve bulut günlük metinlerini birleştirir (çakışma çözümü). */
export function mergeJournalConflictTexts(local: string, remote: string): string {
  const a = local.trim()
  const b = remote.trim()
  if (!a) return b
  if (!b) return a
  if (a === b) return a
  return `${a}\n\n---\n\n${b}`
}
