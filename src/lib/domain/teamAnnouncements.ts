/** Ekip duyuruları — işaretleme + sıralama (SAF, test edilebilir). */

export interface AnnouncementRecord {
  id: string
  author_id: string
  author_name: string | null
  title: string
  body: string
  created_at: string
}

export interface AnnotatedAnnouncement extends AnnouncementRecord {
  /** Bu duyuruyu oturum sahibi mi yazdı (silme/etiket için). */
  isMine: boolean
}

/** Kendi + üst hat duyurularını birleştirir; `isMine` işaretler, yeniden eskiye sıralar. */
export function annotateAnnouncements(
  rows: AnnouncementRecord[],
  myUserId: string,
): AnnotatedAnnouncement[] {
  return rows
    .map(r => ({ ...r, isMine: r.author_id === myUserId }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}
