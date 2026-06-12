import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { DEFAULT_LANGUAGE, i18n, type AllLanguage } from './i18n'

export const TranslationContext = createContext<{
  lang: AllLanguage
  setLang: Dispatch<SetStateAction<AllLanguage>>
  t: (key: string) => string
}>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key: string) => key,
})

export const TranslationProvider = ({
  lang: forceLang,
  children,
}: {
  lang?: AllLanguage
  children: React.ReactNode
}) => {
  const [lang, setLang] = useState<AllLanguage>(forceLang ?? DEFAULT_LANGUAGE)

  useEffect(() => {
    if (forceLang) setLang(forceLang)
  }, [forceLang])

  const t = useCallback(
    (key: string) => {
      if (lang === DEFAULT_LANGUAGE) return key
      const entry = i18n[key]
      return entry?.[lang] ?? key
    },
    [lang],
  )

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => useContext(TranslationContext)
