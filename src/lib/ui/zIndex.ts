/**
 * Central z-index scale for overlays. Import `Z.*` — avoid raw `z-[NN]` in new code.
 * @see AGENTS.md — UI conventions
 */
export const Z = {
  /** Kart-içi yerel kontrol grubu (kartın kendi içeriğinin üstünde; overlay değil) */
  cardControls: 'z-10',
  /** Kart-içi ikinci katman (cardControls üstünde, lokal overlay değil) */
  cardControlsUpper: 'z-20',
  sidebar: 'z-[35]',
  header: 'z-40',
  bottomNav: 'z-50',
  headerSearch: 'z-[51]',
  dropdown: 'z-[55]',
  cardOverlay: 'z-[60]',
  cardPopover: 'z-[65]',
  sheetBackdrop: 'z-[60]',
  sheet: 'z-[70]',
  confirmBackdrop: 'z-[80]',
  confirm: 'z-[90]',
  coachModal: 'z-[99]',
  fullscreen: 'z-[9999]',
  /** Dikey-kullanım kilidi — her şeyin (fullscreen dahil) üstünde tam-ekran yönlendirme */
  orientationLock: 'z-[100000]',
} as const
