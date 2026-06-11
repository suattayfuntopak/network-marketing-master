/**
 * Partner avatar override seed — DB `nmm_partner_avatar_overrides` (092) ile senkron tutulmalı.
 */

export const SELDA_KIRATLI_USER_ID = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
export const EZGI_SAGAR_USER_ID = 'a71184ee-5b32-455a-88aa-c6aba538cdc0'
export const SELDA_CANDIDATE_ID = '00fa3484-97b1-4683-b987-638df261b6e2'
export const EZGI_CANDIDATE_ID = '001a2b65-8820-4b2c-9c4a-67d1344b17c2'

const STORAGE_BASE =
  'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/'
const FILE_ON_SELDA_CANDIDATE = 'candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'
const FILE_ON_EZGI_CANDIDATE = 'candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg'

export const SELDA_DISPLAY_AVATAR_URL = `${STORAGE_BASE}${FILE_ON_SELDA_CANDIDATE}`
export const EZGI_DISPLAY_AVATAR_URL = `${STORAGE_BASE}${FILE_ON_EZGI_CANDIDATE}`

/** entity_id (user veya candidate) → sabit görüntüleme URL */
export const PARTNER_AVATAR_OVERRIDE_URLS: Readonly<Record<string, string>> = {
  [SELDA_KIRATLI_USER_ID]: SELDA_DISPLAY_AVATAR_URL,
  [SELDA_CANDIDATE_ID]: SELDA_DISPLAY_AVATAR_URL,
  [EZGI_SAGAR_USER_ID]: EZGI_DISPLAY_AVATAR_URL,
  [EZGI_CANDIDATE_ID]: EZGI_DISPLAY_AVATAR_URL,
}
