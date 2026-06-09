/** Sekmeli sayfa başlıkları — "Saha Özetim / Günlük" */
export function formatTabbedPageTitle(...segments: string[]): string {
  return segments.filter(Boolean).join(' / ')
}
