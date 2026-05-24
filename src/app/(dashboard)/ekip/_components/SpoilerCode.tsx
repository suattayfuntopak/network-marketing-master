'use client'

import { useState, useEffect, useRef } from 'react'

export function SpoilerCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const resize = () => {
      if (!canvas) return
      canvas.width = canvas.parentElement?.clientWidth || 200
      canvas.height = canvas.parentElement?.clientHeight || 40
    }
    resize()
    window.addEventListener('resize', resize)

    const numParticles = 60
    const particles: { x: number; y: number; size: number; speed: number; alpha: number }[] = []

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 200),
        y: Math.random() * 40,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.03 + 0.01,
        alpha: Math.random(),
      })
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 5,
        canvas.width / 2, canvas.height / 2, canvas.width / 2,
      )
      gradient.addColorStop(0, 'rgba(83, 74, 183, 0.15)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.alpha += p.speed
        if (p.alpha > 1 || p.alpha < 0) p.speed = -p.speed
        ctx.fillStyle = `rgba(165, 243, 252, ${Math.max(0, Math.min(1, p.alpha))})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1)
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [revealed])

  return (
    <div
      onClick={() => setRevealed(true)}
      className="relative flex-1 min-w-0 h-10 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] font-mono text-base font-bold tracking-widest text-[var(--text-1)] cursor-pointer flex items-center justify-center transition-all select-none"
    >
      <span className={`transition-all duration-500 ease-out transform ${revealed ? 'scale-100 opacity-100 blur-0' : 'scale-90 opacity-0 blur-md'}`}>
        {code}
      </span>

      {!revealed && (
        <div className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-500 ease-out">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <span className="relative z-20 text-[10px] uppercase tracking-widest text-cyan-200/60 font-sans font-bold animate-pulse pointer-events-none">
            Açmak için tıkla ✨
          </span>
        </div>
      )}
    </div>
  )
}
