import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

// ── Solarah i18n setup ───────────────────────────────────────────────────────
// English is the default language. Arabic is the only other supported
// language for now and triggers full RTL layout (see App.jsx + global.css).

const STORAGE_KEY = 'solarah-lang'

const savedLang = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export function setLanguage(lang) {
  i18n.changeLanguage(lang)
  localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

// Apply on initial load
if (typeof window !== 'undefined') {
  document.documentElement.lang = savedLang
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
}

export default i18n
