import { cookies } from 'next/headers'
import { translations, type Language } from '@/lib/translations'

export async function getServerTranslation() {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('preferred_language')?.value

  const lang: Language = langCookie === 'ar' ? 'ar' : 'en'

  const t = (key: string): string => {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  return { lang, t }
}
