'use client'

import React, { createContext, useContext, useState } from 'react'
import { tr } from '@/lib/translations/tr'
import { en } from '@/lib/translations/en'
import { platformSection } from '@/lib/translations/sections/platform'
import { shellSection } from '@/lib/translations/sections/shell'
import { trainingSection } from '@/lib/translations/sections/training'
import { landingSection } from '@/lib/translations/sections/landing'
import { pipelineSection } from '@/lib/translations/sections/pipeline'
import { statsSection } from '@/lib/translations/sections/stats'
import { paymentSection } from '@/lib/translations/sections/payment'
import { coachSection } from '@/lib/translations/sections/coach'
import { pagesSection } from '@/lib/translations/sections/pages'
import { errorsSection } from '@/lib/translations/sections/errors'
import { pulseSection } from '@/lib/translations/sections/pulse'
import { videoTrainingSection } from '@/lib/translations/sections/videoTraining'
import { crownSection } from '@/lib/translations/sections/crown'
import { persistUserLangAction } from '@/app/actions/userLang'

type LangType = 'tr' | 'en'

type BaseDict = typeof tr
type MergedDict = BaseDict &
  typeof platformSection['tr'] &
  typeof shellSection['tr'] &
  typeof trainingSection['tr'] &
  typeof landingSection['tr'] &
  typeof pipelineSection['tr'] &
  typeof statsSection['tr'] &
  typeof paymentSection['tr'] &
  typeof coachSection['tr'] &
  typeof pagesSection['tr'] &
  typeof errorsSection['tr'] &
  typeof pulseSection['tr'] &
  typeof videoTrainingSection['tr'] &
  typeof crownSection['tr']

type DottedKeys<T> = {
  [K in keyof T]: K extends string
    ? T[K] extends Record<string, unknown>
      ? {
          [SubK in keyof T[K]]: SubK extends string
            ? `${K}.${SubK}`
            : never
        }[keyof T[K]]
      : never
    : never
}[keyof T]

export type TranslationKey = DottedKeys<MergedDict>

interface LanguageContextType {
  lang: LangType
  setLang: (lang: LangType) => void
  t: (keyPath: TranslationKey | (string & {}), variables?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const sections = [
  platformSection,
  shellSection,
  trainingSection,
  landingSection,
  pipelineSection,
  statsSection,
  paymentSection,
  coachSection,
  pagesSection,
  errorsSection,
  pulseSection,
  videoTrainingSection,
  crownSection,
]

type TranslationNamespace = Record<string, string>
type TranslationRoot = Record<string, TranslationNamespace>
type SectionBundle = Record<LangType, TranslationRoot>

function mergeSections(base: TranslationRoot, langKey: LangType): TranslationRoot {
  const merged: TranslationRoot = { ...base }
  for (const section of sections as SectionBundle[]) {
    const ns = section[langKey] ?? {}
    for (const [namespace, entries] of Object.entries(ns)) {
      merged[namespace] = { ...(merged[namespace] ?? {}), ...entries }
    }
  }
  return merged
}

const dictionaries = {
  tr: mergeSections(tr, 'tr'),
  en: mergeSections(en, 'en'),
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangType>('tr')

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const saved = localStorage.getItem('nmm_lang') as LangType | null
    if (saved === 'tr' || saved === 'en') {
      setLangState(saved)
    } else {
      const detected = navigator.language.slice(0, 2) === 'en' ? 'en' : 'tr'
      if (detected !== 'tr') {
        setLangState(detected)
      }
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  function setLang(newLang: LangType) {
    setLangState(newLang)
    localStorage.setItem('nmm_lang', newLang)
    document.documentElement.lang = newLang
    // Sunucu tarafına kalıcılaştır (cron/e-posta dili için). Oturum yoksa no-op.
    persistUserLangAction(newLang).catch(() => {})
  }

  function t(keyPath: TranslationKey | (string & {}), variables?: Record<string, string | number>): string {
    const keys = keyPath.split('.')
    let current: unknown = dictionaries[lang]

    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return keyPath
      }
      current = (current as Record<string, unknown>)[key]
    }

    if (typeof current !== 'string') {
      return keyPath
    }

    let text = current
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v))
      })
    }

    return text
  }

  // Prevent SSR mismatch by rendering children after mount (or just render children directly, but it's safe)
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}
