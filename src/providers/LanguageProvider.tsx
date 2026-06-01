'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
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

type LangType = 'tr' | 'en'

interface LanguageContextType {
  lang: LangType
  setLang: (lang: LangType) => void
  t: (keyPath: string, variables?: Record<string, string | number>) => string
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('nmm_lang') as LangType | null
    if (saved === 'tr' || saved === 'en') {
      setLangState(saved)
    } else {
      // Check browser language
      const navLang = navigator.language.slice(0, 2)
      if (navLang === 'en') {
        setLangState('en')
      }
    }
    setMounted(true)
  }, [])

  function setLang(newLang: LangType) {
    setLangState(newLang)
    localStorage.setItem('nmm_lang', newLang)
    document.documentElement.lang = newLang
  }

  function t(keyPath: string, variables?: Record<string, string | number>): string {
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
