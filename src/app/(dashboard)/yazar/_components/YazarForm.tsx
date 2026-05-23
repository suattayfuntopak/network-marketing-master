'use client'

import { useActionState, useRef } from 'react'
import { Copy, Loader2, MessageCircle } from 'lucide-react'
import { generateMessageAction } from '../actions'

const STAGES = [
  { value: 'yeni',     label: 'Yeni Aday' },
  { value: 'iletisim', label: 'İletişim Kuruldu' },
  { value: 'takip',    label: 'Takip Bekliyor' },
  { value: 'sunum',    label: 'Sunum Yapıldı' },
  { value: 'kararsiz', label: 'Kararsız' },
]

const TONES = [
  { value: 'samimi',   label: 'Samimi' },
  { value: 'resmi',    label: 'Resmi' },
  { value: 'neşeli',   label: 'Neşeli' },
  { value: 'meraklı',  label: 'Meraklı' },
]

export function YazarForm() {
  const [state, action, isPending] = useActionState(generateMessageAction, {})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleCopy() {
    if (state.message) navigator.clipboard.writeText(state.message)
  }

  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-900'
  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">Aday Adı</label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ayşe Hanım"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="stage">Aşama</label>
            <select id="stage" name="stage" required className={inputClass}>
              <option value="">Seç...</option>
              {STAGES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="context">Ek Bilgi (isteğe bağlı)</label>
          <textarea
            ref={textareaRef}
            id="context"
            name="context"
            rows={2}
            placeholder="Geçen hafta konuştuk, ürünü merak ediyordu..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Ton</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <label key={t.value} className="cursor-pointer">
                <input type="radio" name="tone" value={t.value} defaultChecked={t.value === 'samimi'} className="peer sr-only" />
                <span className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-500 transition peer-checked:border-[#0F6E56] peer-checked:bg-[#E1F5EE] peer-checked:text-[#0F6E56]">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {state.error && (
          <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F6E56] py-3 text-sm font-semibold text-white transition hover:bg-[#0a5a44] disabled:opacity-60"
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Yazıyor...</>
            : <><MessageCircle className="h-4 w-4" /> Mesaj Oluştur</>
          }
        </button>
      </form>

      {state.message && (
        <div className="rounded-2xl border border-[#D2EFE4] bg-[#F4FBF8] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0F6E56]">Oluşturulan Mesaj</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
              <Copy className="h-3.5 w-3.5" />
              Kopyala
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">{state.message}</p>
        </div>
      )}
    </div>
  )
}
