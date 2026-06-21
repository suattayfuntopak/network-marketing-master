'use client'

import { useEffect, useRef } from 'react'

/**
 * Bir overlay / modal / sheet / tam-ekran görünüm açıkken tarayıcı "geri" tuşunu
 * (ve mobil kenar-kaydırma geri jestini) yakalar; sayfadan çıkmak yerine overlay'i
 * kapatır. Böylece "modalı aç → geri bas → pat diye başka sayfaya atla" sorunu çözülür.
 *
 * Mekanizma: açılışta URL'i DEĞİŞTİRMEDEN bir history girdisi push'lanır.
 *  - Kullanıcı geri basarsa → popstate → en üstteki overlay'in onClose'u.
 *  - Bileşen kendi butonu/ESC ile kapanırsa → cleanup, push'lanan fazla girdiyi
 *    `history.back()` ile temizler (yalnızca hâlâ bizim girdimizdeysek).
 *
 * İÇ İÇE (nested) GÜVENLİ: tüm açık overlay'ler tek bir LIFO yığında tutulur ve
 * tek bir global popstate dinleyicisi YALNIZCA yığının tepesindeki overlay'i kapatır.
 * Programatik `history.back()` (manuel kapanış temizliği) bir suppress bayrağıyla
 * ayırt edilir; alttaki overlay yanlışlıkla kapanmaz.
 */

type OverlayEntry = { marker: string; close: () => void }

const overlayStack: OverlayEntry[] = []
let popstateBound = false
/** Programatik history.back() çağrılarının sayısı — bunlar kullanıcı "geri"si sayılmaz. */
let suppressPops = 0

function handleGlobalPop() {
  if (suppressPops > 0) {
    suppressPops -= 1
    return
  }
  const top = overlayStack[overlayStack.length - 1]
  if (top) top.close()
}

function ensurePopstateBound() {
  if (popstateBound || typeof window === 'undefined') return
  window.addEventListener('popstate', handleGlobalPop)
  popstateBound = true
}

export function useHistoryBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return

    ensurePopstateBound()
    const marker = `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const entry: OverlayEntry = { marker, close: () => onCloseRef.current() }
    overlayStack.push(entry)
    window.history.pushState({ __overlayMarker: marker }, '')

    return () => {
      const idx = overlayStack.indexOf(entry)
      if (idx !== -1) overlayStack.splice(idx, 1)
      // Manuel kapanış (X / ESC): hâlâ bizim push'ladığımız girdideysek onu temizle.
      // popstate ile kapandıysak tarayıcı girdiyi zaten düşürmüştür → tekrar back() YOK.
      const state = window.history.state as { __overlayMarker?: string } | null
      if (state?.__overlayMarker === marker) {
        // Bu programatik back; global dinleyici bunu kullanıcı geri'si sanmasın.
        suppressPops += 1
        window.history.back()
      }
    }
  }, [open])
}
