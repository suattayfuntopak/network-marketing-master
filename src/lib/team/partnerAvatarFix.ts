/** Focus Team — storage dosya içeriği aday id ile ters eşleşmiş Selda/Ezgi çifti. */
export const SELDA_KIRATLI_USER_ID = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
export const EZGI_SAGAR_USER_ID = 'a71184ee-5b32-455a-88aa-c6aba538cdc0'

type AvatarRow = { user_id: string; avatar_url?: string | null }

/** Görüntüleme katmanında Selda ↔ Ezgi avatar URL'lerini karşılıklı değiştirir. */
export function swapSeldaEzgiDisplayAvatars<T extends AvatarRow>(rows: T[]): void {
  const selda = rows.find(r => r.user_id === SELDA_KIRATLI_USER_ID)
  const ezgi = rows.find(r => r.user_id === EZGI_SAGAR_USER_ID)
  if (!selda || !ezgi) return
  const tmp = selda.avatar_url ?? null
  selda.avatar_url = ezgi.avatar_url ?? null
  ezgi.avatar_url = tmp
}
