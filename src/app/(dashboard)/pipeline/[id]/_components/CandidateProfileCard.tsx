'use client'

import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { useTranslation } from '@/providers/LanguageProvider'
import type { NmmCandidate } from '@/types/database.types'
import type { ResolvedCandidateFields } from '@/lib/domain/candidateFields'

interface Props {
  c: NmmCandidate
  parsed: ResolvedCandidateFields
  translatedNote: string | null
  isTranslating: boolean
}

export function CandidateProfileCard({ c, parsed, translatedNote, isTranslating }: Props) {
  const { lang, t } = useTranslation()

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-4">
        <PersonAvatar
          name={c.full_name}
          imageUrl={parsed.avatarUrl}
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-[var(--text-1)]">{c.full_name}</h1>
            {parsed.warmth === 'sicak' && (
              <span className="inline-flex items-center rounded-full bg-warmth-hot-bg px-2 py-0.5 text-[10px] font-bold text-warmth-hot-text border border-warmth-hot-border animate-pulse">🔥 {t('pipelinePage.warmthHot')}</span>
            )}
            {parsed.warmth === 'ilik' && (
              <span className="inline-flex items-center rounded-full bg-warmth-warm-bg px-2 py-0.5 text-[10px] font-bold text-warmth-warm-text border border-warmth-warm-border">☀️ {t('pipelinePage.warmthWarm')}</span>
            )}
            {parsed.warmth === 'soguk' && (
              <span className="inline-flex items-center rounded-full bg-warmth-cold-bg px-2 py-0.5 text-[10px] font-bold text-warmth-cold-text border border-warmth-cold-border">❄️ {t('pipelinePage.warmthCold')}</span>
            )}
          </div>
          {c.phone && (
            <p className="text-sm text-[var(--text-2)]">{c.phone}</p>
          )}
        </div>
      </div>

      {c.note && (
        <p className={`mt-4 rounded-xl bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text-2)] leading-relaxed transition-opacity ${isTranslating ? 'opacity-50' : 'opacity-100'}`}>
          {lang === 'en' ? (translatedNote || parsed.noteEn || parsed.noteTr) : parsed.noteTr}
          {isTranslating && (
            <span className="ml-2 text-[10px] text-[var(--text-3)] animate-pulse">
              {t('pipeline.noteTranslating')}
            </span>
          )}
        </p>
      )}
    </div>
  )
}
