'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, Sparkles } from 'lucide-react'
import { Z } from '@/lib/ui/zIndex'
import { useTranslation } from '@/providers/LanguageProvider'

interface SympatheticPopupProps {
  open: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function SympatheticPopup({
  open,
  onClose,
  title,
  message,
}: SympatheticPopupProps) {
  const { t, lang } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (open) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') onClose()
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  const defaultTitle = lang === 'en'
    ? 'Proposal Received! ✨'
    : 'Talebiniz Alındı! ✨'

  const defaultMessage = lang === 'en'
    ? 'Thank you for your valuable contribution! Your proposal has been received. Our team will review it shortly and notify you via email.'
    : 'Uygulamamıza katkı sağladığınız için teşekkür ederiz! Ekleme talebiniz alınmıştır. En kısa sürede incelenip tarafınıza e-posta ile bilgi verilecektir.'

  const buttonLabel = lang === 'en' ? 'Awesome' : 'Harika, Tamam'

  return createPortal(
    <div className={`fixed inset-0 ${Z.confirm} flex items-center justify-center p-4`}>
      {/* Soft glassmorphism backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      {/* Sleek popup card */}
      <div className="relative w-full max-w-sm rounded-3xl border border-[#EEEDFE]/40 dark:border-white/[0.04] bg-white dark:bg-[#0d0e14] p-7 shadow-3xl text-center overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Modern ambient glow in background */}
        <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-[#534AB7]/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

        <div className="mb-5 flex justify-center relative">
          {/* Pulsing decoration circle */}
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/10" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg text-white">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
        </div>

        <h2 className="mb-3 text-lg font-black text-slate-900 dark:text-white">
          {title ?? defaultTitle}
        </h2>
        
        <p className="mb-6 text-xs md:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
          {message ?? defaultMessage}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-[#534AB7] to-[#6359E9] py-3 text-xs md:text-sm font-bold text-white shadow-lg shadow-[#534AB7]/25 transition hover:opacity-95 active:scale-[0.98] cursor-pointer"
        >
          {buttonLabel}
        </button>
      </div>
    </div>,
    document.body
  )
}
