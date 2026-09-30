'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from '@/lib/translations'

type LanguageContextType = {
  lang: Language
  setLang: (lang: Language) => void
  t: any // Translation object
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  // Load saved language on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_language') as Language
    if (savedLang === 'en' || savedLang === 'ar') {
      setLang(savedLang)
    }
  }, [])

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('preferred_language', lang)
  }, [lang])

  // Import translations dynamically based on lang
  const [t, setT] = useState<any>({})
  useEffect(() => {
    import('@/lib/translations').then((mod) => {
      setT(mod.translations[lang])
    })
  }, [lang])

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