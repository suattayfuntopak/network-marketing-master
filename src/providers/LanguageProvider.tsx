'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { tr } from '@/lib/translations/tr'
import { en } from '@/lib/translations/en'

type LangType = 'tr' | 'en'

interface LanguageContextType {
  lang: LangType
  setLang: (lang: LangType) => void
  t: (keyPath: string, variables?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const dictionaries = { tr, en }

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
    const dict = dictionaries[lang] as any
    const keys = keyPath.split('.')
    let current = dict

    for (const key of keys) {
      if (current === undefined || current === null) {
        return keyPath
      }
      current = current[key]
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
