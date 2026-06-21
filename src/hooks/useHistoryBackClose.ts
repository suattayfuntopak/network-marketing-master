'use client'

import { useEffect, useRef } from 'react'

/**
 * Bir overlay / tam-ekran okuma görünümü açıkken tarayıcı "geri" tuşunu (ve
 * mobil kenar-kaydırma geri jestini) yakalar; sayfadan çıkmak yerine overlay'i
 * kapatır. Böylece "yazıyı oku → geri bas → pat diye panoya atla" sorunu çözülür.
 *
 * Mekanizma: açılışta URL'i değiştirmeden bir history girdisi push'lanır.
 *  - Kullanıcı geri basarsa → popstate → onClose (girdiyi tarayıcı zaten düşürdü).
 *  - Bileşen kendi kapatma butonu/ESC ile kapanırsa → cleanup, push'lanan fazla
 *    girdiyi `history.back()` ile temizler (yalnızca hâlâ bizim girdimizdeysek).
 *
 * Tek seferde yalnızca bir girdi push'lanır; iç içe overlay'lerde her biri kendi
 * girdisini yönetir.
 */
export function useHistoryBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return

    const marker = `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.history.pushState({ __overlayMarker: marker }, '')

    const handlePop = () => onCloseRef.current()
    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('popstate', handlePop)
      // Manuel kapanış (X / ESC): hâlâ bizim push'ladığımız girdideysek onu temizle.
      // popstate ile kapandıysak tarayıcı girdiyi zaten düşürmüştür → tekrar back() YOK.
      const state = window.history.state as { __overlayMarker?: string } | null
      if (state?.__overlayMarker === marker) {
        window.history.back()
      }
    }
  }, [open])
}
