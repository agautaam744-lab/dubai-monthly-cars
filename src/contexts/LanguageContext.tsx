'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from '@/lib/translations'

type LanguageContextType = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  // Load saved language on mount (prefer cookie, fall back to localStorage)
  useEffect(() => {
    const cookieMatch = document.cookie.match(/preferred_language=(en|ar)/)
    const savedLang = (cookieMatch?.[1] ||
      localStorage.getItem('preferred_language')) as Language | null

    if (savedLang === 'en' || savedLang === 'ar') {
      setLangState(savedLang)
    }
  }, [])

  // Update HTML dir/lang attributes, localStorage, and cookie when language changes
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('preferred_language', lang)
    document.cookie = `preferred_language=${lang}; path=/; max-age=31536000; SameSite=Lax`
  }, [lang])

  const setLang = (nextLang: Language) => {
    setLangState(nextLang)
  }

  // t function — always callable, returns key if not found
  const t = (key: string): string => {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
