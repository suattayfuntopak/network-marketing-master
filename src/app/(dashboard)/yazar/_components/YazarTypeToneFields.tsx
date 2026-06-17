'use client'

import { ChevronDown } from 'lucide-react'
import { getMessageTypeLabel, getToneLabel, MESSAGE_TYPES, TONES } from './yazarFormLabels'

interface Props {
  messageType: string
  tone: string
  lang: 'tr' | 'en'
  messageTypeLabel: string
  toneLabel: string
  onMessageTypeChange: (value: string) => void
  onToneChange: (value: string) => void
}

export function YazarTypeToneFields({
  messageType,
  tone,
  lang,
  messageTypeLabel,
  toneLabel,
  onMessageTypeChange,
  onToneChange,
}: Props) {
  const selectClass =
    'w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-4 pr-10 py-3 text-sm text-[var(--text-1)] outline-none transition focus:border-[#0F6E56] focus:ring-2 focus:ring-[#E1F5EE]'

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="messageTypeSelect">
          {messageTypeLabel}
        </label>
        <div className="relative">
          <select
            id="messageTypeSelect"
            value={messageType}
            onChange={e => onMessageTypeChange(e.target.value)}
            className={selectClass}
          >
            {MESSAGE_TYPES.map(mt => (
              <option key={mt.value} value={mt.value} className="bg-[var(--bg-card)] text-[var(--text-1)]">
                {getMessageTypeLabel(mt.value, lang)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-1)]" htmlFor="toneSelect">
          {toneLabel}
        </label>
        <div className="relative">
          <select
            id="toneSelect"
            value={tone}
            onChange={e => onToneChange(e.target.value)}
            className={selectClass}
          >
            {TONES.map(tn => (
              <option key={tn.value} value={tn.value} className="bg-[var(--bg-card)] text-[var(--text-1)]">
                {getToneLabel(tn.value, lang)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
