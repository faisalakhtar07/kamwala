import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../i18n/translations';

const STORAGE_KEY = 'kamwala_lang';
const LanguageContext = createContext(null);

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    // storage unavailable - fall through to default
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // t('key') -> string in the current language, falling back to English,
  // then to the key itself so a missing translation is visible, not blank.
  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en[key] ?? key,
    [lang]
  );

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
