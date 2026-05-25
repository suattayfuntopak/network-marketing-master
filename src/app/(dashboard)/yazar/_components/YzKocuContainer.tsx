'use client'

import { useState } from 'react'
import { MessageSquare, Target } from 'lucide-react'
import { YazarForm } from './YazarForm'
import { ProvaForm } from './ProvaForm'
import { useTranslation } from '@/providers/LanguageProvider'

interface YzKocuContainerProps {
  initialName: string
  initialNote: string
  initialWarmth: string
}

export function YzKocuContainer({ initialName, initialNote, initialWarmth }: YzKocuContainerProps) {
  const [activeTab, setActiveTab] = useState<'yazar' | 'prova'>('yazar')
  const { lang } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Premium Segmented Tab Selector */}
      <div className="flex rounded-2xl bg-[var(--bg-card)] p-1.5 border border-[var(--border)] shadow-sm max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('yazar')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'yazar'
              ? 'bg-[#0F6E56] text-white shadow-md'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{lang === 'en' ? 'Ask Coach (Writer)' : 'Koçluk Al (Yazar)'}</span>
        </button>
        <button
          onClick={() => setActiveTab('prova')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'prova'
              ? 'bg-[#D97706] text-white shadow-md'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Target className="h-4 w-4" />
          <span>{lang === 'en' ? 'Roleplay (Rehearsal)' : 'Prova Yap (Simüle)'}</span>
        </button>
      </div>

      {/* Render Active Component */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'yazar' ? (
          <YazarForm initialName={initialName} initialNote={initialNote} initialWarmth={initialWarmth} />
        ) : (
          <ProvaForm />
        )}
      </div>
    </div>
  )
}
