/**
 * Web Audio API ile iki notalı (C5→E5) kısa bildirim sesi üretir.
 * Saf yardımcı — bir bileşene bağlı değil; hook'lar ve modallar buradan import eder
 * (önceki useNotifications ↔ NotificationsModal çevrimsel bağımlılığını kırar).
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return
  try {
    type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext }
    const AudioCtx = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Note 1 (C5)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)

    // Note 2 (E5) delayed
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1)
    gain2.gain.setValueAtTime(0, ctx.currentTime)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1)
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.4)
  } catch (err) {
    console.error('Audio synthesis failed:', err)
  }
}
