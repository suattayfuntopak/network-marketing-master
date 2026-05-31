/**
 * Ref-counted body scroll lock for overlays (modals, sheets, popups).
 * Restores scroll position when the last lock is released.
 */

let lockCount = 0
let savedScrollY = 0

function applyLock() {
  savedScrollY = window.scrollY
  const { body, documentElement } = document
  body.style.overflow = 'hidden'
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  documentElement.style.overflow = 'hidden'
}

function releaseLock() {
  const { body, documentElement } = document
  body.style.overflow = ''
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  documentElement.style.overflow = ''
  window.scrollTo(0, savedScrollY)
}

export function lockBodyScroll() {
  if (lockCount === 0) applyLock()
  lockCount++
}

export function unlockBodyScroll() {
  if (lockCount <= 0) return
  lockCount--
  if (lockCount === 0) releaseLock()
}
