'use client'

import { useState } from 'react'
import { MessageSquare, HelpCircle } from 'lucide-react'
import { YazarForm } from './YazarForm'
import { KoclukForm } from './KoclukForm'
import { useTranslation } from '@/providers/LanguageProvider'

interface YzKocuContainerProps {
  initialName: string
  initialNote: string
  initialWarmth: string
}

export function YzKocuContainer({ initialName, initialNote, initialWarmth }: YzKocuContainerProps) {
  const [activeTab, setActiveTab] = useState<'yazar' | 'kocluk'>('yazar')
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Premium Segmented Tab Selector */}
      <div className="flex rounded-2xl bg-[var(--bg-card)] p-1.5 border border-[var(--border)] shadow-sm max-w-md mx-auto w-full">
        <button
          onClick={() => setActiveTab('yazar')}
          className={`flex flex-1 items-center justify-center gap-1 sm:gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'yazar'
              ? 'bg-[#0F6E56] text-white shadow-md'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span>{t('coachUi.tabMessage')}</span>
        </button>
        <button
          onClick={() => setActiveTab('kocluk')}
          className={`flex flex-1 items-center justify-center gap-1 sm:gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            activeTab === 'kocluk'
              ? 'bg-[#3730A3] text-white shadow-md'
              : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{t('coachUi.tabCoaching')}</span>
        </button>
      </div>

      {/* Render Active Component */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'yazar' && (
          <YazarForm initialName={initialName} initialNote={initialNote} initialWarmth={initialWarmth} />
        )}
        {activeTab === 'kocluk' && (
          <KoclukForm />
        )}
      </div>
    </div>
  )
}
